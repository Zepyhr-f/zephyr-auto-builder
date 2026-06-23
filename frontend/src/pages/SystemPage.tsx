import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api, type SystemComponent } from '../api/client'

const statusColorMap: Record<string, string> = {
  New: 'text-[var(--color-status-new)]',
  Planning: 'text-[var(--color-status-plan)]',
  PendingApproval: 'text-[var(--color-status-review)]',
  Approved: 'text-[var(--color-status-approved)]',
  Executing: 'text-[var(--color-status-exec)]',
  Succeeded: 'text-[var(--color-status-done)]',
  Failed: 'text-[var(--color-status-fail)]',
  Rejected: 'text-[var(--color-status-fail)]',
}

const compColors: Record<string, { bg: string; text: string; dot: string }> = {
  orchestrator: { bg: 'bg-[var(--color-status-new)]/8', text: 'text-[var(--color-status-new)]', dot: 'bg-[var(--color-status-new)]' },
  planning:     { bg: 'bg-[var(--color-status-plan)]/8', text: 'text-[var(--color-status-plan)]', dot: 'bg-[var(--color-status-plan)]' },
  approval:     { bg: 'bg-[var(--color-status-review)]/8', text: 'text-[var(--color-status-review)]', dot: 'bg-[var(--color-status-review)]' },
  execution:    { bg: 'bg-[var(--color-status-exec)]/8', text: 'text-[var(--color-status-exec)]', dot: 'bg-[var(--color-status-exec)]' },
}

