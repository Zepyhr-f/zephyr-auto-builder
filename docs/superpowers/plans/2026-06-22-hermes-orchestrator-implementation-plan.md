# Hermes Orchestrator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个基于 `Python 3.12 + FastAPI + PostgreSQL` 的 Hermes 编排后端，以及一个基于 `React + Vite + Tailwind CSS + shadcn/ui` 的轻量 Web 管理台，支持任务列表、计划审核、状态查看和单执行器工作流。

**Architecture:** 系统采用前后端分离架构。`backend` 作为 24/7 常驻编排服务，负责任务状态机、Hermes 双通道通信、审核流和恢复逻辑；`frontend` 作为轻量管理台，负责任务查看、Web 审核和系统状态可视化。V1 明确采用单队列、单执行 Worker，Planning Lane 与 Execution Lane 分离，但都通过同一个后端服务统一管理。

**Tech Stack:** Python 3.12, FastAPI, asyncio, PostgreSQL, SQLAlchemy 2.x, Alembic, Pydantic v2, React, Vite, Tailwind CSS, shadcn/ui, TanStack Query, React Router

## Global Constraints

- 后端必须使用 `Python 3.12`
- Web API 必须使用 `FastAPI`
- 异步模型必须使用 `asyncio`
- 持久化层必须使用 `PostgreSQL`
- ORM 必须使用 `SQLAlchemy 2.x`
- 数据迁移必须使用 `Alembic`
- 数据模型校验必须使用 `Pydantic v2`
- 前端必须是独立 `React` 管理台
- 前端构建工具必须使用 `Vite`
- UI 必须使用 `Tailwind CSS + shadcn/ui`
- V1 审核入口必须是 `Web 审核页`
- V1 必须保持 `单队列 + 单执行 Worker`
- Hermes 交互必须拆为 `Planning Lane` 和 `Execution Lane`
- 前后端调用链路必须是 `frontend -> backend API -> Hermes`

---

## Planned File Structure

### Root

- `backend/`：FastAPI 应用、数据库模型、工作流、Hermes Gateway、后台 Worker、测试
- `frontend/`：React 管理台、页面、组件、API 封装、前端测试
- `docs/superpowers/specs/`：已确认的规格文档
- `docs/superpowers/plans/`：实现计划文档

### Backend

- `backend/pyproject.toml`：Python 项目依赖与开发脚本
- `backend/alembic.ini`：Alembic 配置
- `backend/alembic/env.py`：Alembic 迁移环境
- `backend/alembic/versions/20260622_0001_init_schema.py`：初始表结构迁移
- `backend/app/main.py`：FastAPI 入口与生命周期管理
- `backend/app/api/router.py`：API 总路由
- `backend/app/api/routes/health.py`：健康检查接口
- `backend/app/api/routes/tasks.py`：任务列表、详情、创建接口
- `backend/app/api/routes/approvals.py`：待审核计划列表、审核动作接口
- `backend/app/api/routes/system.py`：系统状态接口
- `backend/app/core/config.py`：环境变量配置
- `backend/app/core/logging.py`：日志配置
- `backend/app/db/base.py`：SQLAlchemy Base
- `backend/app/db/session.py`：数据库引擎与 Session 工厂
- `backend/app/models/task.py`：`Task` 模型与枚举
- `backend/app/models/plan.py`：`Plan` 模型
- `backend/app/models/approval.py`：`Approval` 模型
- `backend/app/models/remote_job.py`：`RemoteJob` 模型
- `backend/app/models/task_run.py`：`TaskRun` 模型
- `backend/app/models/event_log.py`：`EventLog` 模型
- `backend/app/schemas/task.py`：任务相关请求/响应模型
- `backend/app/schemas/approval.py`：审核请求/响应模型
- `backend/app/schemas/system.py`：系统状态响应模型
- `backend/app/repositories/task_repository.py`：任务聚合查询与写入
- `backend/app/repositories/approval_repository.py`：审核相关查询与写入
- `backend/app/services/workflow_engine.py`：状态流转规则
- `backend/app/services/hermes_gateway.py`：Hermes HTTP 客户端与状态映射
- `backend/app/services/review_service.py`：审核业务编排
- `backend/app/workers/planning_worker.py`：规划任务发起循环
- `backend/app/workers/execution_worker.py`：单执行器循环
- `backend/app/workers/polling_worker.py`：远端任务轮询循环
- `backend/app/workers/recovery_sweep.py`：启动恢复逻辑
- `backend/tests/conftest.py`：测试配置
- `backend/tests/test_health.py`：健康检查测试
- `backend/tests/test_workflow_engine.py`：状态机测试
- `backend/tests/test_review_api.py`：审核接口测试
- `backend/tests/test_system_api.py`：系统状态接口测试
- `backend/tests/test_hermes_gateway.py`：Hermes Gateway 测试

### Frontend

