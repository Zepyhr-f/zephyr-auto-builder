import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api/client'

const statusConfig: Record<string, { color: string; bg: string; dot: string }> = {
  New:             { color: 'text-[var(--color-status-new)]',     bg: 'bg-[var(--color-status-new)]/8',     dot: 'bg-[var(--color-status-new)]' },
  Planning:        { color: 'text-[var(--color-status-plan)]',    bg: 'bg-[var(--color-status-plan)]/8',    dot: 'bg-[var(--color-status-plan)]' },
  PendingApproval: { color: 'text-[var(--color-status-review)]',  bg: 'bg-[var(--color-status-review)]/8',  dot: 'bg-[var(--color-status-review)]' },
  Approved:        { color: 'text-[var(--color-status-approved)]', bg: 'bg-[var(--color-status-approved)]/8', dot: 'bg-[var(--color-status-approved)]' },
  Queued:          { color: 'text-secondary',                     bg: 'bg-secondary/5',                     dot: 'bg-tertiary' },
  Executing:       { color: 'text-[var(--color-status-exec)]',   bg: 'bg-[var(--color-status-exec)]/8',   dot: 'bg-[var(--color-status-exec)]' },
  Succeeded:       { color: 'text-[var(--color-status-done)]',   bg: 'bg-[var(--color-status-done)]/8',   dot: 'bg-[var(--color-status-done)]' },
  Failed:          { color: 'text-[var(--color-status-fail)]',   bg: 'bg-[var(--color-status-fail)]/8',   dot: 'bg-[var(--color-status-fail)]' },
  Rejected:        { color: 'text-[var(--color-status-fail)]',   bg: 'bg-[var(--color-status-fail)]/8',   dot: 'bg-[var(--color-status-fail)]' },
  Escalated:       { color: 'text-[var(--color-status-fail)]',   bg: 'bg-[var(--color-status-fail)]/8',   dot: 'bg-[var(--color-status-fail)]' },
}

const lifecycleSteps = [
  { key: 'New', label: '创建' },
  { key: 'Planning', label: '规划' },
  { key: 'PendingApproval', label: '待审' },
  { key: 'Approved', label: '批准' },
  { key: 'Queued', label: '排队' },
  { key: 'Executing', label: '执行' },
  { key: 'Succeeded', label: '完成' },
]