function TopologyNode({ comp, active }: { comp: SystemComponent; active: boolean }) {
  const c = compColors[comp.id] || compColors.orchestrator
  return (
    <div className={`relative rounded-xl border border-[var(--color-border)] ${c.bg} p-3 transition ${active ? 'scale-[1.02]' : 'opacity-75'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${c.dot} ${active ? 'animate-pulse-dot' : ''}`} />
          <span className={`font-serif-sc text-xs font-medium ${c.text}`}>{comp.name}</span>
        </div>
        <span className="text-[10px] text-tertiary">{comp.online ? '在线' : '空闲'}</span>
      </div>
      <div className="mt-0.5 font-mono text-[10px] text-tertiary">{comp.desc}</div>
      <div className="mt-2 flex flex-wrap gap-1">
        {Object.entries(comp.metrics).map(([k, v]) => (
          <span key={k} className="rounded bg-[var(--color-bg-base)] px-1 py-0.5 text-[10px] text-secondary">
            {k}: <span className="font-mono font-medium text-primary">{v}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

function FlowArrow({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <div className="mb-0.5 text-[10px] text-tertiary">{label}</div>
      <div className="flex w-full items-center px-1">
        <div className={`h-px flex-1 ${count > 0 ? 'bg-brand/40' : 'bg-[var(--color-border)]'}`} />
        {count > 0 && (
          <span className="mx-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-brand/15 text-[9px] font-medium text-brand">
            {count}
          </span>
        )}
        <div className={`h-px flex-1 ${count > 0 ? 'bg-brand/40' : 'bg-[var(--color-border)]'}`} />
      </div>
    </div>
  )
}

function ComponentDetail({ comp }: { comp: SystemComponent }) {
  const c = compColors[comp.id] || compColors.orchestrator
  return (
    <div className="paper-card rounded-xl p-4">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2">
        <div className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${comp.online ? c.dot : 'bg-tertiary'} ${comp.online ? 'animate-pulse-dot' : ''}`} />
          <h3 className={`font-serif-sc text-xs font-medium ${c.text}`}>{comp.name}</h3>
        </div>
        <span className="text-[10px] text-tertiary">{comp.online ? '在线' : '空闲'}</span>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        {Object.entries(comp.metrics).map(([k, v]) => (
          <div key={k} className="rounded-lg border border-[var(--color-border-light)] bg-[var(--color-bg-base)] p-2">
            <div className="text-[10px] text-tertiary">{k}</div>
            <div className="mt-0.5 font-mono text-sm font-bold text-primary">{v}</div>
          </div>
        ))}
      </div>

      {comp.active_tasks && comp.active_tasks.length > 0 && (
        <div className="mt-2">
          <div className="mb-1 text-[10px] text-tertiary">正在处理（{comp.active_tasks.length}）</div>
          <div className="space-y-1">
            {comp.active_tasks.map(task => (
              <Link
                key={task.id}
                to={`/tasks/${task.id}`}
                className="flex items-center justify-between rounded-lg border border-[var(--color-border-light)] bg-[var(--color-bg-base)] px-2 py-1.5 transition hover:border-brand/30"
              >
                <span className="truncate text-xs text-secondary">{task.title}</span>
                <span className={`ml-2 flex-shrink-0 text-[10px] ${statusColorMap[task.status] || 'text-tertiary'}`}>
                  {task.status}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function SystemPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['system-components'],
    queryFn: api.getSystemComponents,
    refetchInterval: 3000,
  })

  const components = data?.components || []
  const counts = data?.task_counts || {}
  const orchestrator = components.find(c => c.id === 'orchestrator')
  const planning = components.find(c => c.id === 'planning')
  const approval = components.find(c => c.id === 'approval')
  const execution = components.find(c => c.id === 'execution')

  const planningQueue = (counts.New || 0) + (counts.Planning || 0)
  const approvalQueue = counts.PendingApproval || 0
  const executionQueue = counts.Executing || 0

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-playfair text-2xl font-bold text-primary">系统状态</h2>
          <p className="mt-0.5 font-serif-sc text-xs tracking-wider text-tertiary">网络拓扑与组件运行状态</p>
        </div>
        <span className="rounded-full bg-secondary/5 px-3 py-1 text-xs text-tertiary">
          总任务 <span className="font-mono font-medium text-primary">{data?.total_tasks ?? 0}</span>
        </span>
      </div>

      <div className="paper-card rounded-xl p-4">
        <h3 className="mb-3 font-serif-sc text-xs font-medium text-secondary">网络拓扑</h3>
        {isLoading ? (
          <div className="h-24 animate-pulse rounded-xl bg-secondary/5" />
        ) : (
          <div className="flex items-stretch gap-1.5">
            {orchestrator && (
              <>
                <div className="w-40 flex-shrink-0">
                  <TopologyNode comp={orchestrator} active={planningQueue > 0} />
                </div>
                <FlowArrow label="规划" count={planningQueue} />
                <div className="w-40 flex-shrink-0">
                  {planning && <TopologyNode comp={planning} active={planningQueue > 0} />}
                </div>
                <FlowArrow label="审核" count={approvalQueue} />
                <div className="w-40 flex-shrink-0">
                  {approval && <TopologyNode comp={approval} active={approvalQueue > 0} />}
                </div>
                <FlowArrow label="执行" count={executionQueue} />
                <div className="w-40 flex-shrink-0">
                  {execution && <TopologyNode comp={execution} active={executionQueue > 0} />}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {components.map(comp => (
          <ComponentDetail key={comp.id} comp={comp} />
        ))}
      </div>

      <div className="paper-card rounded-xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-serif-sc text-xs font-medium text-secondary">任务状态分布</h3>
          <span className="text-[10px] text-tertiary">共 {data?.total_tasks ?? 0} 个</span>
        </div>
        {isLoading ? (
          <div className="h-6 animate-pulse rounded-lg bg-secondary/5" />
        ) : (
          <div className="flex h-6 overflow-hidden rounded-lg border border-[var(--color-border-light)]">
            {[
              { key: 'New', color: 'bg-[var(--color-status-new)]' },
              { key: 'Planning', color: 'bg-[var(--color-status-plan)]' },
              { key: 'PendingApproval', color: 'bg-[var(--color-status-review)]' },
              { key: 'Approved', color: 'bg-[var(--color-status-approved)]' },
              { key: 'Executing', color: 'bg-[var(--color-status-exec)]' },
              { key: 'Succeeded', color: 'bg-[var(--color-status-done)]' },
              { key: 'Failed', color: 'bg-[var(--color-status-fail)]' },
              { key: 'Rejected', color: 'bg-[var(--color-status-fail)]' },
            ].map(seg => {
              const val = counts[seg.key] || 0
              const total = data?.total_tasks || 1
              const pct = (val / total) * 100
              if (pct === 0) return null
              return <div key={seg.key} className={seg.color} style={{ width: `${pct}%` }} title={`${seg.key}: ${val}`} />
            })}
          </div>
        )}
        <div className="mt-2 flex flex-wrap gap-2">
          {Object.entries(counts).map(([status, count]) => (
            <span key={status} className="flex items-center gap-1 text-[10px]">
              <span className={`h-1.5 w-1.5 rounded-full ${statusColorMap[status]?.replace('text-', 'bg-') || 'bg-tertiary'}`} />
              <span className="text-tertiary">{status}</span>
              <span className="font-mono font-medium text-primary">{count}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
