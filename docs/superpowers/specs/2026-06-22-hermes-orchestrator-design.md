# Hermes Orchestrator Design

## 1. Background And Goal

This project is not the Hermes agent itself. Hermes already exists as an AI execution system similar to OpenClaw. This project acts as a 24/7 orchestration layer around Hermes.

The orchestrator is responsible for:

- keeping the service running continuously
- receiving and accumulating tasks
- managing workflow state and approvals
- communicating with Hermes through asynchronous jobs
- recording logs, audit data, and recovery state

Hermes is responsible for:

- understanding concrete project work
- generating execution plans
- executing approved work
- delegating code authoring to Claude Code when implementation is needed

The main goal of V1 is to build a stable always-on system that can:

1. accept task ideas from humans or system sources
2. ask Hermes to generate a plan
3. route the plan to a human for approval
4. ask Hermes to execute after approval
5. track progress and results until completion
6. recover safely from process restarts or remote failures

## 2. Scope Boundary

### In Scope

- 24/7 background service
- task intake and queue accumulation
- single-threaded execution scheduling
- asynchronous planning and execution with Hermes
- plan review by a human
- execution progress tracking
- persistent workflow state
- audit and recovery records

### Out Of Scope

- replacing Hermes internal intelligence
- implementing code generation directly in this service
- building a multi-worker execution cluster in V1
- streaming UI dashboards in V1
- complex multi-tenant permissions in V1

## 3. Product Positioning

The correct product definition is:

> Hermes Orchestrator is a workflow and governance layer for Hermes, not a replacement for Hermes.

Its value comes from reliability and control, not from duplicating execution intelligence.

The orchestrator solves these problems:

- how tasks enter the system
- how they are queued and prioritized
- when Hermes should plan
- when humans should approve
- when Hermes should execute
- how remote job state is synchronized back locally
- how failures and restarts are recovered

## 4. V1 Architecture

V1 uses a task orchestration center as the main architecture and keeps extension points for a future multi-agent evolution.

Core components:

### 4.1 Task Inbox

Accepts incoming work from:

- human ideas
- scheduled discovery
- repository or external events
- Hermes-generated candidate tasks

The inbox creates a local task record and hands it to the workflow engine.

### 4.2 Queue Manager

Maintains accumulated work in the local system.

V1 constraints:

- tasks can accumulate
- execution is single-threaded
- only one execution job may run at a time
- approved tasks wait in queue until the single execution slot is free

This keeps state and recovery simple while preserving a path to parallel execution later.

### 4.3 Workflow Engine

The workflow engine is the local source of truth for state transitions.

It decides:

- when a task should be planned
- when a plan should enter human review
- when an approved task can enter execution queue
- when a failed task should escalate or replan

All workflow transitions must pass through this layer so behavior stays centralized.

### 4.4 Hermes Gateway

This is the protocol boundary with Hermes.

It provides a normalized internal API:

- `submit_plan(task_id, context)`
- `poll_plan(remote_job_id)`
- `submit_execution(task_id, approved_plan)`
- `poll_execution(remote_job_id)`
- `cancel_remote_job(remote_job_id)`

The gateway hides Hermes protocol details from the rest of the system.

### 4.5 Review Gateway

Routes generated plans to a human reviewer over IM or another review channel.

The reviewer can:

- approve
- reject
- request revision

### 4.6 Audit And Memory Store

Persists:

- tasks
- plan versions
- approvals
- remote Hermes jobs
- execution runs
- event logs

This store supports auditability, observability, and restart recovery.

## 5. Hermes Interaction Model

Hermes communication is asynchronous and should be modeled as remote background jobs.

V1 separates interaction with Hermes into two lanes.

### 5.1 Planning Lane

Used for:

- expanding a human idea into a structured task plan
- turning discovered opportunities into candidate plans
- generating revised plans after human feedback

This lane can continue to create and update tasks even while an execution is already running.

### 5.2 Execution Lane

Used for:

- approved execution requests
- progress polling
- result collection
- failure detection

V1 execution remains single-threaded even though Hermes communication is asynchronous.

### 5.3 Why Two Lanes

Separating planning and execution provides these benefits:

