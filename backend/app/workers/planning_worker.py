from __future__ import annotations

import logging

from app.models.task import TaskStatus

logger = logging.getLogger(__name__)


class PlanningWorker:
    def __init__(self, task_repo, gateway, remote_job_repo):
        self._task_repo = task_repo
        self._gateway = gateway
        self._remote_repo = remote_job_repo

    async def tick(self) -> None:
        tasks = await self._task_repo.list_tasks_by_status(TaskStatus.NEW.value, limit=5)

        for task in tasks:
            task_id = task["id"]
            context = task.get("title", "")

            try:
                result = await self._gateway.submit_plan(task_id=task_id, context=context)
                hermes_job_id = result.get("job_id", "")

                await self._remote_repo.create_remote_job(
                    task_id=task_id,
                    plan_id=task.get("current_plan_id"),
                    job_kind="planning",
                    hermes_job_id=hermes_job_id,
                    request_payload=context,
                )
                await self._task_repo.update_task_status(task_id, TaskStatus.PLANNING.value)
                logger.info("planning worker submitted task %s -> %s", task_id, hermes_job_id)
            except Exception:
                logger.exception("planning worker failed for task %s", task_id)
