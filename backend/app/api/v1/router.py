from fastapi import APIRouter

from app.api.v1.endpoints import auth, cargo, bids, messages, users, companies, reviews, drivers
from app.api.v1.endpoints import ws_chat

router = APIRouter(prefix="/api/v1")

router.include_router(auth.router)
router.include_router(cargo.router)
router.include_router(bids.router)
router.include_router(messages.router)
router.include_router(users.router)
router.include_router(companies.router)
router.include_router(reviews.router)
router.include_router(drivers.router)
router.include_router(ws_chat.router)
