import pytest

from app.services.workflow_engine import WorkflowEngine


class FakeTask:
    def __init__(self, status="New"):
        self.status = status
        self.id = "task-1"
        self.title = "test task"
        self.current_plan_id = "plan-1"
        self.approved_plan_id = None


class FakePlan:
    def __init__(self, task_id="task-1", status="PendingApproval"):
        self.id = "plan-1"
        self.task_id = task_id
        self.status = status


class FakeRepo:
    def __init__(self, task=None, plan=None):
        self._task = task or FakeTask()
        self._plan = plan or FakePlan()
        self.updated_task_status = None
        self.updated_plan_status = None
        self.approved_plan_id = None

    def get_task(self, task_id):
        return self._task

    def get_plan(self, plan_id):
        return self._plan

    def update_task_status(self, task_id, status):
        self.updated_task_status = (task_id, status)

    def update_plan_status(self, plan_id, status):
        self.updated_plan_status = (plan_id, status)

    def set_approved_plan(self, task_id, plan_id):
        self.approved_plan_id = (task_id, plan_id)


def test_approve_transitions_task_to_approved():
    repo = FakeRepo()
    engine = WorkflowEngine(repo)

    engine.approve_plan("task-1", "plan-1")

    assert repo.updated_task_status == ("task-1", "Approved")
    assert repo.updated_plan_status == ("plan-1", "Approved")
    assert repo.approved_plan_id == ("task-1", "plan-1")


def test_reject_transitions_task_to_rejected():
    repo = FakeRepo()
    engine = WorkflowEngine(repo)

    engine.reject_plan("task-1", "plan-1")

    assert repo.updated_task_status == ("task-1", "Rejected")
    assert repo.updated_plan_status == ("plan-1", "Rejected")


def test_revise_sends_back_to_planning():
    repo = FakeRepo()
    engine = WorkflowEngine(repo)

    engine.revise_plan("task-1", "plan-1", comment="narrow scope")

    assert repo.updated_task_status == ("task-1", "Planning")
    assert repo.updated_plan_status == ("plan-1", "Revised")


def test_approve_raises_if_plan_not_pending():
    repo = FakeRepo(plan=FakePlan(status="Approved"))
    engine = WorkflowEngine(repo)

    with pytest.raises(ValueError, match="not pending approval"):
        engine.approve_plan("task-1", "plan-1")