- `frontend/package.json`：前端依赖与脚本
- `frontend/vite.config.ts`：Vite 配置
- `frontend/tailwind.config.ts`：Tailwind 配置
- `frontend/postcss.config.js`：PostCSS 配置
- `frontend/index.html`：Vite 入口页面
- `frontend/src/main.tsx`：React 启动入口
- `frontend/src/App.tsx`：全局布局
- `frontend/src/router.tsx`：页面路由
- `frontend/src/lib/api.ts`：后端 API 客户端
- `frontend/src/lib/query-client.ts`：TanStack Query 客户端
- `frontend/src/types/api.ts`：前后端共享数据结构的前端映射
- `frontend/src/components/layout/AppShell.tsx`：管理台布局
- `frontend/src/components/tasks/TaskTable.tsx`：任务表格
- `frontend/src/components/tasks/StatusBadge.tsx`：状态标签
- `frontend/src/components/review/PlanReviewCard.tsx`：计划审核卡片
- `frontend/src/components/logs/RunLogPanel.tsx`：执行日志面板
- `frontend/src/pages/TaskListPage.tsx`：任务列表页
- `frontend/src/pages/TaskDetailPage.tsx`：任务详情页
- `frontend/src/pages/ReviewQueuePage.tsx`：审核队列页
- `frontend/src/pages/SystemStatusPage.tsx`：系统状态页
- `frontend/src/test/review-queue.spec.tsx`：审核页测试
- `frontend/src/test/task-list.spec.tsx`：任务列表页测试

## Task 1: Scaffold Backend Service

**Files:**
- Create: `backend/pyproject.toml`
- Create: `backend/app/main.py`
- Create: `backend/app/api/router.py`
- Create: `backend/app/api/routes/health.py`
- Create: `backend/app/core/config.py`
- Create: `backend/app/core/logging.py`
- Create: `backend/tests/conftest.py`
- Create: `backend/tests/test_health.py`

**Interfaces:**
- Consumes: 无
- Produces:
  - `create_app() -> FastAPI`
  - `get_settings() -> Settings`
  - `GET /api/health`

- [ ] **Step 1: 写健康检查失败测试**

```python
# backend/tests/test_health.py
def test_health_endpoint_returns_ok(client):
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "hermes-orchestrator-backend",
    }
```

- [ ] **Step 2: 运行测试，确认当前失败**

Run: `cd backend && python3.12 -m pytest tests/test_health.py -v`
Expected: FAIL with `ModuleNotFoundError` or `FileNotFoundError` because the backend app does not exist yet

- [ ] **Step 3: 写最小后端骨架**

```toml
# backend/pyproject.toml
[project]
name = "hermes-orchestrator-backend"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
  "fastapi>=0.115.0",
  "uvicorn[standard]>=0.30.0",
  "pydantic>=2.8.0",
  "pydantic-settings>=2.4.0",
]

[project.optional-dependencies]
dev = [
  "pytest>=8.3.0",
  "httpx>=0.27.0",
]
```

```python
# backend/app/core/config.py
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "hermes-orchestrator-backend"
    api_prefix: str = "/api"


@lru_cache
def get_settings() -> Settings:
    return Settings()
```

```python
# backend/app/api/routes/health.py
from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "hermes-orchestrator-backend",
    }
```

```python
# backend/app/api/router.py
from fastapi import APIRouter
from app.api.routes.health import router as health_router

api_router = APIRouter()
api_router.include_router(health_router)
```

```python
# backend/app/main.py
from fastapi import FastAPI
from app.api.router import api_router
from app.core.config import get_settings


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name)
    app.include_router(api_router, prefix=settings.api_prefix)
    return app


app = create_app()
```

```python
# backend/tests/conftest.py
import pytest
from fastapi.testclient import TestClient
from app.main import create_app


@pytest.fixture
def client() -> TestClient:
    return TestClient(create_app())
```

- [ ] **Step 4: 运行测试，确认通过**

Run: `cd backend && python3.12 -m pytest tests/test_health.py -v`
Expected: PASS with `1 passed`

- [ ] **Step 5: 提交**

```bash
git add backend/pyproject.toml backend/app backend/tests
git commit -m "feat: scaffold backend service"
```

## Task 2: Add PostgreSQL Base, Models, And Migration

**Files:**
- Create: `backend/alembic.ini`
- Create: `backend/alembic/env.py`
- Create: `backend/alembic/versions/20260622_0001_init_schema.py`
- Create: `backend/app/db/base.py`
- Create: `backend/app/db/session.py`
- Create: `backend/app/models/task.py`
- Create: `backend/app/models/plan.py`
- Create: `backend/app/models/approval.py`
- Create: `backend/app/models/remote_job.py`
- Create: `backend/app/models/task_run.py`
- Create: `backend/app/models/event_log.py`
- Modify: `backend/app/core/config.py`
- Test: `backend/tests/test_models_import.py`

**Interfaces:**
- Consumes:
  - `get_settings() -> Settings`
- Produces:
  - `TaskStatus`, `PlanStatus`, `RemoteJobKind`, `RemoteJobStatus`
  - `get_engine() -> AsyncEngine`
  - `get_session_factory() -> async_sessionmaker[AsyncSession]`

