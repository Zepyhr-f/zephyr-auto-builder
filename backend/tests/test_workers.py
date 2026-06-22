import pytest

from app.workers.planning_worker import PlanningWorker
from app.workers.execution_worker import ExecutionWorker


class FakeTaskRepo:
    def __init__(self, tasks=None):
        self._tasks = tasks or []

    async def list_tasks_by_status(self, status, limit=10):
        return [t for t in self._tasks if t["status"] == status][:limit]

    async def update_task_status(self, task_id, status):
        for t in self._tasks:
            if t["id"] == task_id:
                t["status"] = status

    async def set_current_plan(self, task_id, plan_id):
        for t in self._tasks:
            if t["id"] == task_id:
                t["current_plan_id"] = plan_id

    async def set_approved_plan(self, task_id, plan_id):
        for t in self._tasks:
            if t["id"] == task_id:
                t["approved_plan_id"] = plan_id


class FakeHermesGateway:
    def __init__(self):
        self.plan_calls = []
        self.exec_calls = []

    async def submit_plan(self, task_id, context):
        self.plan_calls.append((task_id, context))
        return {"job_id": f"plan-{task_id}", "status": "accepted"}

    async def submit_execution(self, task_id, approved_plan_snapshot):
        self.exec_calls.append((task_id, approved_plan_snapshot))
        return {"job_id": f"exec-{task_id}", "status": "accepted"}


class FakeRemoteJobRepo:
    def __init__(self):
        self.created = []

    async def create_remote_job(self, task_id, plan_id, job_kind, hermes_job_id, request_payload):
        self.created.append({
            "task_id": task_id,
            "plan_id": plan_id,
            "job_kind": job_kind,
            "hermes_job_id": hermes_job_id,
            "request_payload": request_payload,
        })


@pytest.mark.asyncio
async def test_planning_worker_submits_new_tasks_to_hermes():
    tasks = [{"id": "t1", "title": "feat A", "status": "New", "source_type": "human"}]
    task_repo = FakeTaskRepo(tasks)
    gateway = FakeHermesGateway()
    remote_repo = FakeRemoteJobRepo()
    worker = PlanningWorker(task_repo=task_repo, gateway=gateway, remote_job_repo=remote_repo)

    await worker.tick()

    assert len(gateway.plan_calls) == 1
    assert gateway.plan_calls[0][0] == "t1"
    assert tasks[0]["status"] == "Planning"
    assert len(remote_repo.created) == 1


@pytest.mark.asyncio
async def test_planning_worker_skips_non_new_tasks():
    tasks = [{"id": "t1", "title": "feat A", "status": "Planning", "source_type": "human"}]
    task_repo = FakeTaskRepo(tasks)
    gateway = FakeHermesGateway()
    remote_repo = FakeRemoteJobRepo()
    worker = PlanningWorker(task_repo=task_repo, gateway=gateway, remote_job_repo=remote_repo)

    await worker.tick()

    assert len(gateway.plan_calls) == 0


@pytest.mark.asyncio
async def test_execution_worker_picks_approved_task():
    tasks = [{"id": "t1", "title": "feat A", "status": "Approved", "approved_plan_id": "p1"}]
    task_repo = FakeTaskRepo(tasks)
    gateway = FakeHermesGateway()
    remote_repo = FakeRemoteJobRepo()
    worker = ExecutionWorker(task_repo=task_repo, gateway=gateway, remote_job_repo=remote_repo)

    await worker.tick()

    assert len(gateway.exec_calls) == 1
    assert tasks[0]["status"] == "Executing"


@pytest.mark.asyncio
async def test_execution_worker_skips_when_no_approved_tasks():
    tasks = [{"id": "t1", "title": "feat A", "status": "Queued", "approved_plan_id": "p1"}]
    task_repo = FakeTaskRepo(tasks)
    gateway = FakeHermesGateway()
    remote_repo = FakeRemoteJobRepo()
    worker = ExecutionWorker(task_repo=task_repo, gateway=gateway, remote_job_repo=remote_repo)

    await worker.tick()

    assert len(gateway.exec_calls) == 0
