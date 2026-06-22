from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session_factory
from app.models.task import Task, TaskStatus
from app.schemas.task import TaskCreate, TaskOut

router = APIRouter(prefix="/tasks", tags=["tasks"])

_in_memory_store: list[dict[str, Any]] = []


def _use_memory_store() -> bool:
    from app.core.config import get_settings
    return get_settings().database_url == ""


@router.post("", response_model=TaskOut, status_code=201)
async def create_task(body: TaskCreate):
    now = datetime.now(timezone.utc)
    task = {
        "id": str(uuid.uuid4()),
        "title": body.title,
        "source_type": body.source_type,
        "task_type": body.task_type,
        "status": TaskStatus.NEW.value,
        "priority": 0,
        "current_plan_id": None,
        "approved_plan_id": None,
        "created_at": now,
        "updated_at": now,
    }
    _in_memory_store.append(task)
    return task


@router.get("", response_model=list[TaskOut])
async def list_tasks(limit: int = 50, offset: int = 0):
    return _in_memory_store[offset : offset + limit]


@router.get("/{task_id}", response_model=TaskOut)
async def get_task(task_id: str):
    for task in _in_memory_store:
        if task["id"] == task_id:
            return task
    raise HTTPException(status_code=404, detail="task not found")


@router.get("/{task_id}/events")
async def get_task_events(task_id: str):
    return {"task_id": task_id, "events": []}