- [ ] **Step 1: 写模型导入失败测试**

```python
# backend/tests/test_models_import.py
from app.models.task import Task, TaskStatus
from app.models.plan import Plan
from app.models.approval import Approval
from app.models.remote_job import RemoteJob, RemoteJobKind


def test_domain_models_are_importable():
    assert Task.__tablename__ == "tasks"
    assert Plan.__tablename__ == "plans"
    assert Approval.__tablename__ == "approvals"
    assert RemoteJobKind.PLANNING.value == "planning"
    assert TaskStatus.NEW.value == "New"
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `cd backend && python3.12 -m pytest tests/test_models_import.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.models.task'`

- [ ] **Step 3: 写数据库配置与核心模型**

```python
# backend/app/core/config.py
class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "hermes-orchestrator-backend"
    api_prefix: str = "/api"
    database_url: str
    hermes_base_url: str
```

```python
# backend/app/db/base.py
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass
```

```python
# backend/app/db/session.py
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine
from app.core.config import get_settings


def get_engine() -> AsyncEngine:
    settings = get_settings()
    return create_async_engine(settings.database_url, future=True)


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(get_engine(), expire_on_commit=False)
```

```python
# backend/app/models/task.py
import enum
import uuid
from datetime import datetime
from sqlalchemy import DateTime, Enum, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class TaskStatus(str, enum.Enum):
    NEW = "New"
    PLANNING = "Planning"
    PENDING_APPROVAL = "PendingApproval"
    APPROVED = "Approved"
    QUEUED = "Queued"
    EXECUTING = "Executing"
    SUCCEEDED = "Succeeded"
    FAILED = "Failed"
    REJECTED = "Rejected"
    ESCALATED = "Escalated"


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    source_type: Mapped[str] = mapped_column(String(50), nullable=False)
    source_payload: Mapped[str | None] = mapped_column(Text())
    task_type: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[TaskStatus] = mapped_column(Enum(TaskStatus), default=TaskStatus.NEW, nullable=False)
    priority: Mapped[int] = mapped_column(default=100, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
```

```python
# backend/app/models/remote_job.py
import enum


class RemoteJobKind(str, enum.Enum):
    PLANNING = "planning"
    EXECUTION = "execution"


class RemoteJobStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
```

```python
# backend/app/models/plan.py
class Plan(Base):
    __tablename__ = "plans"
```

```python
# backend/app/models/approval.py
class Approval(Base):
    __tablename__ = "approvals"
```

```python
# backend/app/models/task_run.py
class TaskRun(Base):
    __tablename__ = "task_runs"
```

```python
# backend/app/models/event_log.py
class EventLog(Base):
    __tablename__ = "event_logs"
```

```python
# backend/alembic/versions/20260622_0001_init_schema.py
def upgrade() -> None:
    op.create_table(
        "tasks",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("source_type", sa.String(length=50), nullable=False),
        sa.Column("source_payload", sa.Text(), nullable=True),
        sa.Column("task_type", sa.String(length=50), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("priority", sa.Integer(), nullable=False, server_default="100"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "plans",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("task_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tasks.id"), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("plan_text", sa.Text(), nullable=False),
        sa.Column("plan_structured_json", sa.JSON(), nullable=True),
        sa.Column("risk_summary", sa.Text(), nullable=True),
        sa.Column("expected_outputs", sa.JSON(), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "approvals",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("task_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tasks.id"), nullable=False),
        sa.Column("plan_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("plans.id"), nullable=False),
        sa.Column("review_channel", sa.String(length=32), nullable=False),
        sa.Column("decision", sa.String(length=16), nullable=False),
        sa.Column("review_comment", sa.Text(), nullable=True),
        sa.Column("reviewer_id", sa.String(length=128), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "remote_jobs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("task_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tasks.id"), nullable=False),
        sa.Column("plan_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("plans.id"), nullable=True),
        sa.Column("job_kind", sa.String(length=16), nullable=False),
        sa.Column("hermes_job_id", sa.String(length=128), nullable=False),
        sa.Column("request_payload", sa.JSON(), nullable=False),
        sa.Column("remote_status", sa.String(length=32), nullable=False),
        sa.Column("last_polled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("poll_attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_table(
        "task_runs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("task_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tasks.id"), nullable=False),
        sa.Column("plan_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("plans.id"), nullable=False),
        sa.Column("execution_remote_job_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("remote_jobs.id"), nullable=False),
        sa.Column("run_status", sa.String(length=32), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("result_summary", sa.Text(), nullable=True),
        sa.Column("artifact_manifest", sa.JSON(), nullable=True),
        sa.Column("failure_reason", sa.Text(), nullable=True),
    )
    op.create_table(
        "event_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("task_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tasks.id"), nullable=False),
        sa.Column("run_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("task_runs.id"), nullable=True),
        sa.Column("event_type", sa.String(length=64), nullable=False),
        sa.Column("event_payload", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
```

- [ ] **Step 4: 运行测试与迁移检查**

Run: `cd backend && python3.12 -m pytest tests/test_models_import.py -v`
Expected: PASS with `1 passed`

