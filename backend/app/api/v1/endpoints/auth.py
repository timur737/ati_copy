from fastapi import APIRouter, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.redis_client import get_redis
from app.schemas.auth import UserRegister, UserLogin, TokenPair, RefreshRequest, UserRead
from app.services.auth import AuthService

router = APIRouter(prefix="/auth", tags=["Auth"])
bearer_scheme = HTTPBearer()


@router.post("/register", response_model=UserRead, status_code=201)
async def register(
    body: UserRegister,
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis),
):
    svc = AuthService(db, redis)
    user = await svc.register(body)
    return user


@router.post("/login", response_model=TokenPair)
async def login(
    body: UserLogin,
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis),
):
    svc = AuthService(db, redis)
    return await svc.login(body)


@router.post("/refresh", response_model=TokenPair)
async def refresh(
    body: RefreshRequest,
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis),
):
    svc = AuthService(db, redis)
    return await svc.refresh(body.refresh_token)


@router.post("/logout", status_code=204)
async def logout(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis),
):
    svc = AuthService(db, redis)
    await svc.logout(credentials.credentials)
