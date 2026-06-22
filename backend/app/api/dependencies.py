from __future__ import annotations

from app.services.workflow_engine import WorkflowEngine

_engine: WorkflowEngine | None = None


def get_engine_instance() -> WorkflowEngine:
    global _engine
    if _engine is None:
        _engine = WorkflowEngine(repo=_NullRepo())
    return _engine


class _NullRepo:
    def get_plan(self, plan_id):
        class _P:
            status = "PendingApproval"
        return _P()

    def update_plan_status(self, plan_id, status):
        pass

    def update_task_status(self, task_id, status):
        pass

    def set_approved_plan(self, task_id, plan_id):
        pass
