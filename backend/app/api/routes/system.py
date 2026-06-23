from __future__ import annotations

from fastapi import APIRouter

from app.storage import store

router = APIRouter(prefix="/system", tags=["system"])


@router.get("/status")
async def system_status():
    return {"status": "ok", "version": "0.1.0"}


@router.get("/components")
async def system_components():
    counts = await store.get_task_status_counts()
    planning_tasks = await store.get_active_tasks(["New", "Planning"])
    executing_tasks = await store.get_active_tasks(["Executing"])
    pending_approval_tasks = await store.get_active_tasks(["PendingApproval"])

    total = sum(counts.values())

    components = [
        {
            "id": "orchestrator",
            "name": "编排引擎",
            "desc": "Orchestrator Engine",
            "online": True,
            "metrics": {
                "总任务数": total,
                "待规划": counts.get("New", 0) + counts.get("Planning", 0),
                "待审核": counts.get("PendingApproval", 0),
                "执行中": counts.get("Executing", 0),
            },
        },
        {
            "id": "planning",
            "name": "规划通道",
            "desc": "Planning Lane · Hermes Gateway",
            "online": True,
            "metrics": {
                "队列长度": counts.get("New", 0) + counts.get("Planning", 0),
                "待审核": counts.get("PendingApproval", 0),
            },
            "active_tasks": [
                {"id": t["id"], "title": t["title"], "status": t["status"]}
                for t in planning_tasks
            ],
        },
        {
            "id": "approval",
            "name": "审核闸门",
            "desc": "Approval Gate · Human Review",
            "online": pending_approval_tasks or counts.get("PendingApproval", 0) > 0,
            "metrics": {
                "待审核数": counts.get("PendingApproval", 0),
            },
            "active_tasks": [
                {"id": t["id"], "title": t["title"], "status": t["status"]}
                for t in pending_approval_tasks
            ],
        },
        {
            "id": "execution",
            "name": "执行通道",
            "desc": "Execution Lane · Hermes Gateway",
            "online": True,
            "metrics": {
                "执行中": counts.get("Executing", 0),
                "已完成": counts.get("Succeeded", 0),
                "失败": counts.get("Failed", 0),
            },
            "active_tasks": [
                {"id": t["id"], "title": t["title"], "status": t["status"]}
                for t in executing_tasks
            ],
        },
    ]

    return {
        "status": "ok",
        "version": "0.1.0",
        "task_counts": counts,
        "total_tasks": total,
        "components": components,
    }
