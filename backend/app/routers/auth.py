import httpx
from fastapi import APIRouter, Depends, HTTPException

from ..config import Settings, get_settings
from ..schemas import LoginRequest

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
async def login(req: LoginRequest, settings: Settings = Depends(get_settings)) -> dict:
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(
            f"{settings.supabase_url}/auth/v1/token",
            params={"grant_type": "password"},
            headers={
                "apikey": settings.supabase_service_role_key,
                "Content-Type": "application/json",
            },
            json={"email": req.email, "password": req.password},
        )
    if resp.status_code != 200:
        try:
            detail = resp.json()
        except ValueError:
            detail = {"error": resp.text}
        raise HTTPException(status_code=resp.status_code, detail=detail)
    return resp.json()
