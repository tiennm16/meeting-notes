from .supabase_client import get_supabase
from ..config import get_settings


def upload_audio(path: str, data: bytes, content_type: str) -> None:
    settings = get_settings()
    get_supabase().storage.from_(settings.supabase_storage_bucket).upload(
        path,
        data,
        {"content-type": content_type, "upsert": "true"},
    )
