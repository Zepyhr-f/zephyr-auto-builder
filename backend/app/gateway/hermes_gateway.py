from __future__ import annotations

import json
import logging
from typing import Any

import httpx
from pydantic import BaseModel

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class HermesPlanResult(BaseModel):
    job_id: str
    plan_text: str
    risk_summary: str = ""
    expected_outputs: str = ""


class HermesExecutionResult(BaseModel):
    job_id: str
    status: str
    result_summary: str = ""


class HermesGateway:
    def __init__(self, base_url: str | None = None, api_key: str | None = None):
        settings = get_settings()
        self._base_url = (base_url or settings.hermes_base_url).rstrip("/")
        self._api_key = api_key or settings.hermes_api_key
        self._client = httpx.AsyncClient(timeout=120.0)

    async def _chat(self, messages: list[dict], temperature: float = 0.7) -> str:
        response = await self._client.post(
            f"{self._base_url}/v1/chat/completions",
            headers={"Authorization": f"Bearer {self._api_key}"},
            json={
                "model": "default",
                "messages": messages,
                "temperature": temperature,
            },
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]

    async def submit_plan(self, task_id: str, context: str) -> dict:
        logger.info("submitting plan request for task %s", task_id)
        messages = [
            {
                "role": "system",
                "content": (
                    "You are Hermes, an AI execution system. You are in PLANNING PHASE ONLY.\n\n"
                    "CRITICAL RULES:\n"
                    "- DO NOT execute, implement, or write any code.\n"
                    "- DO NOT make any changes to files, repositories, or systems.\n"
                    "- DO NOT call any tools or perform any actions.\n"
                    "- Your ONLY job is to analyze the task and produce a plan.\n\n"
                    "Generate a structured execution plan that describes WHAT should be done, "
                    "but do NOT do it yourself. The plan will be reviewed by a human, and only "
                    "after approval will you be asked to execute it.\n\n"
                    "Output format: JSON with fields:\n"
                    '- plan_text: detailed step-by-step plan (what to do, not how to do it yet)\n'
                    '- risk_summary: potential risks and concerns\n'
                    '- expected_outputs: what the expected deliverables are\n\n'
                    "Respond ONLY with valid JSON, no markdown fences, no code execution."
                ),
            },
            {
                "role": "user",
                "content": f"Task ID: {task_id}\nTask: {context}\n\nAnalyze this task and generate a plan. Remember: PLANNING ONLY, do NOT execute anything.",
            },
        ]
        raw = await self._chat(messages, temperature=0.3)
        logger.info("hermes returned plan for task %s (len=%d)", task_id, len(raw))

        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            parsed = {"plan_text": raw, "risk_summary": "", "expected_outputs": ""}

        return {
            "job_id": f"plan-{task_id}",
            "plan_text": parsed.get("plan_text", raw),
            "risk_summary": parsed.get("risk_summary", ""),
            "expected_outputs": parsed.get("expected_outputs", ""),
        }

    async def submit_execution(self, task_id: str, approved_plan_snapshot: dict) -> dict:
        plan_text = approved_plan_snapshot.get("plan_text", "")
        logger.info("submitting execution for task %s", task_id)
        messages = [
            {
                "role": "system",
                "content": (
                    "You are Hermes, an AI execution system. "
                    "An approved plan is ready for execution. "
                    "Execute the plan and report the result in JSON with fields: "
                    "status, result_summary. "
                    "Use status 'succeeded' or 'failed'. "
                    "Respond ONLY with valid JSON, no markdown fences."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Task ID: {task_id}\n"
                    f"Approved Plan:\n{plan_text}\n\n"
                    f"Execute this plan and report the result."
                ),
            },
        ]
        raw = await self._chat(messages, temperature=0.2)
        logger.info("hermes returned execution result for task %s", task_id)

        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            parsed = {"status": "succeeded", "result_summary": raw}

        return {
            "job_id": f"exec-{task_id}",
            "status": parsed.get("status", "succeeded"),
            "result_summary": parsed.get("result_summary", raw),
        }

    async def close(self):
        await self._client.aclose()