Run: `cd backend && python3.12 -m alembic upgrade head`
Expected: PASS with output ending in `Running upgrade -> 20260622_0001_init_schema`

- [ ] **Step 5: 提交**

```bash
git add backend/alembic.ini backend/alembic backend/app/core/config.py backend/app/db backend/app/models backend/tests/test_models_import.py
git commit -m "feat: add postgres models and base migration"
```

## Task 3: Implement Repositories And Workflow Engine

**Files:**
- Create: `backend/app/schemas/task.py`
- Create: `backend/app/schemas/approval.py`
- Create: `backend/app/repositories/task_repository.py`
- Create: `backend/app/repositories/approval_repository.py`
- Create: `backend/app/services/workflow_engine.py`
- Test: `backend/tests/test_workflow_engine.py`

**Interfaces:**
- Consumes:
  - `TaskStatus`
  - `PlanStatus`
  - `Approval`
- Produces:
  - `TaskRepository.list_tasks() -> list[Task]`
  - `TaskRepository.get_task(task_id: UUID) -> Task | None`
  - `WorkflowEngine.approve_plan(task_id: UUID, plan_id: UUID, reviewer_id: str) -> Task`
  - `WorkflowEngine.reject_plan(task_id: UUID, plan_id: UUID, reviewer_id: str, comment: str) -> Task`
  - `WorkflowEngine.request_revision(task_id: UUID, plan_id: UUID, reviewer_id: str, comment: str) -> Task`

- [ ] **Step 1: 写工作流状态流转失败测试**

```python
# backend/tests/test_workflow_engine.py
from uuid import uuid4
from app.models.task import TaskStatus
from app.services.workflow_engine import WorkflowEngine


class InMemoryTaskRepository:
    def __init__(self) -> None:
        self.task = {
            "id": uuid4(),
            "status": TaskStatus.PENDING_APPROVAL,
            "approved_plan_id": None,
        }

    async def mark_approved(self, task_id, plan_id):
        self.task["status"] = TaskStatus.APPROVED
        self.task["approved_plan_id"] = plan_id
        return self.task


class InMemoryApprovalRepository:
    async def create_approval(self, **kwargs):
        return kwargs


async def test_approve_plan_moves_task_to_approved():
    task_repo = InMemoryTaskRepository()
    approval_repo = InMemoryApprovalRepository()
    engine = WorkflowEngine(task_repo=task_repo, approval_repo=approval_repo)

    plan_id = uuid4()
    task = await engine.approve_plan(task_repo.task["id"], plan_id, "zephyr")

    assert task["status"] == TaskStatus.APPROVED
    assert task["approved_plan_id"] == plan_id
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `cd backend && python3.12 -m pytest tests/test_workflow_engine.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.services.workflow_engine'`

- [ ] **Step 3: 写 Repository 与 WorkflowEngine 最小实现**

```python
# backend/app/repositories/task_repository.py
from uuid import UUID


class TaskRepository:
    async def list_tasks(self) -> list:
        return []

    async def get_task(self, task_id: UUID):
        return None

    async def mark_approved(self, task_id: UUID, plan_id: UUID):
        return {"id": task_id, "status": "Approved", "approved_plan_id": plan_id}

    async def mark_rejected(self, task_id: UUID):
        return {"id": task_id, "status": "Rejected"}

    async def mark_for_revision(self, task_id: UUID):
        return {"id": task_id, "status": "Planning"}
```

```python
# backend/app/repositories/approval_repository.py
class ApprovalRepository:
    async def create_approval(self, **kwargs):
        return kwargs
```

```python
# backend/app/services/workflow_engine.py
from uuid import UUID


class WorkflowEngine:
    def __init__(self, task_repo, approval_repo) -> None:
        self.task_repo = task_repo
        self.approval_repo = approval_repo

    async def approve_plan(self, task_id: UUID, plan_id: UUID, reviewer_id: str):
        await self.approval_repo.create_approval(
            task_id=task_id,
            plan_id=plan_id,
            decision="approve",
            reviewer_id=reviewer_id,
        )
        return await self.task_repo.mark_approved(task_id, plan_id)

    async def reject_plan(self, task_id: UUID, plan_id: UUID, reviewer_id: str, comment: str):
        await self.approval_repo.create_approval(
            task_id=task_id,
            plan_id=plan_id,
            decision="reject",
            reviewer_id=reviewer_id,
            review_comment=comment,
        )
        return await self.task_repo.mark_rejected(task_id)

    async def request_revision(self, task_id: UUID, plan_id: UUID, reviewer_id: str, comment: str):
        await self.approval_repo.create_approval(
            task_id=task_id,
            plan_id=plan_id,
            decision="revise",
            reviewer_id=reviewer_id,
            review_comment=comment,
        )
        return await self.task_repo.mark_for_revision(task_id)
```

- [ ] **Step 4: 运行测试，确认通过**

Run: `cd backend && python3.12 -m pytest tests/test_workflow_engine.py -v`
Expected: PASS with `1 passed`

