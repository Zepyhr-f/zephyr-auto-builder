from __future__ import annotations

from typing import Protocol
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.task import Task, TaskStatus


class TaskRepositoryProtocol(Protocol):
    async def create_task(self, title: str, source_type: str, task_type: str, source_payload: str = "") -> Task: ...
    async def get_task(self, task_id: UUID) -> Task | None: ...
    async def list_tasks(self, limit: int = 50, offset: int = 0) -> list[Task]: ...
    async def update_task_status(self, task_id: UUID, status: TaskStatus) -> None: ...
    async def set_current_plan(self, task_id: UUID, plan_id: UUID) -> None: ...
    async def set_approved_plan(self, task_id: UUID, plan_id: UUID) -> None: ...


class TaskRepository:
    def __init__(self, session: AsyncSession):
        self._session = session

    async def create_task(self, title: str, source_type: str, task_type: str, source_payload: str = "") -> Task:
        task = Task(
            title=title,
            source_type=source_type,
            task_type=task_type,
            source_payload=source_payload,
            status=TaskStatus.NEW,
            priority=0,
        )
        self._session.add(task)
        await self._session.flush()
        return task

    async def get_task(self, task_id: UUID) -> Task | None:
        result = await self._session.execute(select(Task).where(Task.id == task_id))
        return result.scalar_one_or_none()

    async def list_tasks(self, limit: int = 50, offset: int = 0) -> list[Task]:
        result = await self._session.execute(
            select(Task).order_by(Task.created_at.desc()).limit(limit).offset(offset)
        )
        return list(result.scalars().all())

    async def update_task_status(self, task_id: UUID, status: TaskStatus) -> None:
        task = await self.get_task(task_id)
        if task is not None:
            task.status = status
            await self._session.flush()

    async def set_current_plan(self, task_id: UUID, plan_id: UUID) -> None:
        task = await self.get_task(task_id)
        if task is not None:
            task.current_plan_id = plan_id
            await self._session.flush()

    async def set_approved_plan(self, task_id: UUID, plan_id: UUID) -> None:
        task = await self.get_task(task_id)
        if task is not None:
            task.approved_plan_id = plan_id
            await self._session.flush()
