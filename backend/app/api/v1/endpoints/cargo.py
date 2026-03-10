from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_shipper
from app.db.session import get_db
from app.models.user import User
from app.schemas.cargo import (
    CargoCreate, CargoRead, CargoUpdate, CargoFilters, PaginatedCargo
)
from app.schemas.bid import BidRead
from app.services.cargo import CargoService
from app.repositories.bid import BidRepository

router = APIRouter(prefix="/cargo", tags=["Cargo"])


@router.get("", response_model=PaginatedCargo)
async def list_cargo(
    origin: Optional[str] = None,
    destination: Optional[str] = None,
    loading_date_from: Optional[str] = None,
    loading_date_to: Optional[str] = None,
    price_min: Optional[float] = None,
    price_max: Optional[float] = None,
    weight_min: Optional[float] = None,
    weight_max: Optional[float] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort_by: str = Query("created_at", pattern="^(created_at|price|weight|loading_date)$"),
    order: str = Query("desc", pattern="^(asc|desc)$"),
    db: AsyncSession = Depends(get_db),
):
    from datetime import date
    filters = CargoFilters(
        origin=origin,
        destination=destination,
        loading_date_from=date.fromisoformat(loading_date_from) if loading_date_from else None,
        loading_date_to=date.fromisoformat(loading_date_to) if loading_date_to else None,
        price_min=price_min,
        price_max=price_max,
        weight_min=weight_min,
        weight_max=weight_max,
    )
    svc = CargoService(db)
    return await svc.search(filters, page=page, page_size=page_size, sort_by=sort_by, order=order)


@router.post("", response_model=CargoRead, status_code=201)
async def create_cargo(
    body: CargoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_shipper),
):
    svc = CargoService(db)
    return await svc.create(body, current_user)


@router.get("/{cargo_id}", response_model=CargoRead)
async def get_cargo(cargo_id: int, db: AsyncSession = Depends(get_db)):
    svc = CargoService(db)
    return await svc.get_or_404(cargo_id)


@router.put("/{cargo_id}", response_model=CargoRead)
async def update_cargo(
    cargo_id: int,
    body: CargoUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = CargoService(db)
    return await svc.update(cargo_id, body, current_user)


@router.delete("/{cargo_id}", status_code=204)
async def delete_cargo(
    cargo_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = CargoService(db)
    await svc.delete(cargo_id, current_user)


@router.get("/{cargo_id}/bids", response_model=list[BidRead])
async def get_cargo_bids(
    cargo_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = BidRepository(db)
    return await repo.get_by_cargo(cargo_id)
