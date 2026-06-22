# Hermes Orchestrator 设计文档

## 1. 背景与目标

这个项目不是 Hermes Agent 本体。Hermes 本身已经存在，是一个类似 OpenClaw 的 AI 执行系统。这个项目的定位，是围绕 Hermes 构建一层 24/7 常驻运行的编排与治理层。

编排层负责：

- 保证服务持续运行
- 接收并积累任务
- 管理流程状态与审核
- 通过异步任务机制与 Hermes 通信
- 记录日志、审计数据与恢复状态

Hermes 负责：

- 理解具体项目工作
- 生成执行计划
- 执行已获批准的工作
- 在需要代码实现时调用 Claude Code 完成代码编写

V1 的核心目标，是构建一个稳定的常驻系统，使其能够：

1. 接收来自人工或系统来源的任务想法
2. 请求 Hermes 生成计划
3. 将计划路由给人工审核
4. 在审核通过后请求 Hermes 执行
5. 持续跟踪进度与最终结果
6. 在进程重启或远端失败后安全恢复

## 2. 范围边界

### 包含范围

- 24/7 后台常驻服务
- 任务接入与队列积压
- 单线程执行调度
- 与 Hermes 的异步规划与异步执行交互
- 人工计划审核
- 执行进度跟踪
- 持久化流程状态
- 审计与恢复记录

### 不包含范围

- 替代 Hermes 内部智能能力
- 由本服务直接实现代码生成
- 在 V1 中构建多执行器并行集群
- 在 V1 中构建流式实时大屏
- 在 V1 中实现复杂多租户权限系统

## 3. 产品定位

正确的产品定义是：

> Hermes Orchestrator 是 Hermes 的工作流与治理层，而不是 Hermes 的替代品。

它的价值来自可靠性与控制能力，而不是重复实现执行智能。

编排层解决的问题包括：

- 任务如何进入系统
- 任务如何排队与排序
- 何时请求 Hermes 规划
- 何时进入人工审核
- 何时允许 Hermes 执行
- 如何把远端任务状态同步回本地
- 如何在失败与重启后恢复

## 4. V1 架构

V1 采用“任务编排中心”作为主架构，并为未来演进为多 Agent 体系预留扩展点。

核心组件如下。

### 4.1 Task Inbox

用于接收外部进入系统的工作项，来源包括：

- 人工想法
- 定时发现任务
- 仓库或外部事件
- Hermes 自主生成的候选任务

Inbox 负责创建本地任务记录，并将其交给工作流引擎处理。

### 4.2 Queue Manager

负责维护系统中的任务积压。

V1 的明确约束是：

- 任务可以不断积累
- 执行是单线程的
- 同一时间只允许一个执行任务运行
- 已审核通过的任务进入队列，等待唯一执行槽位空闲

这样可以显著降低状态复杂度与恢复难度，同时保留未来并行执行的演进空间。

### 4.3 Workflow Engine

工作流引擎是本地状态流转的唯一事实来源。

它负责决定：

- 任务何时进入规划
- 计划何时进入人工审核
- 已批准任务何时进入执行队列
- 失败任务何时升级人工或重新规划

所有关键状态流转都必须经过这一层，避免逻辑分散。

### 4.4 Hermes Gateway

这是系统与 Hermes 之间的协议边界层。

它对内部暴露统一接口：

- `submit_plan(task_id, context)`
- `poll_plan(remote_job_id)`
- `submit_execution(task_id, approved_plan)`
- `poll_execution(remote_job_id)`
- `cancel_remote_job(remote_job_id)`

Gateway 的职责，是把 Hermes 的具体协议细节封装起来，不让它泄漏到其他模块。

### 4.5 Review Gateway

负责把生成的计划投递给人工审核渠道。

V1 默认审核入口为 Web 审核页，后续再扩展 IM 机器人或其他审核渠道。

审核人可执行的动作包括：

- 通过
- 拒绝
- 要求修订

### 4.6 Admin Web

V1 提供一个独立的轻量 React 管理台，用于承担人工交互与系统可视化。

管理台的主要职责包括：

- 展示任务列表与任务详情
- 展示待审核计划
- 提供计划通过、拒绝、修订操作
- 查看执行日志与结果摘要
- 查看系统状态与当前运行中的任务

管理台不是系统核心调度器，而是编排服务的可视化与人工操作入口。

### 4.7 Audit And Memory Store

用于持久化保存以下数据：

- 任务
- 计划版本
- 审核记录
- Hermes 远端任务
- 执行运行记录
- 事件日志

这层既用于审计，也用于观测和服务重启后的恢复。

## 5. 与 Hermes 的交互模型

与 Hermes 的交互采用异步任务模型，应该被视为远端后台任务。

V1 将和 Hermes 的交互明确拆成两条通道。

### 5.1 Planning Lane

用于：

