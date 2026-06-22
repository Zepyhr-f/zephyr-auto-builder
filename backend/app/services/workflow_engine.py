from app.models.task import TaskStatus


class WorkflowEngine:
    def __init__(self, repo):
        self._repo = repo

    def approve_plan(self, task_id: str, plan_id: str) -> None:
        plan = self._repo.get_plan(plan_id)
        if plan.status != "PendingApproval":
            raise ValueError(
                f"plan {plan_id} is not pending approval (status={plan.status})"
            )
        self._repo.update_plan_status(plan_id, "Approved")
        self._repo.set_approved_plan(task_id, plan_id)
        self._repo.update_task_status(task_id, TaskStatus.APPROVED.value)

    def reject_plan(self, task_id: str, plan_id: str) -> None:
        self._repo.update_plan_status(plan_id, "Rejected")
        self._repo.update_task_status(task_id, TaskStatus.REJECTED.value)

    def revise_plan(self, task_id: str, plan_id: str, comment: str = "") -> None:
        self._repo.update_plan_status(plan_id, "Revised")
        self._repo.update_task_status(task_id, TaskStatus.PLANNING.value)
