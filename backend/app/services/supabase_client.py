from functools import lru_cache

from supabase import create_client, Client

from ..config import get_settings


@lru_cache
def get_supabase() -> Client:
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


# meetings
def insert_meeting(row: dict) -> dict:
    res = get_supabase().table("meetings").insert(row).execute()
    return (res.data or [None])[0]


def fetch_meeting(meeting_id: str) -> dict | None:
    res = (
        get_supabase()
        .table("meetings")
        .select("*")
        .eq("id", meeting_id)
        .limit(1)
        .execute()
    )
    rows = res.data or []
    return rows[0] if rows else None


def list_meetings(user_id: str) -> list[dict]:
    res = (
        get_supabase()
        .table("meetings")
        .select("id,title,status,created_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return res.data or []


def update_meeting(meeting_id: str, fields: dict) -> None:
    get_supabase().table("meetings").update(fields).eq("id", meeting_id).execute()


# device tokens
def upsert_device_token(user_id: str, push_token: str) -> None:
    from datetime import datetime, timezone

    get_supabase().table("device_tokens").upsert(
        {
            "push_token": push_token,
            "user_id": user_id,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        },
        on_conflict="user_id",
    ).execute()


def list_device_tokens(user_id: str) -> list[str]:
    res = (
        get_supabase()
        .table("device_tokens")
        .select("push_token")
        .eq("user_id", user_id)
        .execute()
    )
    return [r["push_token"] for r in (res.data or []) if r.get("push_token")]
