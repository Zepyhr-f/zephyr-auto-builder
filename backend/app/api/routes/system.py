from __future__ import annotations

from fastapi import APIRouter

router = APIRouter(prefix="/system", tags=["system"])


@router.get("/status")
async def system_status():
    return {"status": "ok", "version": "0.1.0"}
