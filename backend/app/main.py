import logging

from fastapi import FastAPI

from .routers import auth, devices, meetings

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Meeting Notes Backend")

app.include_router(auth.router)
app.include_router(devices.router)
app.include_router(meetings.router)


@app.get("/healthz")
async def healthz() -> dict:
    return {"status": "ok"}
