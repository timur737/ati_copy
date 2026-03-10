import math
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.cargo import Cargo
from app.models.user import User
from app.repositories.cargo import CargoRepository
from app.schemas.cargo import CargoCreate, CargoUpdate, CargoFilters, PaginatedCargo, CargoRead


class CargoService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = CargoRepository(db)

    async def create(self, data: CargoCreate, current_user: User) -> Cargo:
        cargo = Cargo(
            **data.model_dump(),
            created_by=current_user.id,
        )
        return await self.repo.create(cargo)

    async def get_or_404(self, cargo_id: int) -> Cargo:
        cargo = await self.repo.get(cargo_id)
        if not cargo:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cargo not found")
        return cargo

    async def search(
        self,
        filters: CargoFilters,
        page: int = 1,
        page_size: int = 20,
        sort_by: str = "created_at",
        order: str = "desc",
    ) -> PaginatedCargo:
        skip = (page - 1) * page_size
        items, total = await self.repo.search(
            filters, skip=skip, limit=page_size, sort_by=sort_by, order=order
        )
        return PaginatedCargo(
            items=[CargoRead.model_validate(i) for i in items],
            total=total,
            page=page,
            page_size=page_size,
            pages=math.ceil(total / page_size) if page_size else 1,
        )

    async def update(self, cargo_id: int, data: CargoUpdate, current_user: User) -> Cargo:
        cargo = await self.get_or_404(cargo_id)
        if cargo.created_by != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your cargo")
        return await self.repo.update(cargo, **data.model_dump(exclude_none=True))

    async def delete(self, cargo_id: int, current_user: User) -> None:
        cargo = await self.get_or_404(cargo_id)
        if cargo.created_by != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your cargo")
        await self.repo.delete(cargo_id)
