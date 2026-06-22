from __future__ import annotations

import logging

from app.models.task import TaskStatus

logger = logging.getLogger(__name__)


class ExecutionWorker:
    def __init__(self, task_repo, gateway, remote_job_repo):
        self._task_repo = task_repo
        self._gateway = gateway
        self._remote_repo = remote_job_repo

    async def tick(self) -> None:
        tasks = await self._task_repo.list_tasks_by_status(TaskStatus.APPROVED.value, limit=1)

        for task in tasks:
            task_id = task["id"]
            plan_snapshot = {"plan_id": task.get("approved_plan_id"), "steps": []}

            try:
                result = await self._gateway.submit_execution(
                    task_id=task_id, approved_plan_snapshot=plan_snapshot
                )
                hermes_job_id = result.get("job_id", "")

                await self._remote_repo.create_remote_job(
                    task_id=task_id,
                    plan_id=task.get("approved_plan_id"),
                    job_kind="execution",
                    hermes_job_id=hermes_job_id,
                    request_payload=str(plan_snapshot),
                )
                await self._task_repo.update_task_status(task_id, TaskStatus.EXECUTING.value)
                logger.info("execution worker started task %s -> %s", task_id, hermes_job_id)
            except Exception:
                logger.exception("execution worker failed for task %s", task_id)