function getLifecycleProgress(status: string): number {
  const idx = lifecycleSteps.findIndex(s => s.key === status)
  if (idx === -1) return 0
  if (status === 'Failed' || status === 'Rejected' || status === 'Escalated') return 7
  return idx + 1
}

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: task, isLoading } = useQuery({
    queryKey: ['task', id],
    queryFn: () => api.getTask(id!),
    enabled: !!id,
    refetchInterval: 3000,
  })
  const { data: eventsData } = useQuery({
    queryKey: ['task-events', id],
    queryFn: () => api.getTaskEvents(id!),
    enabled: !!id,
  })

  if (isLoading) {
    return <div className="paper-card h-48 animate-pulse rounded-xl" />
  }
  if (!task) {
    return (
      <div className="paper-card rounded-xl p-12 text-center">
        <p className="text-tertiary">任务未找到</p>
        <Link to="/" className="mt-3 inline-block text-sm text-brand hover:underline">返回任务列表</Link>
      </div>
    )
  }

  const cfg = statusConfig[task.status] || statusConfig.Queued
  const progress = getLifecycleProgress(task.status)

  const infoItems = [
    { label: '类型', value: task.task_type },
    { label: '来源', value: task.source_type },
    { label: '优先级', value: String(task.priority) },
    { label: '创建', value: new Date(task.created_at).toLocaleString('zh-CN') },
    { label: '更新', value: new Date(task.updated_at).toLocaleString('zh-CN') },
  ]

  return (
    <div className="space-y-4">
      <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-tertiary transition hover:text-brand">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        返回列表
      </Link>

      <div className="paper-card rounded-xl p-5">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-playfair text-xl font-bold text-primary">{task.title}</h2>
            <p className="mt-0.5 font-mono text-xs text-tertiary">{task.id}</p>
          </div>
          <span className={`ml-3 inline-flex flex-shrink-0 items-center gap-1.5 rounded-md ${cfg.bg} px-2.5 py-1 text-xs font-medium ${cfg.color}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot} ${(task.status === 'Executing' || task.status === 'Planning') ? 'animate-pulse-dot' : ''}`} />
            {task.status}
          </span>
        </div>

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="font-serif-sc text-xs text-secondary">生命周期</span>
            <span className="font-mono text-[10px] text-tertiary">{progress}/{lifecycleSteps.length}</span>
          </div>
          <div className="flex items-center gap-0.5">
            {lifecycleSteps.map((step, i) => {
              const isDone = i < progress
              const isCurrent = i === progress - 1
              return (
                <div key={step.key} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] transition ${
                      isDone
                        ? isCurrent
                          ? `${cfg.bg} ${cfg.color}`
                          : 'bg-[var(--color-status-approved)]/10 text-[var(--color-status-done)]'
                        : 'bg-secondary/5 text-tertiary'
                    }`}>
                      {isDone && !isCurrent ? (
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : i + 1}
                    </div>
                    <span className={`text-[9px] ${isDone ? 'text-secondary' : 'text-tertiary'}`}>{step.label}</span>
                  </div>
                  {i < lifecycleSteps.length - 1 && (
                    <div className={`mx-0.5 h-px flex-1 ${i < progress - 1 ? 'bg-[var(--color-status-approved)]/30' : 'bg-[var(--color-border)]'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-5">
        <div className="paper-card rounded-xl p-4 lg:col-span-3">
          <h3 className="mb-3 font-serif-sc text-xs font-medium text-secondary">任务信息</h3>
          <dl className="space-y-2">
            {infoItems.map(item => (
              <div key={item.label} className="flex items-center justify-between border-b border-[var(--color-border-light)] pb-1.5 last:border-0">
                <dt className="text-xs text-tertiary">{item.label}</dt>
                <dd className="font-mono text-xs text-secondary">{item.value}</dd>
              </div>
            ))}
          </dl>
          {task.source_payload && (
            <div className="mt-3">
              <div className="mb-1 text-xs text-tertiary">正文</div>
              <div className="rounded-lg border border-[var(--color-border-light)] bg-[var(--color-bg-base)] p-2.5">
                <p className="whitespace-pre-wrap text-xs leading-relaxed text-secondary">{task.source_payload}</p>
              </div>
            </div>
          )}
        </div>

        <div className="paper-card rounded-xl p-4 lg:col-span-2">
          <h3 className="mb-3 font-serif-sc text-xs font-medium text-secondary">关联计划</h3>
          <div className="space-y-2">
            <div>
              <div className="mb-1 text-xs text-tertiary">当前计划</div>
              <div className="rounded-lg border border-[var(--color-border-light)] bg-[var(--color-bg-base)] px-2.5 py-1.5 font-mono text-xs text-secondary">
                {task.current_plan_id || '暂无'}
              </div>
            </div>
            <div>
              <div className="mb-1 text-xs text-tertiary">已批准计划</div>
              <div className={`rounded-lg border px-2.5 py-1.5 font-mono text-xs ${
                task.approved_plan_id
                  ? 'border-[var(--color-status-approved)]/30 bg-[var(--color-status-approved)]/5 text-[var(--color-status-done)]'
                  : 'border-[var(--color-border-light)] bg-[var(--color-bg-base)] text-tertiary'
              }`}>
                {task.approved_plan_id || '暂无'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="paper-card rounded-xl p-4">
        <h3 className="mb-3 font-serif-sc text-xs font-medium text-secondary">事件日志</h3>
        {eventsData?.events && eventsData.events.length > 0 ? (
          <div className="space-y-2">
            {eventsData.events.map((event, i) => (
              <div key={event.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="h-1.5 w-1.5 rounded-full bg-brand" />
                  {i < eventsData.events.length - 1 && <div className="w-px flex-1 bg-[var(--color-border)]" />}
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-medium text-brand">{event.event_type}</span>
                    <span className="font-mono text-[10px] text-tertiary">
                      {new Date(event.created_at).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  {event.event_payload && (
                    <p className="mt-0.5 text-xs text-tertiary">{event.event_payload}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-2 text-sm text-tertiary">暂无事件记录</p>
        )}
      </div>
    </div>
  )
}
