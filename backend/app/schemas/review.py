from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ReviewCreate(BaseModel):
    reviewee_id: int
    cargo_id: Optional[int] = None
    rating: float = Field(..., ge=1, le=5)
    comment: Optional[str] = None


class ReviewRead(BaseModel):
    id: int
    reviewer_id: int
    reviewee_id: int
    cargo_id: Optional[int] = None
    rating: float
    comment: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CompanyCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    country: Optional[str] = None


class CompanyRead(BaseModel):
    id: int
    name: str
    country: Optional[str] = None
    verification_status: str
    owner_id: int
    created_at: datetime

    class Config:
        from_attributes = True
