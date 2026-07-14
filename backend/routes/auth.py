from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
import logging
import traceback
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel

from database import get_db
from models import User, Integration

router = APIRouter()
logger = logging.getLogger(__name__)

class SyncUserRequest(BaseModel):
    id: str
    email: str
    name: str
    image_url: Optional[str] = None
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    provider: Optional[str] = "github"
    existing_user_id: Optional[str] = None

@router.post("/sync-user")
async def sync_user(req: SyncUserRequest, db: AsyncSession = Depends(get_db)):
    logger.info(f"Syncing user: {req.email} with ID: {req.id}, existing_user_id: {req.existing_user_id}")
    try:
        user = None
        if req.existing_user_id:
            # Try to fetch the currently logged-in user to link the new integration to their account
            result = await db.execute(select(User).where(User.id == req.existing_user_id))
            user = result.scalars().first()
            
        if not user:
            # Fallback to check if user already exists by email for account linking
            result = await db.execute(select(User).where(User.email == req.email))
            user = result.scalars().first()
        
        if not user:
            # First time logging in with this email/user
            user = User(id=req.id, email=req.email, name=req.name, image_url=req.image_url)
            db.add(user)
        else:
            # User exists. Only update profile details if we are NOT linking a different account
            if not req.existing_user_id:
                user.name = req.name
                user.image_url = req.image_url
            
        await db.commit()
        await db.refresh(user)
        
        if req.access_token and req.provider:
            # Check if integration already exists for this provider
            int_result = await db.execute(
                select(Integration).where(
                    Integration.user_id == user.id, 
                    Integration.tool_name == req.provider
                )
            )
            integration = int_result.scalars().first()
            
            if integration:
                integration.access_token = req.access_token
                if req.refresh_token:
                    integration.refresh_token = req.refresh_token
                integration.profile_name = req.name
                integration.profile_image = req.image_url
                integration.is_active = True
            else:
                new_integration = Integration(
                    user_id=user.id,
                    tool_name=req.provider,
                    access_token=req.access_token,
                    refresh_token=req.refresh_token,
                    profile_name=req.name,
                    profile_image=req.image_url,
                    is_active=True
                )
                db.add(new_integration)
            
            await db.commit()
            
        return {"user_id": user.id, "email": user.email, "name": user.name}
    except Exception as e:
        print(f"Error in sync_user: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class ConnectToolRequest(BaseModel):
    user_id: str
    tool_name: str # github, gmail

@router.post("/connect-tool")
async def connect_tool(req: ConnectToolRequest, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(
            select(Integration).where(
                Integration.user_id == req.user_id, 
                Integration.tool_name == req.tool_name
            )
        )
        integration = result.scalars().first()
        
        if not integration:
            integration = Integration(
                user_id=req.user_id,
                tool_name=req.tool_name,
                access_token=f"mock_{req.tool_name}_token",
                profile_name=f"Mock {req.tool_name.capitalize()} Profile",
                profile_image=None
            )
            db.add(integration)
        else:
            integration.is_active = True
            
        await db.commit()
        return {"status": "success", "tool": req.tool_name}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/disconnect-tool")
async def disconnect_tool(req: ConnectToolRequest, db: AsyncSession = Depends(get_db)):
    try:
        # For Gmail, the tool_name could be "gmail" or "google", so we handle both if requested.
        tool_names = ["google", "gmail"] if req.tool_name in ["google", "gmail"] else [req.tool_name]
        
        result = await db.execute(
            select(Integration).where(
                Integration.user_id == req.user_id, 
                Integration.tool_name.in_(tool_names)
            )
        )
        integrations = result.scalars().all()
        
        for integration in integrations:
            integration.is_active = False
            
        await db.commit()
        return {"status": "success", "tool": req.tool_name}
    except Exception as e:
        logger.error(f"Error disconnecting tool {req.tool_name}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status/{user_id}")
async def integration_status(user_id: str, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(Integration).where(Integration.user_id == user_id))
        integrations = result.scalars().all()
        
        # Build detailed status dictionary for each provider
        github_int = next((i for i in integrations if i.tool_name == "github"), None)
        gmail_int = next((i for i in integrations if i.tool_name in ["google", "gmail"]), None)
        slack_int = next((i for i in integrations if i.tool_name == "slack"), None)

        return {
            "github": {
                "connected": github_int.is_active if github_int else False,
                "name": github_int.profile_name if github_int else None,
                "image_url": github_int.profile_image if github_int else None
            },
            "gmail": {
                "connected": gmail_int.is_active if gmail_int else False,
                "name": gmail_int.profile_name if gmail_int else None,
                "image_url": gmail_int.profile_image if gmail_int else None
            },
            "slack": {
                "connected": slack_int.is_active if slack_int else False,
                "name": slack_int.profile_name if slack_int else None,
                "image_url": slack_int.profile_image if slack_int else None
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
