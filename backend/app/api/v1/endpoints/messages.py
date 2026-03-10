from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.message import MessageCreate, MessageRead
from app.services.message import MessageService

router = APIRouter(prefix="/messages", tags=["Messages"])


@router.get("", response_model=list[MessageRead])
async def get_conversations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = MessageService(db)
    return await svc.get_conversations(current_user.id)


@router.post("", response_model=MessageRead, status_code=201)
async def send_message(
    body: MessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = MessageService(db)
    return await svc.send(body, current_user)


@router.get("/{partner_id}", response_model=list[MessageRead])
async def get_thread(
    partner_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = MessageService(db)
    return await svc.get_thread(current_user.id, partner_id, skip, limit)
