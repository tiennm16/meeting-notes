from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    supabase_url: str
    supabase_service_role_key: str
    supabase_storage_bucket: str = "recordings"
    port: int = 8000
    max_audio_bytes: int = 25 * 1024 * 1024

    openai_api_key: str | None = None
    openai_transcription_model: str = "whisper-1"

    firebase_credentials: str | None = None

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False, extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
