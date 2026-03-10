from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.models.bid import BidStatus


class BidCreate(BaseModel):
    cargo_id: int
    price: float = Field(..., gt=0)
    message: Optional[str] = None


class BidRead(BaseModel):
    id: int
    cargo_id: int
    carrier_id: int
    price: float
    message: Optional[str] = None
    status: BidStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BidUpdate(BaseModel):
    price: Optional[float] = None
    message: Optional[str] = None