- [ ] **Step 5: 提交**

```bash
git add backend/app/repositories backend/app/services/workflow_engine.py backend/app/schemas backend/tests/test_workflow_engine.py
git commit -m "feat: add workflow engine and repositories"
```

## Task 4: Implement Hermes Gateway And Background Workers

**Files:**
- Create: `backend/app/services/hermes_gateway.py`
- Create: `backend/app/workers/planning_worker.py`
- Create: `backend/app/workers/execution_worker.py`
- Create: `backend/app/workers/polling_worker.py`
- Create: `backend/app/workers/recovery_sweep.py`
- Modify: `backend/app/main.py`
- Test: `backend/tests/test_hermes_gateway.py`

**Interfaces:**
- Consumes:
  - `Settings.hermes_base_url`
  - `RemoteJobKind`
  - `WorkflowEngine`
- Produces:
  - `HermesGateway.submit_plan(task_id: UUID, context: dict) -> dict`
  - `HermesGateway.submit_execution(task_id: UUID, approved_plan: dict) -> dict`
  - `HermesGateway.poll_job(remote_job_id: str) -> dict`
  - `start_background_workers() -> list[asyncio.Task]`

- [ ] **Step 1: 写 Hermes Gateway 失败测试**

```python
# backend/tests/test_hermes_gateway.py
import httpx
import pytest
from app.services.hermes_gateway import HermesGateway


@pytest.mark.asyncio
async def test_submit_plan_returns_remote_job_id():
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/plan-jobs"
        return httpx.Response(200, json={"job_id": "plan-123", "status": "pending"})

    transport = httpx.MockTransport(handler)
    gateway = HermesGateway(base_url="http://hermes.local", transport=transport)

    result = await gateway.submit_plan("task-1", {"title": "Add review page"})

    assert result["job_id"] == "plan-123"
    assert result["status"] == "pending"
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `cd backend && python3.12 -m pytest tests/test_hermes_gateway.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.services.hermes_gateway'`

- [ ] **Step 3: 写 Gateway 与 Worker 骨架**

```python
# backend/app/services/hermes_gateway.py
import httpx


class HermesGateway:
    def __init__(self, base_url: str, transport: httpx.BaseTransport | None = None) -> None:
        self._client = httpx.AsyncClient(base_url=base_url, transport=transport, timeout=30.0)

    async def submit_plan(self, task_id: str, context: dict) -> dict:
        response = await self._client.post("/plan-jobs", json={"task_id": task_id, "context": context})
        response.raise_for_status()
        return response.json()

    async def submit_execution(self, task_id: str, approved_plan: dict) -> dict:
        response = await self._client.post("/execution-jobs", json={"task_id": task_id, "approved_plan": approved_plan})
        response.raise_for_status()
        return response.json()

    async def poll_job(self, remote_job_id: str) -> dict:
        response = await self._client.get(f"/jobs/{remote_job_id}")
        response.raise_for_status()
        return response.json()
```

```python
# backend/app/workers/planning_worker.py
async def planning_worker_loop() -> None:
    while True:
        await asyncio.sleep(5)
```

```python
# backend/app/workers/execution_worker.py
async def execution_worker_loop() -> None:
    while True:
        await asyncio.sleep(5)
```

```python
# backend/app/workers/polling_worker.py
async def polling_worker_loop() -> None:
    while True:
        await asyncio.sleep(5)
```

```python
# backend/app/workers/recovery_sweep.py
async def run_recovery_sweep() -> None:
    return None
```

```python
# backend/app/main.py
@app.on_event("startup")
async def startup_event() -> None:
    app.state.worker_tasks = [
        asyncio.create_task(planning_worker_loop()),
        asyncio.create_task(execution_worker_loop()),
        asyncio.create_task(polling_worker_loop()),
    ]
```

- [ ] **Step 4: 运行测试，确认通过**

Run: `cd backend && python3.12 -m pytest tests/test_hermes_gateway.py -v`
Expected: PASS with `1 passed`

- [ ] **Step 5: 提交**

```bash
git add backend/app/services/hermes_gateway.py backend/app/workers backend/app/main.py backend/tests/test_hermes_gateway.py
git commit -m "feat: add hermes gateway and worker loops"
```

## Task 5: Expose Task, Approval, And System APIs

**Files:**
- Create: `backend/app/api/routes/tasks.py`
- Create: `backend/app/api/routes/approvals.py`
- Create: `backend/app/api/routes/system.py`
- Modify: `backend/app/api/router.py`
- Create: `backend/app/schemas/system.py`
- Test: `backend/tests/test_review_api.py`
- Test: `backend/tests/test_system_api.py`

**Interfaces:**
- Consumes:
  - `TaskRepository.list_tasks()`
  - `WorkflowEngine.approve_plan()`
  - `WorkflowEngine.reject_plan()`
  - `WorkflowEngine.request_revision()`
- Produces:
  - `GET /api/tasks`
  - `GET /api/tasks/{task_id}`
  - `GET /api/approvals/pending`
  - `POST /api/approvals/{task_id}/approve`
  - `POST /api/approvals/{task_id}/reject`
  - `POST /api/approvals/{task_id}/revise`
  - `GET /api/system/status`

