from app.models.approval import Approval
from app.models.plan import Plan
from app.models.remote_job import RemoteJobKind
from app.models.task import Task, TaskStatus


def test_domain_models_are_importable():
    assert Task.__tablename__ == "tasks"
    assert Plan.__tablename__ == "plans"
    assert Approval.__tablename__ == "approvals"
    assert RemoteJobKind.PLANNING.value == "planning"
    assert TaskStatus.NEW.value == "New"
