import pytest

from app.gateway.hermes_gateway import HermesGateway


class FakeHttpClient:
    def __init__(self):
        self.calls = []
        self.next_response = {}

    async def post(self, url, json):
        self.calls.append(("POST", url, json))
        return self.next_response.get("post", {"job_id": "remote-1", "status": "accepted"})

    async def get(self, url):
        self.calls.append(("GET", url, None))
        return self.next_response.get("get", {"status": "running", "progress": "50%"})


@pytest.mark.asyncio
async def test_submit_plan_returns_remote_job_id():
    client = FakeHttpClient()
    gw = HermesGateway(client, base_url="http://hermes:8000")

    result = await gw.submit_plan(task_id="task-1", context="implement feature X")

    assert result["job_id"] == "remote-1"
    assert any(c[0] == "POST" for c in client.calls)


@pytest.mark.asyncio
async def test_poll_plan_returns_remote_status():
    client = FakeHttpClient()
    client.next_response["get"] = {"status": "completed", "plan_text": "step 1: ..."}
    gw = HermesGateway(client, base_url="http://hermes:8000")

    result = await gw.poll_plan(remote_job_id="remote-1")

    assert result["status"] == "completed"
    assert "plan_text" in result


@pytest.mark.asyncio
async def test_submit_execution_returns_remote_job_id():
    client = FakeHttpClient()
    gw = HermesGateway(client, base_url="http://hermes:8000")

    result = await gw.submit_execution(task_id="task-1", approved_plan_snapshot={"steps": []})

    assert result["job_id"] == "remote-1"


@pytest.mark.asyncio
async def test_poll_execution_returns_remote_status():
    client = FakeHttpClient()
    client.next_response["get"] = {"status": "running", "progress": "step 2/4"}
    gw = HermesGateway(client, base_url="http://hermes:8000")

    result = await gw.poll_execution(remote_job_id="exec-1")

    assert result["status"] == "running"
