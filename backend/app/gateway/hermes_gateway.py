from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)


class HermesGateway:
    def __init__(self, http_client: Any, base_url: str):
        self._client = http_client
        self._base_url = base_url.rstrip("/")

    async def submit_plan(self, task_id: str, context: str) -> dict:
        url = f"{self._base_url}/api/v1/plans"
        payload = {"task_id": task_id, "context": context}
        response = await self._client.post(url, json=payload)
        logger.info("submitted plan for task %s, got job_id=%s", task_id, response.get("job_id"))
        return response

    async def poll_plan(self, remote_job_id: str) -> dict:
        url = f"{self._base_url}/api/v1/plans/{remote_job_id}/status"
        response = await self._client.get(url)
        logger.info("polled plan %s, status=%s", remote_job_id, response.get("status"))
        return response

    async def submit_execution(self, task_id: str, approved_plan_snapshot: dict) -> dict:
        url = f"{self._base_url}/api/v1/executions"
        payload = {"task_id": task_id, "plan_snapshot": approved_plan_snapshot}
        response = await self._client.post(url, json=payload)
        logger.info("submitted execution for task %s, got job_id=%s", task_id, response.get("job_id"))
        return response

    async def poll_execution(self, remote_job_id: str) -> dict:
        url = f"{self._base_url}/api/v1/executions/{remote_job_id}/status"
        response = await self._client.get(url)
        logger.info("polled execution %s, status=%s", remote_job_id, response.get("status"))
        return response
