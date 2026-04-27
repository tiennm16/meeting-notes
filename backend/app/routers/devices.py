from fastapi import APIRouter, Depends, Response, status

from ..deps import get_current_user_id
from ..schemas import PushTokenRequest
from ..services.supabase_client import upsert_device_token

router = APIRouter(tags=["devices"])


@router.post("/push-token", status_code=status.HTTP_204_NO_CONTENT)
async def save_push_token(
    body: PushTokenRequest,
    user_id: str = Depends(get_current_user_id),
) -> Response:
    upsert_device_token(user_id, body.push_token)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
