from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session_factory
from app.models.task import Task, TaskStatus
from app.models.plan import Plan, PlanStatus
from app.models.event_log import EventLog


def _task_to_dict(task: Task) -> dict:
    return {
        "id": str(task.id),
        "title": task.title,
        "source_type": task.source_type,
        "task_type": task.task_type,
        "source_payload": task.source_payload or "",
        "status": task.status.value if isinstance(task.status, TaskStatus) else str(task.status),
        "priority": task.priority,
        "current_plan_id": str(task.current_plan_id) if task.current_plan_id else None,
        "approved_plan_id": str(task.approved_plan_id) if task.approved_plan_id else None,
        "created_at": task.created_at,
        "updated_at": task.updated_at,
    }


def _plan_to_dict(plan: Plan, task_title: str = "", task_type: str = "") -> dict:
    return {
        "id": str(plan.id),
        "task_id": str(plan.task_id),
        "task_title": task_title,
        "task_type": task_type,
        "version": plan.version,
        "plan_text": plan.plan_text,
        "risk_summary": plan.risk_summary or "",
        "expected_outputs": str(plan.expected_outputs) if plan.expected_outputs else "",
        "status": plan.status.value if isinstance(plan.status, PlanStatus) else str(plan.status),
        "created_by": plan.created_by,
        "created_at": plan.created_at,
    }


def _event_to_dict(event: EventLog) -> dict:
    return {
        "id": str(event.id),
        "task_id": str(event.task_id),
        "event_type": event.event_type,
        "event_payload": str(event.event_payload) if event.event_payload else "",
        "created_at": event.created_at,
    }


class DatabaseStore:
    async def _session(self) -> AsyncSession:
        factory = get_session_factory()
        return factory()

    async def create_task(self, title: str, source_type: str, task_type: str, source_payload: str = "") -> dict:
        async with await self._session() as session:
            task = Task(
                title=title,
                source_type=source_type,
                task_type=task_type,
                source_payload=source_payload,
                status=TaskStatus.NEW,
                priority=100,
            )
            session.add(task)
            await session.commit()
            await session.refresh(task)
            result = _task_to_dict(task)
            await self.add_event(result["id"], "task_created", f"title={title}")
            return result

    async def get_task(self, task_id: str) -> dict | None:
        async with await self._session() as session:
            result = await session.execute(select(Task).where(Task.id == uuid.UUID(task_id)))
            task = result.scalar_one_or_none()
            return _task_to_dict(task) if task else None

    async def list_tasks(self, limit: int = 50, offset: int = 0) -> list[dict]:
        async with await self._session() as session:
            result = await session.execute(
                select(Task).order_by(Task.created_at.desc()).limit(limit).offset(offset)
            )
            return [_task_to_dict(t) for t in result.scalars().all()]

    async def list_by_status(self, status: str, limit: int = 10) -> list[dict]:
        async with await self._session() as session:
            task_status = TaskStatus(status)
            result = await session.execute(
                select(Task).where(Task.status == task_status).limit(limit)
            )
            return [_task_to_dict(t) for t in result.scalars().all()]

    async def update_task(self, task_id: str, **fields) -> None:
        if "status" in fields and isinstance(fields["status"], str):
            fields["status"] = TaskStatus(fields["status"])
        if "current_plan_id" in fields and fields["current_plan_id"]:
            fields["current_plan_id"] = uuid.UUID(fields["current_plan_id"])
        if "approved_plan_id" in fields and fields["approved_plan_id"]:
            fields["approved_plan_id"] = uuid.UUID(fields["approved_plan_id"])
        fields["updated_at"] = datetime.now(timezone.utc)

        async with await self._session() as session:
            await session.execute(
                update(Task).where(Task.id == uuid.UUID(task_id)).values(**fields)
            )
            await session.commit()

    async def add_plan(self, task_id: str, plan_text: str, risk_summary: str = "", expected_outputs: str = "") -> str:
        plan_id = str(uuid.uuid4())
        async with await self._session() as session:
            version_result = await session.execute(
                select(Plan).where(Plan.task_id == uuid.UUID(task_id))
            )
            version = len(version_result.scalars().all()) + 1

            plan = Plan(
                id=uuid.UUID(plan_id),
                task_id=uuid.UUID(task_id),
                version=version,
                plan_text=plan_text,
                risk_summary=risk_summary,
                expected_outputs=expected_outputs,
                status=PlanStatus.PENDING_APPROVAL,
                created_by="hermes",
            )
            session.add(plan)
            await session.commit()
        return plan_id

    async def get_plan(self, plan_id: str) -> dict | None:
        async with await self._session() as session:
            result = await session.execute(select(Plan).where(Plan.id == uuid.UUID(plan_id)))
            plan = result.scalar_one_or_none()
            if not plan:
                return None
            task_result = await session.execute(select(Task).where(Task.id == plan.task_id))
            task = task_result.scalar_one_or_none()
            return _plan_to_dict(plan, task.title if task else "", task.task_type if task else "")

    async def get_plans_for_task(self, task_id: str) -> list[dict]:
        async with await self._session() as session:
            result = await session.execute(
                select(Plan).where(Plan.task_id == uuid.UUID(task_id))
            )
            return [_plan_to_dict(p) for p in result.scalars().all()]

    async def list_pending_plans(self) -> list[dict]:
        async with await self._session() as session:
            result = await session.execute(
                select(Plan).where(Plan.status == PlanStatus.PENDING_APPROVAL)
                .order_by(Plan.created_at.desc())
            )
            plans = result.scalars().all()
            out = []
            for plan in plans:
                task_result = await session.execute(select(Task).where(Task.id == plan.task_id))
                task = task_result.scalar_one_or_none()
                out.append(_plan_to_dict(plan, task.title if task else "", task.task_type if task else ""))
            return out

    async def update_plan_status(self, plan_id: str, status: str) -> None:
        status_map = {
            "PendingApproval": PlanStatus.PENDING_APPROVAL,
            "Approved": PlanStatus.APPROVED,
            "Rejected": PlanStatus.REJECTED,
            "Revised": PlanStatus.PENDING_APPROVAL,
        }
        plan_status = status_map.get(status, PlanStatus.PENDING_APPROVAL)
        async with await self._session() as session:
            await session.execute(
                update(Plan).where(Plan.id == uuid.UUID(plan_id)).values(status=plan_status)
            )
            await session.commit()

    async def add_event(self, task_id: str, event_type: str, event_payload: str = "") -> None:
        async with await self._session() as session:
            event = EventLog(
                id=uuid.uuid4(),
                task_id=uuid.UUID(task_id),
                event_type=event_type,
                event_payload={"data": event_payload},
            )
            session.add(event)
            await session.commit()

    async def get_events(self, task_id: str) -> list[dict]:
        async with await self._session() as session:
            result = await session.execute(
                select(EventLog).where(EventLog.task_id == uuid.UUID(task_id))
                .order_by(EventLog.created_at.desc())
            )
            return [_event_to_dict(e) for e in result.scalars().all()]


store = DatabaseStore()