- 将人工想法扩展为结构化任务计划
- 将发现到的机会点转为候选计划
- 在人工提出修改意见后重新生成计划

即使当前已经有一个执行任务在运行，这条通道仍可以继续工作。

### 5.2 Execution Lane

用于：

- 提交已批准计划的正式执行
- 轮询执行进度
- 回收结果
- 发现执行失败

即使 Hermes 通信本身是异步的，V1 的执行仍然保持单线程串行。

### 5.3 为什么要拆成两条通道

将规划与执行分离有以下收益：

- 计划生成不会被长时间执行任务阻塞
- 即使执行串行，系统仍可以持续为队列积累任务
- 规划与执行的超时、重试、结果形态不同，拆开后更容易建模
- 后续演进为多 Agent 或多 Worker 时，不需要推翻顶层架构

## 6. 任务生命周期

V1 中，本地任务的生命周期定义为：

1. `New`
2. `Planning`
3. `PendingApproval`
4. `Approved`
5. `Queued`
6. `Executing`
7. `Succeeded` 或 `Failed` 或 `Rejected` 或 `Escalated`

### 6.1 状态定义

- `New`：任务刚在本地系统中创建
- `Planning`：已向 Hermes 提交规划请求
- `PendingApproval`：Hermes 已返回计划，等待人工审核
- `Approved`：计划已通过审核，并被冻结用于执行
- `Queued`：任务已准备执行，等待唯一执行 Worker
- `Executing`：Hermes 正在执行已批准计划
- `Succeeded`：执行成功结束
- `Failed`：执行失败结束
- `Rejected`：计划被人工拒绝
- `Escalated`：由于恢复、通信或策略问题，需要人工进一步介入

### 6.2 重规划路径

如果审核人要求修订：

- 任务重新回到规划阶段
- 旧计划作为历史记录保留
- 系统生成一个新的计划版本
- 只有被明确批准的计划版本才允许执行

## 7. 审核模型

人工闸门位于“规划”和“执行”之间。

所有任务来源都遵守同一条规则：

- 任务可以由人工提出，也可以由 Hermes 自主生成
- Hermes 可以不断生成候选任务
- 但在人工批准具体计划之前，不允许进入执行

### 7.1 审核动作

V1 支持的审核动作包括：

- `Approve`
- `Reject`
- `Revise`

### 7.2 审核快照

当计划被批准后，系统必须持久化一份 `approved_plan_snapshot`。

这份快照是正式执行时唯一权威的输入，用于防止“审核通过的计划”和“实际执行的计划”发生漂移。

## 8. 执行约束

V1 有意识地把执行复杂度控制在较低水平。

### 8.1 单执行 Worker

- 只启用一个执行 Worker
- 任意时刻最多只有一个任务处于 `Executing`
- 多个已批准任务可以同时停留在 `Queued`

### 8.2 执行运行时，规划仍可继续

规划与执行在逻辑上彼此独立。

当唯一执行 Worker 正在运行时，系统仍然可以继续：

- 接收新的想法
- 请求 Hermes 生成计划
- 持续积累待审核项

### 8.3 为未来并行能力预留扩展点

V1 应提前预留这些字段或概念：

- `worker_id`
- 队列分区
- 执行租约
- 资源隔离元数据

但这些能力在 V1 中不启用。

## 9. 数据模型

V1 建议使用 PostgreSQL 作为持久化层。

原因如下：

- V1 只有一个核心后端服务进程
- 执行并发被刻意限制得很低
- 你已经有现成 PostgreSQL 部署，接入成本更低
- 当前阶段虽然不追求高并发，但仍然适合直接使用正式数据库

建议的核心表如下。

### 9.1 `tasks`

表示一个用户可理解的任务主体。

建议字段：

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

表示某个任务的一次计划版本。

建议字段：

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

表示一次人工审核动作。

建议字段：

- `id`
- `task_id`
- `plan_id`
- `review_channel`
- `decision`
- `review_comment`
- `reviewer_id`
- `created_at`

### 9.4 `remote_jobs`

表示提交给 Hermes 的远端异步任务。

建议字段：

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

表示一次正式执行运行记录。

建议字段：

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

表示审计与工作流事件日志。

建议字段：

- `id`
- `task_id`
- `run_id`
- `event_type`
- `event_payload`
- `created_at`

## 10. 内部模块

V1 应保持为一个应用进程，但内部模块边界要清晰。

### 10.1 `scheduler`

用于触发周期性动作，例如：

- 定时任务发现
- 轮询未完成的 Hermes 远端任务
- 检查已批准但尚未执行的任务
- 服务启动后的恢复扫描

### 10.2 `workflow_engine`

负责集中管理业务状态流转与策略决策。

### 10.3 `hermes_gateway`

负责协议适配、远端任务提交、轮询、重试与状态归一化映射。

### 10.4 `review_gateway`

负责审核内容投递与审核结果接收。

### 10.5 `repository`

