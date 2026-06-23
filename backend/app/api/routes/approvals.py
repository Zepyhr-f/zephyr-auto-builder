from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.schemas.task import ApprovalCreate
from app.storage import store
from app.models.task import TaskStatus

router = APIRouter(prefix="/approvals", tags=["approvals"])


@router.post("", status_code=202)
async def submit_approval(body: ApprovalCreate):
    plan_id = str(body.plan_id)
    plan = await store.get_plan(plan_id)
    if plan is None:
        raise HTTPException(status_code=404, detail="plan not found")

    task_id = plan["task_id"]

    if body.decision == "approve":
        await store.update_plan_status(plan_id, "Approved")
        await store.update_task(task_id, status=TaskStatus.APPROVED.value, approved_plan_id=plan_id)
        await store.add_event(task_id, "plan_approved", f"plan {plan_id} approved")
    elif body.decision == "reject":
        await store.update_plan_status(plan_id, "Rejected")
        await store.update_task(task_id, status=TaskStatus.REJECTED.value)
        await store.add_event(task_id, "plan_rejected", f"plan {plan_id} rejected")
    elif body.decision == "revise":
        await store.update_plan_status(plan_id, "Revised")
        await store.update_task(task_id, status=TaskStatus.NEW.value)
        await store.add_event(task_id, "plan_revised", f"plan {plan_id} revise requested: {body.review_comment}")

    return {"status": "accepted", "decision": body.decision}
