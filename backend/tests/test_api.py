from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import create_app


def test_create_task_returns_201():
    app = create_app()
    client = TestClient(app)

    response = client.post("/api/v1/tasks", json={
        "title": "implement feature X",
        "source_type": "human",
        "task_type": "requirement",
    })

    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "implement feature X"
    assert data["status"] == "New"


def test_list_tasks_returns_200():
    app = create_app()
    client = TestClient(app)

    response = client.get("/api/v1/tasks")

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_submit_approval_approve():
    app = create_app()
    client = TestClient(app)

    task_id = str(uuid4())
    plan_id = str(uuid4())

    with patch("app.api.routes.approvals.get_workflow_engine") as mock_get:
        engine = MagicMock()
        engine.approve_plan = AsyncMock()
        mock_get.return_value = engine

        response = client.post("/api/v1/approvals", json={
            "plan_id": plan_id,
            "decision": "approve",
            "review_comment": "looks good",
        })

        assert response.status_code == 202
        engine.approve_plan.assert_called_once()


def test_submit_approval_reject():
    app = create_app()
    client = TestClient(app)

    plan_id = str(uuid4())

    with patch("app.api.routes.approvals.get_workflow_engine") as mock_get:
        engine = MagicMock()
        engine.reject_plan = AsyncMock()
        mock_get.return_value = engine

        response = client.post("/api/v1/approvals", json={
            "plan_id": plan_id,
            "decision": "reject",
        })

        assert response.status_code == 202
        engine.reject_plan.assert_called_once()


def test_submit_approval_revise():
    app = create_app()
    client = TestClient(app)

    plan_id = str(uuid4())

    with patch("app.api.routes.approvals.get_workflow_engine") as mock_get:
        engine = MagicMock()
        engine.revise_plan = AsyncMock()
        mock_get.return_value = engine

        response = client.post("/api/v1/approvals", json={
            "plan_id": plan_id,
            "decision": "revise",
            "review_comment": "narrow scope to API only",
        })

        assert response.status_code == 202
        engine.revise_plan.assert_called_once()


def test_system_status_returns_200():
    app = create_app()
    client = TestClient(app)

    response = client.get("/api/v1/system/status")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "version" in data
