# Hermes Orchestrator

Hermes 的 24/7 任务编排与治理层。

## 这是什么

这个系统**不是** Hermes 本身。Hermes 是一个已有的 AI 执行系统（类似 OpenClaw）。本项目是围绕 Hermes 的编排层，负责：

- 持续运行（24/7）
- 接收和积累任务
- 管理工作流状态与审核
- 通过异步任务与 Hermes 通信
- 记录日志、审计数据和恢复状态

Hermes 负责理解具体项目工作、生成计划、执行已批准的工作，并在需要编码时委托 Claude Code 完成代码编写。

## 架构

- **后端**：Python 3.12 + FastAPI + SQLAlchemy + PostgreSQL
- **前端**：React + Vite + Tailwind CSS + TanStack Query
- **部署**：Docker Compose

## 快速开始

### 前置条件

- Python 3.12+
- Node.js 22+
- PostgreSQL 16+

### 后端

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -e '.[dev]'
cp ../.env.example ../.env
# 编辑 .env，填入你的 PostgreSQL 连接字符串
alembic upgrade head
uvicorn app.main:app --reload
```

### 前端

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

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 健康检查 |
| POST | `/api/v1/tasks` | 创建任务 |
| GET | `/api/v1/tasks` | 任务列表 |
| GET | `/api/v1/tasks/{id}` | 任务详情 |
| GET | `/api/v1/tasks/{id}/events` | 任务事件日志 |
| POST | `/api/v1/approvals` | 提交计划审核 |
| GET | `/api/v1/system/status` | 系统状态 |

## 任务生命周期

1. **New** - 任务已创建
2. **Planning** - 已提交给 Hermes 生成计划
3. **PendingApproval** - 计划已返回，等待人工审核
4. **Approved** - 计划已批准，进入执行队列
5. **Queued** - 等待执行槽位
6. **Executing** - Hermes 正在执行已批准的计划
7. **Succeeded / Failed / Rejected / Escalated** - 终态

## 设计文档

- [英文规格](docs/superpowers/specs/2026-06-22-hermes-orchestrator-design.md)
- [中文规格](docs/superpowers/specs/2026-06-22-hermes-orchestrator-design.zh-CN.md)
- [实现计划](docs/superpowers/plans/2026-06-22-hermes-orchestrator-implementation-plan.md)