- plan generation does not block behind a long-running execution
- the system can keep building task backlog while execution remains serialized
- Hermes remote jobs are easier to reason about because planning and execution have different timeouts, retry rules, and result shapes
- the design can evolve into multi-agent workers without changing the top-level architecture

## 6. Task Lifecycle

The local task lifecycle in V1 is:

1. `New`
2. `Planning`
3. `PendingApproval`
4. `Approved`
5. `Queued`
6. `Executing`
7. `Succeeded` or `Failed` or `Rejected` or `Escalated`

### 6.1 State Definitions

- `New`: task has been created locally
- `Planning`: a planning request has been submitted to Hermes
- `PendingApproval`: Hermes returned a plan and the system is waiting for human review
- `Approved`: a plan has been approved and frozen for execution
- `Queued`: the task is ready but waiting for the single execution worker
- `Executing`: Hermes is running the approved plan
- `Succeeded`: execution completed successfully
- `Failed`: execution ended unsuccessfully
- `Rejected`: plan was rejected by a human
- `Escalated`: the system needs manual intervention due to recovery, communication, or policy issues

### 6.2 Replan Path

If the reviewer requests a revision:

- the task re-enters planning
- the previous plan is retained as history
- a new plan version is created
- only the explicitly approved plan version may be executed

## 7. Approval Model

The human gate sits between planning and execution.

All task sources follow the same rule:

- tasks may be human-originated or Hermes-originated
- Hermes may generate candidate tasks autonomously
- no task is executed until a human approves a concrete plan

### 7.1 Approval Actions

Supported reviewer actions in V1:

- `Approve`
- `Reject`
- `Revise`

### 7.2 Approval Snapshot

When a plan is approved, the system must persist an `approved_plan_snapshot`.

That snapshot becomes the authoritative execution input. This prevents plan drift between approval and execution.

## 8. Execution Constraints

V1 intentionally keeps execution simple.

### 8.1 Single Execution Worker

- only one execution worker is active
- only one task may be in `Executing` at any given time
- multiple approved tasks may wait in `Queued`

### 8.2 Planning Continues While Execution Runs

Planning is logically independent from execution.

The system may continue to:

- accept new ideas
- ask Hermes for plans
- accumulate review items

while the single execution worker is busy with the currently approved task.

### 8.3 Future Parallelism

V1 should reserve extension points for:

- `worker_id`
- queue partitioning
- execution leases
- resource isolation metadata

But those capabilities remain disabled in V1.

## 9. Data Model

V1 uses SQLite as the local persistence layer.

This is appropriate because:

- V1 has one service process
- execution concurrency is deliberately low
- reliable local recovery matters more than horizontal scale

Recommended core tables:

### 9.1 `tasks`

Represents the user-visible task.

Suggested fields:

- `id`
- `title`
- `source_type`
- `source_payload`
- `task_type`
- `status`
- `priority`
- `current_plan_id`
- `approved_plan_id`
- `created_at`
- `updated_at`

### 9.2 `plans`

Represents one plan version for a task.

Suggested fields:

- `id`
- `task_id`
- `version`
- `plan_text`
- `plan_structured_json`
- `risk_summary`
- `expected_outputs`
- `status`
- `created_by`
- `created_at`

### 9.3 `approvals`

Represents one review action for a plan.

Suggested fields:

- `id`
- `task_id`
- `plan_id`
- `review_channel`
- `decision`
- `review_comment`
- `reviewer_id`
- `created_at`

### 9.4 `remote_jobs`

Represents asynchronous jobs submitted to Hermes.

Suggested fields:

- `id`
- `task_id`
- `plan_id`
- `job_kind`
- `hermes_job_id`
- `request_payload`
- `remote_status`
- `last_polled_at`
- `poll_attempts`
- `error_message`
- `created_at`
- `finished_at`

### 9.5 `task_runs`

Represents a formal execution run.

Suggested fields:

- `id`
- `task_id`
- `plan_id`
- `execution_remote_job_id`
- `run_status`
- `started_at`
- `finished_at`
- `result_summary`
- `artifact_manifest`
- `failure_reason`

### 9.6 `event_logs`

Represents audit and workflow events.

Suggested fields:

