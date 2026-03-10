"""WebSocket endpoint for real-time messaging.

Connection URL:  ws://localhost:8000/api/v1/ws/chat?token=<access_token>

Protocol (JSON over WS):
  Client → Server:
    { "type": "message", "receiver_id": 42, "text": "Hello!" }
    { "type": "ping" }                         ← keepalive

  Server → Client:
    { "type": "message",  ...MessageRead fields }
    { "type": "pong" }
    { "type": "error",  "detail": "..." }
    { "type": "online", "user_id": 42, "status": true/false }
"""

import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_token
from app.core.ws_manager import manager
from app.db.session import AsyncSessionLocal
from app.models.message import Message
from app.repositories.user import UserRepository
from app.repositories.message import MessageRepository

router = APIRouter(tags=["WebSocket"])


async def _authenticate(token: str) -> int | None:
    """Return user_id if token is valid, else None."""
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        return None
    return int(payload["sub"])


@router.websocket("/ws/chat")
async def websocket_chat(
    websocket: WebSocket,
    token: str = Query(..., description="JWT access token"),
):
    # ── Auth ─────────────────────────────────────────
    user_id = await _authenticate(token)
    if user_id is None:
        await websocket.close(code=4001, reason="Unauthorized")
        return

    await manager.connect(user_id, websocket)

    # Notify contacts that this user is now online
    async with AsyncSessionLocal() as db:
        msg_repo = MessageRepository(db)
        conversations = await msg_repo.get_conversations(user_id)
        contact_ids = {
            (m.sender_id if m.receiver_id == user_id else m.receiver_id)
            for m in conversations
        }
    for cid in contact_ids:
        await manager.send_to_user(cid, {"type": "online", "user_id": user_id, "status": True})

    try:
        while True:
            raw = await websocket.receive_text()

            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                await websocket.send_json({"type": "error", "detail": "Invalid JSON"})
                continue

            msg_type = data.get("type")

            # ── Ping / keepalive ─────────────────────
            if msg_type == "ping":
                await websocket.send_json({"type": "pong"})
                continue

            # ── Send message ─────────────────────────
            if msg_type == "message":
                receiver_id = data.get("receiver_id")
                text = (data.get("text") or "").strip()

                if not receiver_id or not text:
                    await websocket.send_json({"type": "error", "detail": "receiver_id and text are required"})
                    continue

                async with AsyncSessionLocal() as db:
                    # Verify receiver exists
                    user_repo = UserRepository(db)
                    receiver = await user_repo.get(receiver_id)
                    if not receiver:
                        await websocket.send_json({"type": "error", "detail": "Receiver not found"})
                        continue

                    # Persist to DB
                    msg_repo = MessageRepository(db)
                    msg = Message(sender_id=user_id, receiver_id=receiver_id, text=text)
                    saved = await msg_repo.create(msg)
                    await db.commit()
                    await db.refresh(saved)

                    payload = {
                        "type": "message",
                        "id": saved.id,
                        "sender_id": saved.sender_id,
                        "receiver_id": saved.receiver_id,
                        "text": saved.text,
                        "is_read": saved.is_read,
                        "created_at": saved.created_at.isoformat(),
                    }

                # Deliver to both sender (echo confirmation) and receiver
                await manager.broadcast([user_id, receiver_id], payload)
                continue

            await websocket.send_json({"type": "error", "detail": f"Unknown type: {msg_type}"})

    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)
        # Notify contacts this user went offline
        async with AsyncSessionLocal() as db:
            msg_repo = MessageRepository(db)
            conversations = await msg_repo.get_conversations(user_id)
            contact_ids = {
                (m.sender_id if m.receiver_id == user_id else m.receiver_id)
                for m in conversations
            }
        for cid in contact_ids:
            await manager.send_to_user(cid, {"type": "online", "user_id": user_id, "status": False})
