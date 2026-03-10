from datetime import datetime
from pydantic import BaseModel, Field


class MessageCreate(BaseModel):
    receiver_id: int
    text: str = Field(..., min_length=1)


class MessageRead(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    text: str
    is_read: int
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationPreview(BaseModel):
    partner_id: int
    partner_email: str
    last_message: str
    last_message_at: datetime
    unread_count: int
