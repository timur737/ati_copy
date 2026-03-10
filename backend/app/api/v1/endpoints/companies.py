from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.company import Company
from app.schemas.review import CompanyCreate, CompanyRead

router = APIRouter(prefix="/companies", tags=["Companies"])


@router.post("", response_model=CompanyRead, status_code=201)
async def create_company(
    body: CompanyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = await db.execute(select(Company).where(Company.owner_id == current_user.id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="You already have a company profile")
    company = Company(name=body.name, country=body.country, owner_id=current_user.id)
    db.add(company)
    await db.flush()
    await db.refresh(company)
    return company


@router.get("/{company_id}", response_model=CompanyRead)
async def get_company(company_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


@router.get("", response_model=list[CompanyRead])
async def list_companies(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Company).order_by(Company.created_at.desc()).limit(100))
    return list(result.scalars().all())
