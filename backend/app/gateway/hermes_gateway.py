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
                    "你是 Hermes，一个 AI 执行系统。你现在处于【规划阶段】。\n\n"
                    "严格规则：\n"
                    "- 不要执行、实现或编写任何代码。\n"
                    "- 不要对文件、仓库或系统做任何修改。\n"
                    "- 不要调用任何工具或执行任何动作。\n"
                    "- 你的唯一职责是分析任务并产出一份计划。\n\n"
                    "生成一份结构化的执行计划，描述【要做什么】，而不是【怎么做】。"
                    "该计划将由人工审核，只有在批准后才会要求你执行。\n\n"
                    "输出格式：必须是合法 JSON（不要 markdown 代码块、不要额外文字），字段如下：\n"
                    "- plan_text: 计划的整体概述（中文，1-3 句话）\n"
                    "- steps: 执行步骤数组，每个元素包含 title（步骤标题，中文）和 detail（步骤详细说明，中文）\n"
                    "- risk_summary: 潜在风险与顾虑（中文）\n"
                    "- expected_outputs: 预期交付物（中文）\n\n"
                    "所有字段必须使用中文回答。"
                ),
            },
            {
                "role": "user",
                "content": f"任务 ID: {task_id}\n任务: {context}\n\n请分析该任务并生成一份计划。切记：仅规划，不要执行任何操作。",
            },
        ]
        raw = await self._chat(messages, temperature=0.3)
        logger.info("hermes returned plan for task %s (len=%d)", task_id, len(raw))

        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            parsed = {"plan_text": raw, "steps": [], "risk_summary": "", "expected_outputs": ""}

        return {
            "job_id": f"plan-{task_id}",
            "plan_text": parsed.get("plan_text", ""),
            "steps": parsed.get("steps", []),
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
                    "你是 Hermes，一个 AI 执行系统。"
                    "一份已批准的计划已准备好执行。"
                    "请执行该计划并以 JSON 格式报告结果，字段如下："
                    "status（状态，取值 'succeeded' 或 'failed'）、"
                    "result_summary（结果摘要，中文）。"
                    "仅返回合法 JSON，不要 markdown 代码块。"
                    "所有内容必须使用中文回答。"
                ),
            },
            {
                "role": "user",
                "content": (
                    f"任务 ID: {task_id}\n"
                    f"已批准计划：\n{plan_text}\n\n"
                    f"请执行该计划并报告结果。"
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
