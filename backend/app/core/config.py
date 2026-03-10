from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl
from typing import List
import json


class Settings(BaseSettings):
    # App
    APP_NAME: str = "ATI Logistics Marketplace"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://ati_user:ati_password@postgres:5432/ati_db"

    # Redis
    REDIS_URL: str = "redis://:redis_password@redis:6379/0"

    # JWT
    SECRET_KEY: str = "change-me-to-a-very-long-random-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
