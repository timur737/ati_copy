from datetime import timedelta
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token,
)
from app.core.config import settings
from app.models.user import User
from app.repositories.user import UserRepository
from app.schemas.auth import UserRegister, UserLogin, TokenPair


class AuthService:
    def __init__(self, db: AsyncSession, redis):
        self.db = db
        self.redis = redis
        self.repo = UserRepository(db)

    async def register(self, data: UserRegister) -> User:
        existing = await self.repo.get_by_email(data.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )
        user = User(
            email=data.email,
            password_hash=hash_password(data.password),
            role=data.role,
            company_name=data.company_name,
            phone=data.phone,
        )
        return await self.repo.create(user)

    async def login(self, data: UserLogin) -> TokenPair:
        user = await self.repo.get_by_email(data.email)
        if not user or not verify_password(data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive",
            )
        return TokenPair(
            access_token=create_access_token(user.id, extra={"role": user.role}),
            refresh_token=create_refresh_token(user.id),
        )

    async def refresh(self, refresh_token: str) -> TokenPair:
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )
        user_id = int(payload["sub"])
        user = await self.repo.get(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

        return TokenPair(
            access_token=create_access_token(user.id, extra={"role": user.role}),
            refresh_token=create_refresh_token(user.id),
        )

    async def logout(self, access_token: str) -> None:
        payload = decode_token(access_token)
        if payload:
            exp = payload.get("exp", 0)
            from datetime import datetime, timezone
            ttl = int(exp - datetime.now(timezone.utc).timestamp())
            if ttl > 0:
                await self.redis.setex(f"blacklist:{access_token}", ttl, "1")
