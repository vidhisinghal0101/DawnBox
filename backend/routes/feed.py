from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
import logging
import traceback
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc, or_
from datetime import datetime
from pydantic import BaseModel

from database import get_db
from models import Item, Summary, UserFeedback, Integration
from agents.graph import run_pipeline, run_fetch_only, run_analyze_only

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
logger = logging.getLogger(__name__)

@router.get("/items/{user_id}")
async def get_items(user_id: str, db: AsyncSession = Depends(get_db)):
    logger.info(f"Fetching items for user: {user_id}")
    try:
        result = await db.execute(
            select(Item)
            .where(Item.user_id == user_id)
            .where(or_(Item.snoozed_until == None, Item.snoozed_until <= datetime.utcnow()))
            .order_by(desc(Item.priority_score))
        )
        items = result.scalars().all()
        logger.info(f"Found {len(items)} items for user {user_id}")
        return items
    except Exception as e:
        logger.error(f"Error fetching items for {user_id}: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/items/{user_id}/snoozed")
async def get_snoozed_items(user_id: str, db: AsyncSession = Depends(get_db)):
    logger.info(f"Fetching snoozed items for user: {user_id}")
    try:
        result = await db.execute(
            select(Item)
            .where(Item.user_id == user_id)
            .where(Item.snoozed_until > datetime.utcnow())
            .order_by(Item.snoozed_until)
        )
        items = result.scalars().all()
        return items
    except Exception as e:
        logger.error(f"Error fetching snoozed items for {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/briefing/{user_id}")
async def get_briefing(user_id: str, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(
            select(Summary)
            .where(Summary.user_id == user_id)
            .order_by(desc(Summary.date))
            .limit(1)
        )
        summary = result.scalars().first()
        return {"content": summary.content if summary else "Your briefing is currently empty. Please fetch your notifications to receive your personalized summary."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/items/{item_id}/resolve")
async def resolve_item(item_id: int, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(Item).where(Item.id == item_id))
        item = result.scalars().first()
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        item.is_resolved = True
        
        # If resolved within 30 minutes of creation, log as resolved_quickly
        if item.timestamp and (datetime.utcnow() - item.timestamp).total_seconds() < 1800:
            feedback = UserFeedback(
                user_id=item.user_id,
                tool_name=item.tool_name,
                title=item.title,
                content=item.content,
                action_taken="resolved_quickly"
            )
            db.add(feedback)
            
        # Get active integration for two-way sync
        tool_names = ["google", "gmail"] if item.tool_name in ["google", "gmail"] else [item.tool_name]
        int_result = await db.execute(
            select(Integration).where(
                Integration.user_id == item.user_id,
                Integration.tool_name.in_(tool_names),
                Integration.is_active == True
            )
        )
        integration = int_result.scalars().first()
        
        # Trigger background api call to GitHub/Gmail if it is a real OAuth token
        if integration and integration.access_token and not integration.access_token.startswith("mock_"):
            background_tasks.add_task(
                sync_resolution_to_provider, 
                item.tool_name, 
                item.external_id, 
                integration.access_token
            )
            
        await db.commit()
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Error resolving item {item_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

class SnoozeRequest(BaseModel):
    snoozed_until: datetime

@router.post("/items/{item_id}/snooze")
async def snooze_item(item_id: int, req: SnoozeRequest, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(Item).where(Item.id == item_id))
        item = result.scalars().first()
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        
        # Convert timezone-aware datetime to naive UTC for Postgres compatibility
        snoozed_dt = req.snoozed_until
        if snoozed_dt.tzinfo is not None:
            from datetime import timezone
            snoozed_dt = snoozed_dt.astimezone(timezone.utc).replace(tzinfo=None)

        item.snoozed_until = snoozed_dt
        await db.commit()
        return {"status": "success", "snoozed_until": item.snoozed_until}
    except Exception as e:
        logger.error(f"Error snoozing item {item_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/items/{item_id}/unsnooze")
async def unsnooze_item(item_id: int, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(Item).where(Item.id == item_id))
        item = result.scalars().first()
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        item.snoozed_until = None
        await db.commit()
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Error unsnoozing item {item_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/trigger-pipeline/{user_id}")
async def trigger_pipeline(user_id: str, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    try:
        # Run the langgraph pipeline in the background
        background_tasks.add_task(run_pipeline, user_id)
        return {"status": "Pipeline triggered successfully in background."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/fetch-data/{user_id}")
async def trigger_fetch(user_id: str, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    try:
        background_tasks.add_task(run_fetch_only, user_id)
        return {"status": "Fetch triggered successfully in background."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze-data/{user_id}")
async def trigger_analyze(user_id: str, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    try:
        background_tasks.add_task(run_analyze_only, user_id)
        return {"status": "Analysis triggered successfully in background."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class FeedbackRequest(BaseModel):
    action_taken: str

@router.post("/items/{item_id}/feedback")
async def save_feedback(item_id: int, req: FeedbackRequest, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(Item).where(Item.id == item_id))
        item = result.scalars().first()
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        
        feedback = UserFeedback(
            user_id=item.user_id,
            tool_name=item.tool_name,
            title=item.title,
            content=item.content,
            action_taken=req.action_taken
        )
        db.add(feedback)
        await db.commit()
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Error saving feedback for item {item_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
