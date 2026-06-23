from __future__ import annotations

from fastapi import APIRouter

from app.storage import store

router = APIRouter(prefix="/plans", tags=["plans"])


@router.get("/pending")
async def list_pending_plans():
    return await store.list_pending_plans()
