from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.plan import Plan


class PlanRepository:
    def __init__(self, session: AsyncSession):
        self._session = session

    async def create_plan(
        self,
        task_id: UUID,
        version: int,
        plan_text: str,
        plan_structured_json: str = "",
        risk_summary: str = "",
        expected_outputs: str = "",
        created_by: str = "hermes",
    ) -> Plan:
        plan = Plan(
            task_id=task_id,
            version=version,
            plan_text=plan_text,
            plan_structured_json=plan_structured_json,
            risk_summary=risk_summary,
            expected_outputs=expected_outputs,
            status="PendingApproval",
            created_by=created_by,
        )
        self._session.add(plan)
        await self._session.flush()
        return plan

    async def get_plan(self, plan_id: UUID) -> Plan | None:
        result = await self._session.execute(select(Plan).where(Plan.id == plan_id))
        return result.scalar_one_or_none()

    async def get_latest_plan_for_task(self, task_id: UUID) -> Plan | None:
        result = await self._session.execute(
            select(Plan).where(Plan.task_id == task_id).order_by(Plan.version.desc()).limit(1)
        )
        return result.scalar_one_or_none()

    async def update_plan_status(self, plan_id: UUID, status: str) -> None:
        plan = await self.get_plan(plan_id)
        if plan is not None:
            plan.status = status
            await self._session.flush()