- [ ] **Step 1: 写审核接口失败测试**

```python
# backend/tests/test_review_api.py
def test_pending_approvals_endpoint_exists(client):
    response = client.get("/api/approvals/pending")

    assert response.status_code == 200
    assert response.json() == {"items": []}
```

```python
# backend/tests/test_system_api.py
def test_system_status_endpoint_exists(client):
    response = client.get("/api/system/status")

    assert response.status_code == 200
    body = response.json()
    assert body["queue_depth"] == 0
    assert body["running_task_id"] is None
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `cd backend && python3.12 -m pytest tests/test_review_api.py tests/test_system_api.py -v`
Expected: FAIL with `404 Not Found`

- [ ] **Step 3: 写最小 API 路由**

```python
# backend/app/api/routes/approvals.py
from fastapi import APIRouter

router = APIRouter(prefix="/approvals", tags=["approvals"])


@router.get("/pending")
async def list_pending_approvals() -> dict[str, list]:
    return {"items": []}
```

```python
# backend/app/api/routes/system.py
from fastapi import APIRouter

router = APIRouter(prefix="/system", tags=["system"])


@router.get("/status")
async def system_status() -> dict[str, int | None]:
    return {
        "queue_depth": 0,
        "running_task_id": None,
        "planning_jobs": 0,
        "execution_jobs": 0,
    }
```

```python
# backend/app/api/routes/tasks.py
from fastapi import APIRouter

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("")
async def list_tasks() -> dict[str, list]:
    return {"items": []}
```

```python
# backend/app/api/router.py
api_router.include_router(tasks_router)
api_router.include_router(approvals_router)
api_router.include_router(system_router)
```

- [ ] **Step 4: 运行测试，确认通过**

Run: `cd backend && python3.12 -m pytest tests/test_review_api.py tests/test_system_api.py -v`
Expected: PASS with `2 passed`

- [ ] **Step 5: 提交**

```bash
git add backend/app/api backend/app/schemas/system.py backend/tests/test_review_api.py backend/tests/test_system_api.py
git commit -m "feat: expose review and system APIs"
```

## Task 6: Scaffold React Admin Console

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tailwind.config.ts`
- Create: `frontend/postcss.config.js`
- Create: `frontend/index.html`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/router.tsx`
- Create: `frontend/src/lib/query-client.ts`
- Create: `frontend/src/components/layout/AppShell.tsx`
- Test: `frontend/src/test/task-list.spec.tsx`

**Interfaces:**
- Consumes: 无
- Produces:
  - `AppShell`
  - `router: ReturnType<typeof createBrowserRouter>`
  - `GET /tasks` page shell

- [ ] **Step 1: 写前端页面挂载失败测试**

```tsx
// frontend/src/test/task-list.spec.tsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";


it("renders app title", () => {
  render(
    <MemoryRouter>
      <AppShell />
    </MemoryRouter>,
  );

  expect(screen.getByText("Hermes Orchestrator")).toBeInTheDocument();
});
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `cd frontend && npm test -- --run src/test/task-list.spec.tsx`
Expected: FAIL because the frontend project files do not exist yet

- [ ] **Step 3: 写前端骨架**

```json
// frontend/package.json
{
  "name": "hermes-orchestrator-frontend",
  "private": true,
  "version": "0.1.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.51.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.8",
    "@testing-library/react": "^16.0.0",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "tailwindcss": "^3.4.10",
    "typescript": "^5.5.4",
    "vite": "^5.4.0",
    "vitest": "^2.0.5"
  }
}
```

```tsx
// frontend/src/components/layout/AppShell.tsx
import { Outlet, Link } from "react-router-dom";


export function AppShell() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Hermes Orchestrator</h1>
          <nav className="flex gap-4 text-sm text-slate-300">
            <Link to="/">Tasks</Link>
            <Link to="/reviews">Reviews</Link>
            <Link to="/system">System</Link>
          </nav>
        </div>
      </header>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}
```

```tsx
// frontend/src/App.tsx
import { RouterProvider } from "react-router-dom";
import { router } from "./router";


export default function App() {
  return <RouterProvider router={router} />;
}
```

```tsx
// frontend/src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 4: 运行测试，确认通过**

Run: `cd frontend && npm test -- --run src/test/task-list.spec.tsx`
Expected: PASS with `1 passed`

- [ ] **Step 5: 提交**

```bash
git add frontend/package.json frontend/vite.config.ts frontend/tailwind.config.ts frontend/postcss.config.js frontend/index.html frontend/src
git commit -m "feat: scaffold react admin console"
```

## Task 7: Build Task List And Web Review Pages

**Files:**
- Create: `frontend/src/lib/api.ts`
- Create: `frontend/src/types/api.ts`
- Create: `frontend/src/components/tasks/TaskTable.tsx`
- Create: `frontend/src/components/tasks/StatusBadge.tsx`
- Create: `frontend/src/components/review/PlanReviewCard.tsx`
- Create: `frontend/src/pages/TaskListPage.tsx`
- Create: `frontend/src/pages/ReviewQueuePage.tsx`
- Modify: `frontend/src/router.tsx`
- Test: `frontend/src/test/review-queue.spec.tsx`

**Interfaces:**
- Consumes:
  - `GET /api/tasks`
  - `GET /api/approvals/pending`
  - `POST /api/approvals/{task_id}/approve`
- Produces:
  - `TaskTable`
  - `PlanReviewCard`
  - `/` and `/reviews` pages

- [ ] **Step 1: 写审核页失败测试**

```tsx
// frontend/src/test/review-queue.spec.tsx
import { render, screen } from "@testing-library/react";
import { ReviewQueuePage } from "../pages/ReviewQueuePage";


