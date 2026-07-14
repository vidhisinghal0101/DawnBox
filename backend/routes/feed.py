from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
import logging
import traceback
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime
from pydantic import BaseModel

from database import get_db
from models import Integration, UserFeedback
from agents.graph import run_fetch_only, run_analyze_only

router = APIRouter()
logger = logging.getLogger(__name__)

async def sync_resolution_to_provider(tool_name: str, external_id: str, access_token: str):
    async with httpx.AsyncClient() as client:
        try:
            if tool_name == "github":
                # GitHub: Mark single notification thread as read (PATCH /notifications/threads/{id})
                url = f"https://api.github.com/notifications/threads/{external_id}"
                headers = {
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/vnd.github.v3+json"
                }
                resp = await client.patch(url, headers=headers)
                logger.info(f"GitHub two-way sync response for thread {external_id}: {resp.status_code}")
                
            elif tool_name in ["google", "gmail"]:
                # Gmail: Remove UNREAD label (marking it as read)
                url = f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{external_id}/modify"
                headers = {
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json"
                }
                body = {
                    "removeLabelIds": ["UNREAD"]
                }
                resp = await client.post(url, json=body, headers=headers)
                logger.info(f"Gmail two-way sync response for message {external_id}: {resp.status_code}")
        except Exception as e:
            logger.error(f"Failed to sync resolution to {tool_name} for id {external_id}: {str(e)}")

class ResolveRequest(BaseModel):
    user_id: str
    tool_name: str
    external_id: str
    title: str
    content: str
    timestamp: str

@router.put("/resolve")
async def resolve_item(req: ResolveRequest, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    try:
        # If resolved within 30 minutes of creation, log as resolved_quickly user feedback
        try:
            # Parse ISO string (handle "Z" conversion for python ISO format compatibility)
            iso_str = req.timestamp.replace("Z", "+00:00")
            dt = datetime.fromisoformat(iso_str)
            # If naive, localize to utc
            if dt.tzinfo is None:
                from datetime import timezone
                dt = dt.replace(tzinfo=timezone.utc)
            
            if (datetime.now(dt.tzinfo) - dt).total_seconds() < 1800:
                feedback = UserFeedback(
                    user_id=req.user_id,
                    tool_name=req.tool_name,
                    title=req.title,
                    content=req.content,
                    action_taken="resolved_quickly"
                )
                db.add(feedback)
        except Exception as fe:
            logger.error(f"Failed to record resolved_quickly feedback: {fe}")

        # Get active integration for two-way sync
        tool_names = ["google", "gmail"] if req.tool_name in ["google", "gmail"] else [req.tool_name]
        int_result = await db.execute(
            select(Integration).where(
                Integration.user_id == req.user_id,
                Integration.tool_name.in_(tool_names),
                Integration.is_active == True
            )
        )
        integration = int_result.scalars().first()
        
        # Trigger background api call to GitHub/Gmail if it is a real OAuth token
        if integration and integration.access_token and not integration.access_token.startswith("mock_"):
            background_tasks.add_task(
                sync_resolution_to_provider, 
                req.tool_name, 
                req.external_id, 
                integration.access_token
            )
            
        await db.commit()
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Error resolving item {req.external_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

class FeedbackRequest(BaseModel):
    user_id: str
    tool_name: str
    title: str
    content: str
    action_taken: str

@router.post("/items/feedback")
async def save_feedback(req: FeedbackRequest, db: AsyncSession = Depends(get_db)):
    try:
        feedback = UserFeedback(
            user_id=req.user_id,
            tool_name=req.tool_name,
            title=req.title,
            content=req.content,
            action_taken=req.action_taken
        )
        db.add(feedback)
        await db.commit()
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Error saving feedback: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/fetch-data/{user_id}")
async def trigger_fetch(user_id: str):
    try:
        items = await run_fetch_only(user_id)
        return {"status": "success", "items": items}
    except Exception as e:
        logger.error(f"Error fetching data for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

class AnalyzeRequest(BaseModel):
    items: list

@router.post("/analyze-data/{user_id}")
async def trigger_analyze(user_id: str, req: AnalyzeRequest):
    try:
        analysis_results = await run_analyze_only(user_id, req.items)
        return {
            "status": "success",
            "items": analysis_results["prioritized_items"],
            "summary": analysis_results["summary"]
        }
    except Exception as e:
        logger.error(f"Error analyzing data for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
