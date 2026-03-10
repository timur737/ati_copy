from sqlalchemy.ext.asyncio import AsyncSession

from app.models.message import Message
from app.models.user import User
from app.repositories.message import MessageRepository
from app.schemas.message import MessageCreate


class MessageService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = MessageRepository(db)

    async def send(self, data: MessageCreate, sender: User) -> Message:
        msg = Message(
            sender_id=sender.id,
            receiver_id=data.receiver_id,
            text=data.text,
        )
        return await self.repo.create(msg)

    async def get_thread(self, user_id: int, partner_id: int, skip: int = 0, limit: int = 50):
        return await self.repo.get_thread(user_id, partner_id, skip, limit)

    async def get_conversations(self, user_id: int):
        return await self.repo.get_conversations(user_id)
