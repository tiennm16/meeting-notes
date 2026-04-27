from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)


class PushTokenRequest(BaseModel):
    push_token: str = Field(..., min_length=1)


class MeetingSummary(BaseModel):
    id: UUID
    title: str | None
    status: str
    created_at: datetime


class MeetingDetail(MeetingSummary):
    audio_url: str | None
    transcript: str | None
    summary: str | None


class CreateMeetingResponse(BaseModel):
    meeting_id: UUID
    status: str


# Supabase auth response is forwarded as-is — typed as dict for flexibility.
LoginResponse = dict[str, Any]
