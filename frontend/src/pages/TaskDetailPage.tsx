import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api/client'

const statusConfig: Record<string, { color: string; bg: string; ring: string; dot: string }> = {
  New:               { color: 'text-sky-glow',     bg: 'bg-sky-glow/10',     ring: 'ring-sky-glow/30',     dot: 'bg-sky-glow' },
  Planning:          { color: 'text-amber-glow',   bg: 'bg-amber-glow/10',   ring: 'ring-amber-glow/30',   dot: 'bg-amber-glow' },
  PendingApproval:   { color: 'text-amber-soft',   bg: 'bg-amber-soft/10',   ring: 'ring-amber-soft/30',   dot: 'bg-amber-soft' },
  Approved:          { color: 'text-emerald-glow', bg: 'bg-emerald-glow/10', ring: 'ring-emerald-glow/30', dot: 'bg-emerald-glow' },
  Queued:            { color: 'text-base-300',     bg: 'bg-base-700/30',     ring: 'ring-base-600',         dot: 'bg-base-400' },
  Executing:         { color: 'text-violet-glow',  bg: 'bg-violet-glow/10',  ring: 'ring-violet-glow/30',  dot: 'bg-violet-glow' },
  Succeeded:         { color: 'text-emerald-glow', bg: 'bg-emerald-glow/10', ring: 'ring-emerald-glow/30', dot: 'bg-emerald-glow' },
  Failed:            { color: 'text-rose-glow',    bg: 'bg-rose-glow/10',    ring: 'ring-rose-glow/30',    dot: 'bg-rose-glow' },
  Rejected:          { color: 'text-rose-glow',    bg: 'bg-rose-glow/10',    ring: 'ring-rose-glow/30',    dot: 'bg-rose-glow' },
  Escalated:         { color: 'text-rose-glow',    bg: 'bg-rose-glow/10',    ring: 'ring-rose-glow/30',    dot: 'bg-rose-glow' },
}

const lifecycleSteps = [
  { key: 'New', label: '创建' },
  { key: 'Planning', label: '规划' },
  { key: 'PendingApproval', label: '待审' },
  { key: 'Approved', label: '已批准' },
  { key: 'Queued', label: '排队' },
  { key: 'Executing', label: '执行' },
  { key: 'Succeeded', label: '完成' },
]

function getLifecycleProgress(currentStatus: string): number {
  const idx = lifecycleSteps.findIndex(s => s.key === currentStatus)
  if (idx === -1) return 0
  if (currentStatus === 'Failed' || currentStatus === 'Rejected' || currentStatus === 'Escalated') return 7
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
    return (
      <div className="space-y-4">
        <div className="glass-panel h-12 animate-pulse rounded-xl" />
        <div className="glass-panel h-64 animate-pulse rounded-xl" />
      </div>
    )
  }
  if (!task) {
    return (
      <div className="glass-panel rounded-xl p-16 text-center">
        <p className="text-base-400">任务未找到</p>
        <Link to="/" className="mt-4 inline-block text-sm text-amber-glow hover:underline">返回任务列表</Link>
      </div>
    )
  }

  const cfg = statusConfig[task.status] || statusConfig.Queued
  const progress = getLifecycleProgress(task.status)

  const infoItems = [
    { label: '类型', value: task.task_type },
    { label: '来源', value: task.source_type },
    { label: '优先级', value: String(task.priority) },
    { label: '创建时间', value: new Date(task.created_at).toLocaleString('zh-CN') },
    { label: '更新时间', value: new Date(task.updated_at).toLocaleString('zh-CN') },
  ]

  return (
    <div className="space-y-6">
      <div>
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-base-400 transition hover:text-base-100">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          返回任务列表
        </Link>
      </div>

      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-base-100">{task.title}</h2>
            <p className="mt-1 font-mono text-xs text-base-500">{task.id}</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 rounded-full ${cfg.bg} px-3 py-1 text-xs font-medium ${cfg.color} ring-1 ${cfg.ring}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot} ${(task.status === 'Executing' || task.status === 'Planning') ? 'animate-pulse-dot' : ''}`} style={{ color: cfg.dot.replace('bg-', '') }} />
            {task.status}
          </span>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-base-400">生命周期</span>
            <span className="font-mono text-xs text-base-500">{progress} / {lifecycleSteps.length}</span>
          </div>
          <div className="flex items-center gap-1">
            {lifecycleSteps.map((step, i) => {
              const isDone = i < progress
              const isCurrent = i === progress - 1
              return (
                <div key={step.key} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ring-1 transition ${
                        isDone
                          ? isCurrent
                            ? `${cfg.bg} ${cfg.color} ${cfg.ring}`
                            : 'bg-emerald-glow/15 text-emerald-glow ring-emerald-glow/30'
                          : 'bg-base-850 text-base-600 ring-base-700'
                      }`}
                    >
                      {isDone && !isCurrent ? (
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : i + 1}
                    </div>
                    <span className={`text-[10px] ${isDone ? 'text-base-200' : 'text-base-600'}`}>{step.label}</span>
                  </div>
                  {i < lifecycleSteps.length - 1 && (
                    <div className={`mx-1 h-px flex-1 ${i < progress - 1 ? 'bg-emerald-glow/30' : 'bg-base-700'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="mb-4 text-sm font-medium text-base-200">任务信息</h3>
          <dl className="space-y-3">
            {infoItems.map(item => (
              <div key={item.label} className="flex items-center justify-between border-b border-base-850 pb-2 last:border-0">
                <dt className="text-xs text-base-500">{item.label}</dt>
                <dd className="font-mono text-sm text-base-200">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="glass-panel rounded-2xl p-6">
          <h3 className="mb-4 text-sm font-medium text-base-200">关联计划</h3>
          <div className="space-y-3">
            <div>
              <div className="mb-1 text-xs text-base-500">当前计划</div>
              <div className="rounded-lg bg-base-850 px-3 py-2 font-mono text-xs text-base-300 ring-1 ring-base-700">
                {task.current_plan_id || '暂无'}
              </div>
            </div>
            <div>
              <div className="mb-1 text-xs text-base-500">已批准计划</div>
              <div className={`rounded-lg px-3 py-2 font-mono text-xs ring-1 ${
                task.approved_plan_id
                  ? 'bg-emerald-glow/10 text-emerald-glow ring-emerald-glow/30'
                  : 'bg-base-850 text-base-500 ring-base-700'
              }`}>
                {task.approved_plan_id || '暂无'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-6">
        <h3 className="mb-4 text-sm font-medium text-base-200">事件日志</h3>
        {eventsData?.events && eventsData.events.length > 0 ? (
          <div className="space-y-3">
            {eventsData.events.map((event, i) => (
              <div key={event.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="h-2 w-2 rounded-full bg-amber-glow" />
                  {i < eventsData.events.length - 1 && <div className="w-px flex-1 bg-base-700" />}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-medium text-amber-glow">{event.event_type}</span>
                    <span className="font-mono text-xs text-base-500">
                      {new Date(event.created_at).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  {event.event_payload && (
                    <p className="mt-1 text-xs text-base-400">{event.event_payload}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 py-4 text-sm text-base-500">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            暂无事件记录
          </div>
        )}
      </div>
    </div>
  )
}
