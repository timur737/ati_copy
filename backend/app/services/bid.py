from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.bid import Bid, BidStatus
from app.models.cargo import CargoStatus
from app.models.user import User
from app.repositories.bid import BidRepository
from app.repositories.cargo import CargoRepository
from app.schemas.bid import BidCreate


class BidService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = BidRepository(db)
        self.cargo_repo = CargoRepository(db)

    async def place_bid(self, data: BidCreate, carrier: User) -> Bid:
        cargo = await self.cargo_repo.get(data.cargo_id)
        if not cargo or cargo.status != CargoStatus.open:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cargo not available for bidding",
            )
        if cargo.created_by == carrier.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot bid on your own cargo",
            )
        if await self.repo.exists(data.cargo_id, carrier.id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You already placed a bid on this cargo",
            )
        bid = Bid(
            cargo_id=data.cargo_id,
            carrier_id=carrier.id,
            price=data.price,
            message=data.message,
        )
        return await self.repo.create(bid)

    async def accept_bid(self, bid_id: int, shipper: User) -> Bid:
        bid = await self.repo.get(bid_id)
        if not bid:
            raise HTTPException(status_code=404, detail="Bid not found")
        cargo = await self.cargo_repo.get(bid.cargo_id)
        if cargo.created_by != shipper.id:
            raise HTTPException(status_code=403, detail="Not your cargo")
        if bid.status != BidStatus.pending:
            raise HTTPException(status_code=400, detail="Bid is not pending")

        # Accept this bid, reject others
        await self.repo.update_status(bid, BidStatus.accepted)
        others = await self.repo.get_by_cargo(bid.cargo_id)
        for other in others:
            if other.id != bid.id and other.status == BidStatus.pending:
                await self.repo.update_status(other, BidStatus.rejected)

        # Mark cargo as assigned
        await self.cargo_repo.update(cargo, status=CargoStatus.assigned)
        return bid

    async def reject_bid(self, bid_id: int, shipper: User) -> Bid:
        bid = await self.repo.get(bid_id)
        if not bid:
            raise HTTPException(status_code=404, detail="Bid not found")
        cargo = await self.cargo_repo.get(bid.cargo_id)
        if cargo.created_by != shipper.id:
            raise HTTPException(status_code=403, detail="Not your cargo")
        return await self.repo.update_status(bid, BidStatus.rejected)
