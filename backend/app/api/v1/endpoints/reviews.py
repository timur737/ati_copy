from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.review import Review
from app.repositories.user import UserRepository
from app.schemas.review import ReviewCreate, ReviewRead

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.post("", response_model=ReviewRead, status_code=201)
async def create_review(
    body: ReviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    review = Review(
        reviewer_id=current_user.id,
        reviewee_id=body.reviewee_id,
        cargo_id=body.cargo_id,
        rating=body.rating,
        comment=body.comment,
    )
    db.add(review)
    await db.flush()
    await db.refresh(review)

    # Update reviewee's average rating
    avg_result = await db.execute(
        select(func.avg(Review.rating)).where(Review.reviewee_id == body.reviewee_id)
    )
    new_avg = float(avg_result.scalar_one() or 0)
    repo = UserRepository(db)
    reviewee = await repo.get(body.reviewee_id)
    if reviewee:
        await repo.update(reviewee, rating=round(new_avg, 2))

    return review


@router.get("/user/{user_id}", response_model=list[ReviewRead])
async def get_user_reviews(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Review).where(Review.reviewee_id == user_id).order_by(Review.created_at.desc())
    )
    return list(result.scalars().all())
