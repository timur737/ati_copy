from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.v1.router import router as api_router
import app.models  # ensures all models are imported and mapped properly

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Freight exchange platform API",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── CORS ────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routes ──────────────────────────────────────────
app.include_router(api_router)


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": settings.APP_NAME}


@app.on_event("startup")
async def startup():
    # Warm up Redis pool on startup
    from app.redis_client import get_redis_pool
    await get_redis_pool()