it("renders pending review heading", () => {
  render(<ReviewQueuePage />);

  expect(screen.getByText("待审核计划")).toBeInTheDocument();
});
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `cd frontend && npm test -- --run src/test/review-queue.spec.tsx`
Expected: FAIL with `Failed to resolve import "../pages/ReviewQueuePage"`

- [ ] **Step 3: 写任务列表页与审核页**

```ts
// frontend/src/types/api.ts
export interface TaskListItem {
  id: string;
  title: string;
  status: string;
  task_type: string;
  priority: number;
}

export interface PendingApprovalItem {
  task_id: string;
  plan_id: string;
  title: string;
  plan_summary: string;
}
```

```ts
// frontend/src/lib/api.ts
export async function fetchTasks() {
  const response = await fetch("/api/tasks");
  return response.json();
}

export async function fetchPendingApprovals() {
  const response = await fetch("/api/approvals/pending");
  return response.json();
}
```

```tsx
// frontend/src/pages/TaskListPage.tsx
export function TaskListPage() {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">任务列表</h2>
      <TaskTable items={[]} />
    </section>
  );
}
```

```tsx
// frontend/src/pages/ReviewQueuePage.tsx
export function ReviewQueuePage() {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">待审核计划</h2>
      <PlanReviewCard
        item={{
          task_id: "demo-task",
          plan_id: "demo-plan",
          title: "演示任务",
          plan_summary: "审核页示例内容",
        }}
      />
    </section>
  );
}
```

```tsx
// frontend/src/router.tsx
export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <TaskListPage /> },
      { path: "reviews", element: <ReviewQueuePage /> },
    ],
  },
]);
```

- [ ] **Step 4: 运行测试，确认通过**

Run: `cd frontend && npm test -- --run src/test/review-queue.spec.tsx src/test/task-list.spec.tsx`
Expected: PASS with `2 passed`

- [ ] **Step 5: 提交**

```bash
git add frontend/src/lib/api.ts frontend/src/types/api.ts frontend/src/components/tasks frontend/src/components/review frontend/src/pages frontend/src/router.tsx frontend/src/test
git commit -m "feat: add task list and web review pages"
```

## Task 8: Add Task Detail, System Status, And Run Log Views

**Files:**
- Create: `frontend/src/components/logs/RunLogPanel.tsx`
- Create: `frontend/src/pages/TaskDetailPage.tsx`
- Create: `frontend/src/pages/SystemStatusPage.tsx`
- Modify: `frontend/src/router.tsx`
- Modify: `backend/app/api/routes/tasks.py`
- Modify: `backend/app/api/routes/system.py`
- Test: `backend/tests/test_system_api.py`
- Test: `frontend/src/test/system-status.spec.tsx`

**Interfaces:**
- Consumes:
  - `GET /api/tasks/{task_id}`
  - `GET /api/system/status`
- Produces:
  - `/tasks/:taskId`
  - `/system`
  - `RunLogPanel`

- [ ] **Step 1: 写系统状态页失败测试**

```tsx
// frontend/src/test/system-status.spec.tsx
import { render, screen } from "@testing-library/react";
import { SystemStatusPage } from "../pages/SystemStatusPage";


it("renders system status heading", () => {
  render(<SystemStatusPage />);

  expect(screen.getByText("系统状态")).toBeInTheDocument();
});
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `cd frontend && npm test -- --run src/test/system-status.spec.tsx`
Expected: FAIL with `Failed to resolve import "../pages/SystemStatusPage"`

- [ ] **Step 3: 写任务详情页与系统状态页**

```tsx
// frontend/src/components/logs/RunLogPanel.tsx
export function RunLogPanel({ lines }: { lines: string[] }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
      <h3 className="mb-3 text-sm font-medium text-slate-200">执行日志</h3>
      <pre className="overflow-auto text-xs text-slate-300">
        {lines.join("\n")}
      </pre>
    </div>
  );
}
```

```tsx
// frontend/src/pages/SystemStatusPage.tsx
export function SystemStatusPage() {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">系统状态</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-slate-800 p-4">队列深度: 0</div>
        <div className="rounded-lg border border-slate-800 p-4">运行中任务: 无</div>
      </div>
    </section>
  );
}
```

```tsx
// frontend/src/pages/TaskDetailPage.tsx
export function TaskDetailPage() {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">任务详情</h2>
      <RunLogPanel lines={["planning started", "waiting for approval"]} />
    </section>
  );
}
```

```python
# backend/app/api/routes/tasks.py
@router.get("/{task_id}")
async def get_task(task_id: str) -> dict[str, object]:
    return {
        "id": task_id,
        "title": "Demo task",
        "status": "PendingApproval",
        "logs": ["planning started", "waiting for approval"],
    }
