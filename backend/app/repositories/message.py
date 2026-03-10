from typing import List
from sqlalchemy import select, or_, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.message import Message
from app.repositories.base import BaseRepository


class MessageRepository(BaseRepository[Message]):
    def __init__(self, db: AsyncSession):
        super().__init__(Message, db)

    async def get_thread(
        self, user_id: int, partner_id: int, skip: int = 0, limit: int = 50
    ) -> List[Message]:
        result = await self.db.execute(
            select(Message)
            .where(
                or_(
                    and_(Message.sender_id == user_id, Message.receiver_id == partner_id),
                    and_(Message.sender_id == partner_id, Message.receiver_id == user_id),
                )
            )
            .order_by(Message.created_at.asc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_conversations(self, user_id: int) -> List[dict]:
        """Return the latest message per conversation partner."""
        subq = (
            select(
                func.greatest(Message.sender_id, Message.receiver_id).label("a"),
                func.least(Message.sender_id, Message.receiver_id).label("b"),
                func.max(Message.id).label("last_id"),
            )
            .where(
                or_(Message.sender_id == user_id, Message.receiver_id == user_id)
            )
            .group_by("a", "b")
            .subquery()
        )
        result = await self.db.execute(
            select(Message).join(subq, Message.id == subq.c.last_id)
            .order_by(Message.created_at.desc())
        )
        return list(result.scalars().all())
