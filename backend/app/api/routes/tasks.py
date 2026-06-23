from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.schemas.task import TaskCreate, TaskOut, PlanOut
from app.storage import store

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.post("", response_model=TaskOut, status_code=201)
async def create_task(body: TaskCreate):
    task = await store.create_task(
        title=body.title,
        source_type=body.source_type,
        task_type=body.task_type,
        source_payload=body.source_payload,
    )
    return task


@router.get("", response_model=list[TaskOut])
async def list_tasks(limit: int = 50, offset: int = 0):
    return await store.list_tasks(limit=limit, offset=offset)


@router.get("/{task_id}", response_model=TaskOut)
async def get_task(task_id: str):
    task = await store.get_task(task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="task not found")
    return task


@router.get("/{task_id}/plans", response_model=list[PlanOut])
async def get_task_plans(task_id: str):
    return await store.get_plans_for_task(task_id)


@router.get("/{task_id}/events")
async def get_task_events(task_id: str):
    events = await store.get_events(task_id)
    return {"task_id": task_id, "events": events}
