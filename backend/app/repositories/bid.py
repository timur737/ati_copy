from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.bid import Bid, BidStatus
from app.repositories.base import BaseRepository


class BidRepository(BaseRepository[Bid]):
    def __init__(self, db: AsyncSession):
        super().__init__(Bid, db)

    async def get_by_cargo(self, cargo_id: int) -> List[Bid]:
        result = await self.db.execute(
            select(Bid).where(Bid.cargo_id == cargo_id).order_by(Bid.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_by_carrier(self, carrier_id: int) -> List[Bid]:
        result = await self.db.execute(
            select(Bid).where(Bid.carrier_id == carrier_id).order_by(Bid.created_at.desc())
        )
        return list(result.scalars().all())

    async def exists(self, cargo_id: int, carrier_id: int) -> bool:
        result = await self.db.execute(
            select(Bid).where(
                Bid.cargo_id == cargo_id,
                Bid.carrier_id == carrier_id,
                Bid.status == BidStatus.pending,
            )
        )
        return result.scalar_one_or_none() is not None

    async def update_status(self, bid: Bid, status: BidStatus) -> Bid:
        bid.status = status
        await self.db.flush()
        await self.db.refresh(bid)
        return bid
