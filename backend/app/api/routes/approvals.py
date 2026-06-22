from __future__ import annotations

from fastapi import APIRouter

from app.schemas.task import ApprovalCreate

router = APIRouter(prefix="/approvals", tags=["approvals"])


def get_workflow_engine():
    from app.api.dependencies import get_engine_instance
    return get_engine_instance()


@router.post("", status_code=202)
async def submit_approval(body: ApprovalCreate):
    engine = get_workflow_engine()
    if body.decision == "approve":
        await engine.approve_plan(task_id="", plan_id=str(body.plan_id))
    elif body.decision == "reject":
        await engine.reject_plan(task_id="", plan_id=str(body.plan_id))
    elif body.decision == "revise":
        await engine.revise_plan(task_id="", plan_id=str(body.plan_id), comment=body.review_comment)

    return {"status": "accepted", "decision": body.decision}
