from typing import List, Optional, Tuple
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.cargo import Cargo, CargoStatus
from app.repositories.base import BaseRepository
from app.schemas.cargo import CargoFilters


class CargoRepository(BaseRepository[Cargo]):
    def __init__(self, db: AsyncSession):
        super().__init__(Cargo, db)

    async def search(
        self,
        filters: CargoFilters,
        skip: int = 0,
        limit: int = 20,
        sort_by: str = "created_at",
        order: str = "desc",
    ) -> Tuple[List[Cargo], int]:
        conditions = []

        if filters.origin:
            conditions.append(Cargo.origin.ilike(f"%{filters.origin}%"))
        if filters.destination:
            conditions.append(Cargo.destination.ilike(f"%{filters.destination}%"))
        if filters.loading_date_from:
            conditions.append(Cargo.loading_date >= filters.loading_date_from)
        if filters.loading_date_to:
            conditions.append(Cargo.loading_date <= filters.loading_date_to)
        if filters.price_min is not None:
            conditions.append(Cargo.price >= filters.price_min)
        if filters.price_max is not None:
            conditions.append(Cargo.price <= filters.price_max)
        if filters.weight_min is not None:
            conditions.append(Cargo.weight >= filters.weight_min)
        if filters.weight_max is not None:
            conditions.append(Cargo.weight <= filters.weight_max)
        if filters.status:
            conditions.append(Cargo.status == filters.status)
        else:
            conditions.append(Cargo.status == CargoStatus.open)

        where_clause = and_(*conditions) if conditions else True

        # Count total matching rows
        count_q = select(func.count()).select_from(Cargo).where(where_clause)
        total = (await self.db.execute(count_q)).scalar_one()

        # Sort
        sort_col = getattr(Cargo, sort_by, Cargo.created_at)
        if order == "asc":
            sort_col = sort_col.asc()
        else:
            sort_col = sort_col.desc()

        # Fetch page
        q = select(Cargo).where(where_clause).order_by(sort_col).offset(skip).limit(limit)
        result = await self.db.execute(q)
        items = list(result.scalars().all())

        return items, total

    async def get_by_creator(self, user_id: int) -> List[Cargo]:
        result = await self.db.execute(
            select(Cargo).where(Cargo.created_by == user_id).order_by(Cargo.created_at.desc())
        )
        return list(result.scalars().all())

    async def update(self, cargo: Cargo, **kwargs) -> Cargo:
        for key, value in kwargs.items():
            if value is not None:
                setattr(cargo, key, value)
        await self.db.flush()
        await self.db.refresh(cargo)
        return cargo