- `id`
- `task_id`
- `run_id`
- `event_type`
- `event_payload`
- `created_at`

## 10. Internal Modules

V1 should stay as one application process with clear internal modules.

### 10.1 `scheduler`

Triggers recurring actions such as:

- scheduled task discovery
- polling outstanding Hermes remote jobs
- checking queued approved tasks
- restart recovery sweeps

### 10.2 `workflow_engine`

Centralizes business state transitions and policy decisions.

### 10.3 `hermes_gateway`

Handles protocol adaptation, remote job submission, polling, retries, and normalized status mapping.

### 10.4 `review_gateway`

Handles review delivery and review decision intake.

### 10.5 `repository`

Provides persistent storage operations and isolates the database implementation from business logic.

## 11. Process Model

V1 runs as one long-lived process with multiple background async loops or workers.

Suggested logical workers:

- `Planning Worker`
- `Execution Worker`
- `Polling Worker`
- `Recovery Sweep`

Expected behavior:

- planning and execution communicate with Hermes independently
- execution remains serialized
- all workers share one persistence layer
- all significant transitions are durable before side effects are triggered

## 12. Failure Handling And Recovery

V1 must distinguish communication failures from business failures.

### 12.1 Communication Failures

Examples:

- Hermes endpoint unreachable
- timeout
- malformed remote response
- transient network issue

Policy:

- retry with bounded exponential backoff
- persist retry count
- escalate after retry budget is exhausted

### 12.2 Business Failures

Examples:

- planning failed
- execution failed
- verification failed
- Hermes returned a terminal negative outcome

Policy:

- record the failure summary
- do not auto-loop indefinitely
- let workflow move toward replan, reject, or escalate based on local policy

### 12.3 Restart Recovery

On startup, the system should:

1. load unfinished tasks and remote jobs
2. identify in-flight planning or execution jobs
3. resume polling when safe
4. mark stale jobs for escalation if remote state cannot be recovered

This recovery phase is required for a 24/7 service.

## 13. Technology Choices

Recommended V1 stack:

- Python 3.11+
- `asyncio`
- `aiohttp` or `httpx` for Hermes communication
- SQLite
- one IM integration for review delivery
- Docker for deployment

Rationale:

- Python supports long-running async service patterns well
- `asyncio` matches the polling-oriented workflow
- SQLite is enough for single-process V1 and simplifies deployment
- Docker provides stable runtime packaging and restart behavior

## 14. Deployment Model

Recommended V1 deployment:

- one container
- one long-lived service process
- persisted local database volume
- persisted logs volume
- `restart: always`

If Hermes is deployed on the same host, prefer local or private network communication instead of exposing unnecessary public endpoints.

## 15. Risks

### 15.1 Hermes Protocol Drift

If Hermes response structure changes, the gateway must absorb those changes instead of leaking them to the rest of the app.

### 15.2 Task Explosion

Autonomous task generation can flood the backlog. V1 should add at least simple controls:

- priority
- generation frequency limits
- deduplication
- optional human filtering

### 15.3 Plan Drift

Execution must run against the approved plan snapshot, not a mutated or implicit later version.

### 15.4 Recovery Ambiguity

When local state says a task is executing but remote state is unknown, the system must prefer explicit escalation over silent assumptions.

## 16. Evolution Path

### V1

- single queue
- single execution worker
- asynchronous Hermes planning lane
- asynchronous Hermes execution lane
- human plan approval
- full execution after approval

### V1.5

- better prioritization
- simple deduplication
- richer failure escalation tooling
- operational metrics

### V2

- multiple execution workers
- worker leases
- resource-aware queueing
- stronger isolation between runs

### V3

- evolve execution into specialized agent roles
- keep the same top-level orchestrator, gateway, queue, and approval model

## 17. Summary

Hermes Orchestrator is a 24/7 reliability and governance layer around Hermes.

Its purpose is to manage:

- task intake
- queueing
- workflow state
- human approvals
- asynchronous Hermes communication
- execution tracking
- auditability
- restart recovery

V1 intentionally optimizes for stability and clarity:

- one service
- one queue
- one execution worker
- two Hermes interaction lanes
- human approval before execution
- full automation after approval
