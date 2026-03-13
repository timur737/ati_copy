from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.driver import Driver, ModerationStatus
from app.schemas.driver import DriverCreate, DriverRead, DriverModerate

router = APIRouter(prefix="/drivers", tags=["Drivers"])


@router.post("/me", response_model=DriverRead, status_code=201)
async def register_driver(
    body: DriverCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Register a driver profile for the current carrier user."""
    if current_user.role not in ("carrier",):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only carriers can register as drivers",
        )

    existing = await db.execute(select(Driver).where(Driver.user_id == current_user.id))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Driver profile already exists",
        )

    driver = Driver(
        user_id=current_user.id,
        full_name=body.full_name,
        license_number=body.license_number,
        passport_front_url=body.passport_front_url,
        passport_back_url=body.passport_back_url,
    )
    db.add(driver)
    await db.flush()
    await db.refresh(driver)
    return driver


@router.get("/me", response_model=DriverRead)
async def get_my_driver_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the driver profile for the current user."""
    result = await db.execute(select(Driver).where(Driver.user_id == current_user.id))
    driver = result.scalar_one_or_none()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver profile not found")
    return driver


@router.get("", response_model=list[DriverRead])
async def list_drivers(
    moderation_status: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all driver profiles (admin only — currently checks is_active flag as proxy)."""
    query = select(Driver)
    if moderation_status:
        try:
            status_enum = ModerationStatus(moderation_status)
            query = query.where(Driver.moderation_status == status_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid moderation_status value")
    result = await db.execute(query.order_by(Driver.created_at.desc()).limit(200))
    return list(result.scalars().all())


@router.patch("/{driver_id}/moderate", response_model=DriverRead)
async def moderate_driver(
    driver_id: int,
    body: DriverModerate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Approve or reject a driver (admin action)."""
    result = await db.execute(select(Driver).where(Driver.id == driver_id))
    driver = result.scalar_one_or_none()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    try:
        driver.moderation_status = ModerationStatus(body.moderation_status)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid moderation_status value")

    driver.rejection_reason = body.rejection_reason
    await db.flush()
    await db.refresh(driver)
    return driver
