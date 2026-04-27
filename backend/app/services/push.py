import asyncio
from functools import lru_cache

import firebase_admin
from firebase_admin import credentials, messaging

from ..config import get_settings


@lru_cache
def _initialize_app() -> firebase_admin.App:
    settings = get_settings()
    if not settings.firebase_credentials:
        raise RuntimeError("FIREBASE_CREDENTIALS is not configured")
    cred = credentials.Certificate(settings.firebase_credentials)
    return firebase_admin.initialize_app(cred)


DEEP_LINK_SCHEME = "meetingnotes"


async def send_push(token: str, meeting_id: str, summary: str) -> str:
    _initialize_app()
    body_preview = "Your meeting is ready! Tap to view."
    mid = str(meeting_id)
    message = messaging.Message(
        notification=messaging.Notification(title="Meeting ready", body=body_preview),
        data={
            "path": f"/meeting/{mid}",
            "url": f"{DEEP_LINK_SCHEME}:///meeting/{mid}",
            "meeting_id": mid,
        },
        token=token,
    )
    return await asyncio.to_thread(messaging.send, message)
