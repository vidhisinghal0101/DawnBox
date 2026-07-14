from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
import logging
import traceback
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc, or_
from datetime import datetime
from pydantic import BaseModel

from database import get_db
from models import Item, Summary
from agents.graph import run_pipeline, run_fetch_only, run_analyze_only

router = APIRouter()
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
async def resolve_item(item_id: int, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(Item).where(Item.id == item_id))
        item = result.scalars().first()
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        item.is_resolved = True
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
        item.snoozed_until = req.snoozed_until
        await db.commit()
        return {"status": "success", "snoozed_until": item.snoozed_until}
    except Exception as e:
        logger.error(f"Error snoozing item {item_id}: {str(e)}")
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
