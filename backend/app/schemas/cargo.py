from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field
from app.models.cargo import CargoStatus


class CargoBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = None
    origin: str = Field(..., min_length=2, max_length=255)
    destination: str = Field(..., min_length=2, max_length=255)
    weight: float = Field(..., gt=0)
    volume: Optional[float] = None
    price: Optional[float] = None
    currency: str = Field(default="USD", max_length=10)
    loading_date: date


class CargoCreate(CargoBase):
    pass


class CargoUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    origin: Optional[str] = None
    destination: Optional[str] = None
    weight: Optional[float] = None
    volume: Optional[float] = None
    price: Optional[float] = None
    currency: Optional[str] = None
    loading_date: Optional[date] = None
    status: Optional[CargoStatus] = None


class CargoRead(CargoBase):
    id: int
    status: CargoStatus
    created_by: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CargoFilters(BaseModel):
    origin: Optional[str] = None
    destination: Optional[str] = None
    loading_date_from: Optional[date] = None
    loading_date_to: Optional[date] = None
    price_min: Optional[float] = None
    price_max: Optional[float] = None
    weight_min: Optional[float] = None
    weight_max: Optional[float] = None
    status: Optional[CargoStatus] = None


class PaginatedCargo(BaseModel):
    items: list[CargoRead]
    total: int
    page: int
    page_size: int
    pages: int
