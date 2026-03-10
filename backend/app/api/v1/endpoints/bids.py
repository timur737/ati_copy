from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_carrier
from app.db.session import get_db
from app.models.user import User
from app.schemas.bid import BidCreate, BidRead
from app.services.bid import BidService

router = APIRouter(prefix="/bids", tags=["Bids"])


@router.post("", response_model=BidRead, status_code=201)
async def place_bid(
    body: BidCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_carrier),
):
    svc = BidService(db)
    return await svc.place_bid(body, current_user)


@router.put("/{bid_id}/accept", response_model=BidRead)
async def accept_bid(
    bid_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = BidService(db)
    return await svc.accept_bid(bid_id, current_user)


@router.put("/{bid_id}/reject", response_model=BidRead)
async def reject_bid(
    bid_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = BidService(db)
    return await svc.reject_bid(bid_id, current_user)


@router.get("/my", response_model=list[BidRead])
async def my_bids(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.repositories.bid import BidRepository
    repo = BidRepository(db)
    return await repo.get_by_carrier(current_user.id)
