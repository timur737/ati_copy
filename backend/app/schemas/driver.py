from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class DriverCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=255)
    license_number: str = Field(..., min_length=2, max_length=100)
    passport_front_url: str = Field(..., min_length=1)
    passport_back_url: str = Field(..., min_length=1)


class DriverRead(BaseModel):
    id: int
    user_id: int
    full_name: str
    license_number: str
    passport_front_url: str
    passport_back_url: str
    moderation_status: str
    rejection_reason: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DriverModerate(BaseModel):
    """Used by admin to approve or reject a driver."""
    moderation_status: str  # "approved" or "rejected"
    rejection_reason: Optional[str] = None
