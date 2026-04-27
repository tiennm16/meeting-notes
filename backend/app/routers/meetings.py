import logging
import os
import tempfile
import uuid

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)

from ..config import get_settings
from ..deps import get_current_user_id
from ..schemas import CreateMeetingResponse, MeetingDetail, MeetingSummary
from ..services.push import send_push
from ..services.storage import upload_audio
from ..services.summarize import summarize
from ..services.supabase_client import (
    fetch_meeting,
    insert_meeting,
    list_device_tokens,
    list_meetings,
    update_meeting,
)
from ..services.transcribe import transcribe

logger = logging.getLogger("backend.meetings")

router = APIRouter(prefix="/meetings", tags=["meetings"])

_EXT_BY_CT = {
    "audio/m4a": "m4a",
    "audio/mp4": "m4a",
    "audio/x-m4a": "m4a",
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
    "audio/x-wav": "wav",
    "audio/webm": "webm",
    "audio/ogg": "ogg",
}


def _ext_for(audio: UploadFile) -> str:
    if audio.filename and "." in audio.filename:
        return audio.filename.rsplit(".", 1)[1].lower()
    return _EXT_BY_CT.get((audio.content_type or "").lower(), "m4a")


async def _run_pipeline(meeting_id: str, user_id: str, audio_path: str) -> None:
    try:
        transcript = await transcribe(audio_path)
        summary = await summarize(transcript)
        update_meeting(
            meeting_id,
            {"transcript": transcript, "summary": summary, "status": "done"},
        )
        tokens = list_device_tokens(user_id)
        if not tokens:
            logger.info("no device tokens for user %s; skipping notification", user_id)
        for token in tokens:
            try:
                await send_push(token, meeting_id, summary)
            except Exception:
                logger.exception("push failed for token %s", token[:12])
        logger.info("processed meeting %s", meeting_id)
    except Exception:
        logger.exception("pipeline failed for meeting %s", meeting_id)
        try:
            update_meeting(meeting_id, {"status": "failed"})
        except Exception:
            logger.exception("failed to mark meeting %s failed", meeting_id)
    finally:
        try:
            os.unlink(audio_path)
        except OSError:
            pass


@router.post("", status_code=status.HTTP_202_ACCEPTED, response_model=CreateMeetingResponse)
async def create_meeting(
    background: BackgroundTasks,
    audio: UploadFile = File(...),
    title: str | None = Form(default=None),
    user_id: str = Depends(get_current_user_id),
) -> CreateMeetingResponse:
    settings = get_settings()
    data = await audio.read()
    if len(data) == 0:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "empty audio")
    if len(data) > settings.max_audio_bytes:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "audio too large")

    meeting_id = str(uuid.uuid4())
    ext = _ext_for(audio)
    storage_path = f"{user_id}/{meeting_id}.{ext}"

    try:
        upload_audio(storage_path, data, audio.content_type or "application/octet-stream")
    except Exception as e:
        logger.exception("storage upload failed")
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"storage upload failed: {e}")

    insert_meeting(
        {
            "id": meeting_id,
            "user_id": user_id,
            "title": title,
            "status": "processing",
            "audio_url": storage_path,
        }
    )

    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=f".{ext}")
    try:
        tmp.write(data)
        tmp.close()
    except Exception:
        tmp.close()
        try:
            os.unlink(tmp.name)
        except OSError:
            pass
        raise

    background.add_task(_run_pipeline, meeting_id, user_id, tmp.name)
    return CreateMeetingResponse(meeting_id=meeting_id, status="processing")


@router.get("", response_model=list[MeetingSummary])
async def list_user_meetings(user_id: str = Depends(get_current_user_id)) -> list[dict]:
    return list_meetings(user_id)


@router.get("/{meeting_id}", response_model=MeetingDetail)
async def get_meeting(
    meeting_id: str,
    user_id: str = Depends(get_current_user_id),
) -> dict:
    row = fetch_meeting(meeting_id)
    if not row:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "meeting not found")
    if row.get("user_id") != user_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "not your meeting")
    return row
