# Hermes Orchestrator

24/7 task orchestration and governance layer for Hermes.

## What This Is

This system is **not** Hermes itself. Hermes is an existing AI execution system (similar to OpenClaw). This project is the orchestration layer that:

- runs continuously (24/7)
- receives and accumulates tasks
- manages workflow state and approvals
- communicates with Hermes through asynchronous jobs
- records logs, audit data, and recovery state

Hermes is responsible for understanding concrete project work, generating plans, executing approved work, and delegating code authoring to Claude Code.

## Architecture

- **Backend**: Python 3.12 + FastAPI + SQLAlchemy + PostgreSQL
- **Frontend**: React + Vite + Tailwind CSS + TanStack Query
- **Deployment**: Docker Compose

## Quick Start

### Prerequisites

- Python 3.12+
- Node.js 22+
- PostgreSQL 16+

### Backend

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -e '.[dev]'
cp ../.env.example ../.env
# edit .env with your PostgreSQL connection string
alembic upgrade head
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Docker

```bash
cp .env.example .env
docker compose up --build
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/api/v1/tasks` | Create a task |
| GET | `/api/v1/tasks` | List tasks |
| GET | `/api/v1/tasks/{id}` | Get task detail |
| GET | `/api/v1/tasks/{id}/events` | Get task event log |
| POST | `/api/v1/approvals` | Submit plan approval |
| GET | `/api/v1/system/status` | System status |

## Task Lifecycle

1. **New** - task created
2. **Planning** - submitted to Hermes for plan generation
3. **PendingApproval** - plan returned, awaiting human review
4. **Approved** - plan approved, entering execution queue
5. **Queued** - waiting for execution slot
6. **Executing** - Hermes executing the approved plan
7. **Succeeded / Failed / Rejected / Escalated** - terminal states

## Design Docs

- [English spec](docs/superpowers/specs/2026-06-22-hermes-orchestrator-design.md)
- [Chinese spec](docs/superpowers/specs/2026-06-22-hermes-orchestrator-design.zh-CN.md)
- [Implementation plan](docs/superpowers/plans/2026-06-22-hermes-orchestrator-implementation-plan.md)