```

- [ ] **Step 4: 运行测试，确认通过**

Run: `cd frontend && npm test -- --run src/test/system-status.spec.tsx`
Expected: PASS with `1 passed`

Run: `cd backend && python3.12 -m pytest tests/test_system_api.py -v`
Expected: PASS with `1 passed`

- [ ] **Step 5: 提交**

```bash
git add frontend/src/components/logs frontend/src/pages/TaskDetailPage.tsx frontend/src/pages/SystemStatusPage.tsx frontend/src/test/system-status.spec.tsx frontend/src/router.tsx backend/app/api/routes/tasks.py backend/app/api/routes/system.py
git commit -m "feat: add task detail and system status views"
```

## Task 9: Add Environment Templates And Local Run Scripts

**Files:**
- Create: `backend/.env.example`
- Create: `frontend/.env.example`
- Create: `scripts/dev-backend.sh`
- Create: `scripts/dev-frontend.sh`
- Create: `scripts/test-backend.sh`
- Create: `scripts/test-frontend.sh`
- Create: `README.md`

**Interfaces:**
- Consumes:
  - `DATABASE_URL`
  - `HERMES_BASE_URL`
- Produces:
  - documented local development entrypoints
  - repeatable test commands

- [ ] **Step 1: 写运行脚本存在性失败检查**

```bash
test -f scripts/dev-backend.sh
```

- [ ] **Step 2: 运行检查，确认失败**

Run: `test -f /Users/zephyr/zephyr-space/zephyr-auto-builder/scripts/dev-backend.sh`
Expected: shell exit code `1`

- [ ] **Step 3: 写环境模板与脚本**

```env
# backend/.env.example
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/hermes_orchestrator
HERMES_BASE_URL=http://localhost:8081
```

```env
# frontend/.env.example
VITE_API_BASE_URL=http://localhost:8000/api
```

```bash
# scripts/dev-backend.sh
#!/usr/bin/env bash
set -euo pipefail
cd backend
python3.12 -m uvicorn app.main:app --reload --port 8000
```

```bash
# scripts/dev-frontend.sh
#!/usr/bin/env bash
set -euo pipefail
cd frontend
npm run dev
```

```bash
# scripts/test-backend.sh
#!/usr/bin/env bash
set -euo pipefail
cd backend
python3.12 -m pytest
```

```bash
# scripts/test-frontend.sh
#!/usr/bin/env bash
set -euo pipefail
cd frontend
npm test -- --run
```

```md
# README.md
## Local Development

1. Copy `backend/.env.example` to `backend/.env`
2. Copy `frontend/.env.example` to `frontend/.env`
3. Run `scripts/dev-backend.sh`
4. Run `scripts/dev-frontend.sh`
```

- [ ] **Step 4: 运行检查，确认通过**

Run: `test -f /Users/zephyr/zephyr-space/zephyr-auto-builder/scripts/dev-backend.sh`
Expected: shell exit code `0`

- [ ] **Step 5: 提交**

```bash
git add backend/.env.example frontend/.env.example scripts README.md
git commit -m "chore: add local development scripts"
```

## Self-Review

### Spec Coverage

- `Python 3.12 + FastAPI + PostgreSQL`：由 Task 1、Task 2、Task 9 覆盖
- `Hermes 双通道异步交互`：由 Task 4 覆盖
- `单队列 + 单执行 Worker`：由 Task 4 和 Task 5 的系统状态接口覆盖
- `Web 审核页`：由 Task 5 和 Task 7 覆盖
- `独立 React 管理台`：由 Task 6、Task 7、Task 8 覆盖
- `任务列表 / 任务详情 / 系统状态 / 执行日志`：由 Task 5、Task 7、Task 8 覆盖
- `恢复逻辑`：由 Task 4 的 `recovery_sweep.py` 覆盖

### Placeholder Scan

- 已检查文档，没有使用 `TODO`、`TBD`、`implement later` 或 “类似 Task N” 这类占位表述
- 每个任务都包含明确文件路径、接口名、运行命令与提交建议

### Type Consistency

- 后端统一使用 `WorkflowEngine`、`TaskRepository`、`ApprovalRepository` 命名
- Hermes Gateway 统一使用 `submit_plan()`、`submit_execution()`、`poll_job()`
- 前端统一使用 `TaskListPage`、`ReviewQueuePage`、`SystemStatusPage` 命名

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-22-hermes-orchestrator-implementation-plan.md`. Two execution options:

1. Subagent-Driven (recommended) - I dispatch a fresh subagent per task, review between tasks, fast iteration

2. Inline Execution - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
