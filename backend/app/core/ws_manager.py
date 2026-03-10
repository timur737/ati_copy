"""WebSocket Connection Manager

Manages per-user WebSocket connections in memory.
For multi-process/multi-worker deployments, swap the in-memory store
for Redis pub/sub (see the commented section below for a Redis-based
implementation reference).
"""

from typing import Dict, List
from fastapi import WebSocket
import json
import logging

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        # user_id -> list of active WebSocket connections
        # (a user can be connected on multiple tabs)
        self._connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, user_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections.setdefault(user_id, []).append(websocket)
        logger.info(f"[WS] user {user_id} connected  (active: {self.count()})")

    def disconnect(self, user_id: int, websocket: WebSocket) -> None:
        conns = self._connections.get(user_id, [])
        if websocket in conns:
            conns.remove(websocket)
        if not conns:
            self._connections.pop(user_id, None)
        logger.info(f"[WS] user {user_id} disconnected (active: {self.count()})")

    async def send_to_user(self, user_id: int, payload: dict) -> None:
        """Send a JSON payload to all connections of a specific user."""
        sockets = self._connections.get(user_id, [])
        dead = []
        for ws in sockets:
            try:
                await ws.send_json(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(user_id, ws)

    async def broadcast(self, user_ids: List[int], payload: dict) -> None:
        """Broadcast to multiple users (e.g., both sides of a conversation)."""
        for uid in user_ids:
            await self.send_to_user(uid, payload)

    def count(self) -> int:
        return sum(len(v) for v in self._connections.values())

    def is_online(self, user_id: int) -> bool:
        return user_id in self._connections and len(self._connections[user_id]) > 0


# Singleton — imported by both the WS router and message service
manager = ConnectionManager()
