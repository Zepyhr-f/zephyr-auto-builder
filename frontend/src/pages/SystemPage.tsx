import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api, type SystemComponent } from '../api/client'

const statusColorMap: Record<string, string> = {
  New: 'text-sky-glow',
  Planning: 'text-amber-glow',
  PendingApproval: 'text-amber-soft',
  Approved: 'text-emerald-glow',
  Executing: 'text-violet-glow',
  Succeeded: 'text-emerald-glow',
  Failed: 'text-rose-glow',
  Rejected: 'text-rose-glow',
}

function TopologyNode({ comp, active }: { comp: SystemComponent; active: boolean }) {
  const colorMap: Record<string, { bg: string; ring: string; text: string; dot: string }> = {
    orchestrator: { bg: 'bg-sky-glow/10', ring: 'ring-sky-glow/40', text: 'text-sky-glow', dot: 'bg-sky-glow' },
    planning: { bg: 'bg-amber-glow/10', ring: 'ring-amber-glow/40', text: 'text-amber-glow', dot: 'bg-amber-glow' },
    approval: { bg: 'bg-amber-soft/10', ring: 'ring-amber-soft/40', text: 'text-amber-soft', dot: 'bg-amber-soft' },
    execution: { bg: 'bg-violet-glow/10', ring: 'ring-violet-glow/40', text: 'text-violet-glow', dot: 'bg-violet-glow' },
  }
  const c = colorMap[comp.id] || colorMap.orchestrator

  return (
    <div className={`relative rounded-xl ${c.bg} p-3 ring-1 ${c.ring} transition ${active ? 'scale-[1.02]' : 'opacity-75'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${c.dot} ${active ? 'animate-pulse-dot' : ''}`} style={{ color: c.dot.replace('bg-', '') }} />
          <span className={`text-xs font-medium ${c.text}`}>{comp.name}</span>
        </div>
        {comp.online ? (
          <span className="text-[10px] text-emerald-glow">在线</span>
        ) : (
          <span className="text-[10px] text-base-500">空闲</span>
        )}
      </div>
      <div className="mt-0.5 font-mono text-[10px] text-base-500">{comp.desc}</div>
      <div className="mt-2 flex flex-wrap gap-1">
        {Object.entries(comp.metrics).map(([k, v]) => (
          <span key={k} className="rounded bg-base-950/40 px-1 py-0.5 text-[10px] text-base-300">
            {k}: <span className="font-mono font-medium text-base-100">{v}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

function FlowArrow({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <div className="mb-0.5 text-[10px] text-base-500">{label}</div>
      <div className="flex w-full items-center px-1">
        <div className={`h-px flex-1 ${count > 0 ? 'bg-amber-glow/40' : 'bg-base-700'}`} />
        {count > 0 && (
          <span className="mx-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-glow/20 text-[9px] font-medium text-amber-glow">
            {count}
          </span>
        )}
        <div className={`h-px flex-1 ${count > 0 ? 'bg-amber-glow/40' : 'bg-base-700'}`} />
      </div>
      <div className={`mt-0.5 text-[10px] ${count > 0 ? 'text-amber-glow' : 'text-base-600'}`}>
        {count > 0 ? `${count}` : '空闲'}
      </div>
    </div>
  )
}

function ComponentDetail({ comp }: { comp: SystemComponent }) {
  const colorMap: Record<string, string> = {
    orchestrator: 'text-sky-glow',
    planning: 'text-amber-glow',
    approval: 'text-amber-soft',
    execution: 'text-violet-glow',
  }
  const color = colorMap[comp.id] || 'text-base-200'

  return (
    <div className="glass-panel rounded-xl p-4">
      <div className="flex items-center justify-between border-b border-base-800 pb-2">
        <div className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${comp.online ? 'bg-emerald-glow animate-pulse-dot' : 'bg-base-600'}`} style={{ color: comp.online ? '#10b981' : '#666' }} />
          <h3 className={`text-xs font-medium ${color}`}>{comp.name}</h3>
        </div>
        <span className={`text-[10px] ${comp.online ? 'text-emerald-glow' : 'text-base-500'}`}>
          {comp.online ? '在线' : '空闲'}
        </span>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        {Object.entries(comp.metrics).map(([k, v]) => (
          <div key={k} className="rounded-lg bg-base-850/50 p-2 ring-1 ring-base-800">
            <div className="text-[10px] text-base-500">{k}</div>
            <div className="mt-0.5 font-mono text-sm font-bold text-base-100">{v}</div>
          </div>
        ))}
      </div>

      {comp.active_tasks && comp.active_tasks.length > 0 && (
        <div className="mt-2">
          <div className="mb-1 text-[10px] text-base-400">
            正在处理（{comp.active_tasks.length}）
          </div>
          <div className="space-y-1">
            {comp.active_tasks.map(task => (
              <Link
                key={task.id}
                to={`/tasks/${task.id}`}
                className="flex items-center justify-between rounded-lg bg-base-950/50 px-2 py-1.5 ring-1 ring-base-800 transition hover:ring-amber-glow/30"
              >
                <span className="truncate text-xs text-base-200">{task.title}</span>
                <span className={`ml-2 flex-shrink-0 text-[10px] ${statusColorMap[task.status] || 'text-base-400'}`}>
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
    <div className="space-y-4">
      {/* 网络拓扑 */}
      <div className="glass-panel rounded-xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-medium text-base-200">网络拓扑</h3>
          <div className="flex items-center gap-3 text-[10px] text-base-500">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-glow animate-pulse-dot" style={{ color: '#f59e0b' }} />
              活跃
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-base-600" />
              空闲
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1 w-3 rounded-full bg-amber-glow/40" />
              流向
            </span>
          </div>
        </div>
        {isLoading ? (
          <div className="h-24 animate-pulse rounded-xl bg-base-850" />
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

      {/* 组件详情 */}
      <div className="grid gap-3 lg:grid-cols-2">
        {components.map(comp => (
          <ComponentDetail key={comp.id} comp={comp} />
        ))}
      </div>

      {/* 任务状态分布 */}
      <div className="glass-panel rounded-xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-medium text-base-200">任务状态分布</h3>
          <span className="text-[10px] text-base-500">共 {data?.total_tasks ?? 0} 个</span>
        </div>
        {isLoading ? (
          <div className="h-6 animate-pulse rounded-lg bg-base-850" />
        ) : (
          <div className="flex h-6 overflow-hidden rounded-lg">
            {[
              { key: 'New', color: 'bg-sky-glow' },
              { key: 'Planning', color: 'bg-amber-glow' },
              { key: 'PendingApproval', color: 'bg-amber-soft' },
              { key: 'Approved', color: 'bg-emerald-glow' },
              { key: 'Executing', color: 'bg-violet-glow' },
              { key: 'Succeeded', color: 'bg-emerald-glow/60' },
              { key: 'Failed', color: 'bg-rose-glow' },
              { key: 'Rejected', color: 'bg-rose-glow/60' },
            ].map(seg => {
              const val = counts[seg.key] || 0
              const total = data?.total_tasks || 1
              const pct = (val / total) * 100
              if (pct === 0) return null
              return (
                <div
                  key={seg.key}
                  className={`${seg.color} transition-all`}
                  style={{ width: `${pct}%` }}
                  title={`${seg.key}: ${val}`}
                />
              )
            })}
          </div>
        )}
        <div className="mt-2 flex flex-wrap gap-2">
          {Object.entries(counts).map(([status, count]) => (
            <span key={status} className="flex items-center gap-1 text-[10px]">
              <span className={`h-1.5 w-1.5 rounded-full ${statusColorMap[status]?.replace('text-', 'bg-') || 'bg-base-500'}`} />
              <span className="text-base-400">{status}</span>
              <span className="font-mono font-medium text-base-100">{count}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
