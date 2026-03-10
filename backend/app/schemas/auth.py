from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from app.models.user import UserRole
from datetime import datetime


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    role: UserRole = UserRole.shipper
    company_name: Optional[str] = None
    phone: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserRead(BaseModel):
    id: int
    email: str
    role: UserRole
    company_name: Optional[str] = None
    phone: Optional[str] = None
    rating: float
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    company_name: Optional[str] = None
    phone: Optional[str] = None