负责统一数据访问，并将数据库实现从业务逻辑中隔离出来。

## 11. 进程模型

V1 采用单个常驻进程，内部运行多个后台异步循环或 Worker。

建议的逻辑 Worker 包括：

- `Planning Worker`
- `Execution Worker`
- `Polling Worker`
- `Recovery Sweep`

预期行为：

- 规划通道与执行通道分别和 Hermes 通信
- 执行始终保持串行
- 所有 Worker 共用同一持久化层
- 所有关键状态变更都必须先持久化，再触发副作用

## 12. 失败处理与恢复

V1 必须明确区分“通信失败”和“业务失败”。

### 12.1 通信失败

例如：

- Hermes 端点不可达
- 请求超时
- 远端返回内容格式异常
- 短暂性网络错误

策略：

- 使用有上限的指数退避重试
- 持久化记录重试次数
- 超过重试预算后升级人工处理

### 12.2 业务失败

例如：

- 规划失败
- 执行失败
- 验证失败
- Hermes 明确返回终态负结果

策略：

- 记录失败摘要
- 不进行无限自动循环重试
- 由工作流根据本地策略决定进入重规划、拒绝或升级人工

### 12.3 重启恢复

服务启动时应执行以下恢复动作：

1. 加载所有未完成任务与远端任务
2. 识别仍处于进行中的规划或执行任务
3. 在安全前提下恢复轮询
4. 对无法恢复远端状态的任务标记升级人工

这是 24/7 常驻服务必须具备的能力，而不是可选项。

## 13. 技术选型

推荐的 V1 技术栈：

- Python 3.12
- `FastAPI`
- `asyncio`
- 使用 `aiohttp` 或 `httpx` 与 Hermes 通信
- PostgreSQL
- `SQLAlchemy 2.x`
- `Alembic`
- `Pydantic v2`
- 独立 `React` 管理台
- `Vite`
- `Tailwind CSS + shadcn/ui`
- Docker 用于部署

选择理由：

- Python 3.12 适合构建常驻编排服务
- `FastAPI` 适合提供任务、审核、状态与日志相关 API
- `asyncio` 与轮询式工作流模型天然匹配
- PostgreSQL 适合长期运行的流程系统，并为后续多 Worker 扩展提供更稳的基础
- `SQLAlchemy 2.x + Alembic` 适合维护清晰的数据模型与迁移流程
- `React + Vite` 适合构建轻量但重要的管理台
- `Tailwind CSS + shadcn/ui` 适合快速构建后台审核与任务管理界面
- Docker 能提供稳定的一致性运行环境与重启策略

## 14. 部署模型

推荐的 V1 部署方式：

- 一个独立 `backend` 服务
- 一个独立 `frontend` 管理台
- `backend` 作为单常驻服务进程运行
- `backend` 连接已部署的 PostgreSQL
- 挂载日志持久化卷
- `backend` 使用 `restart: always`

推荐调用链路为：

`frontend -> backend API -> Hermes`

如果 Hermes 与编排程序部署在同一台机器上，应优先使用本地地址或内网地址通信，而不是额外暴露公网端口。

## 15. 风险点

### 15.1 Hermes 协议漂移

如果 Hermes 的返回结构发生变化，应该由 Gateway 吸收这些变化，而不是扩散到整个系统。

### 15.2 任务膨胀

Hermes 自主生成任务可能导致队列迅速膨胀。V1 至少应加入这些基础控制：

- 优先级
- 生成频率限制
- 去重
- 可选的人审筛选

### 15.3 计划漂移

执行必须基于已批准计划的快照，而不是某个后续被隐式修改的版本。

### 15.4 恢复歧义

如果本地状态显示任务正在执行，但远端状态无法确认，系统应优先选择显式升级人工，而不是静默假设任务成功或失败。

## 16. 演进路线

### V1

- 单队列
- 单执行 Worker
- Hermes 异步规划通道
- Hermes 异步执行通道
- Web 审核页
- 人工审核计划
- 审核通过后全自动执行

### V1.5

- 更好的优先级策略
- 基础去重
- 更完善的失败升级工具
- 基础运维指标

### V2

- 多执行 Worker
- 执行租约
- 感知资源的队列调度
- 更强的运行隔离能力

### V3

- 将执行能力演进为更专业的多 Agent 分工
- 继续保留现有顶层编排、Gateway、队列与审核模型

## 17. 总结

Hermes Orchestrator 是围绕 Hermes 的一层 24/7 可靠性与治理系统。

它的职责是管理：

- 任务接入
- 任务排队
- 工作流状态
- 人工审核
- 与 Hermes 的异步通信
- 执行跟踪
- 审计能力
- 重启恢复

V1 明确优先优化稳定性与清晰度：

- 一个后端服务
- 一个轻量前端管理台
- 一个队列
- 一个执行 Worker
- 两条 Hermes 交互通道
- 执行前人工审核
- 审核通过后全自动执行
