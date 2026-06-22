import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'

export function SystemPage() {
  const { data: status, isLoading } = useQuery({
    queryKey: ['system-status'],
    queryFn: api.getSystemStatus,
    refetchInterval: 5000,
  })

  const metrics = [
    { label: '服务状态', value: status?.status ?? 'unknown', color: 'text-emerald-glow', icon: 'M5 13l4 4L19 7' },
    { label: '版本号', value: status?.version ?? 'unknown', color: 'text-sky-glow', icon: 'M7 7h10m-10 4h10m-10 4h6M4 7v10a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2z' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-base-100">系统状态</h2>
        <p className="mt-1 text-sm text-base-400">实时监控 Hermes Orchestrator 运行状态</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {metrics.map(m => (
          <div key={m.label} className="glass-panel rounded-2xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-medium text-base-400">{m.label}</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-base-850">
                <svg className={`h-4 w-4 ${m.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={m.icon} />
                </svg>
              </div>
            </div>
            {isLoading ? (
              <div className="h-8 w-32 animate-pulse rounded bg-base-800" />
            ) : (
              <p className={`font-mono text-2xl font-bold ${m.color}`}>
                {m.value}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="glass-panel rounded-2xl p-6">
        <h3 className="mb-4 text-sm font-medium text-base-200">系统组件</h3>
        <div className="space-y-3">
          {[
            { name: '编排引擎', desc: 'Workflow Engine', online: true },
            { name: '规划通道', desc: 'Planning Lane', online: true },
            { name: '执行通道', desc: 'Execution Lane', online: true },
            { name: 'Hermes 网关', desc: 'Hermes Gateway', online: true },
          ].map(comp => (
            <div key={comp.name} className="flex items-center justify-between border-b border-base-850 pb-3 last:border-0">
              <div>
                <div className="text-sm font-medium text-base-100">{comp.name}</div>
                <div className="font-mono text-xs text-base-500">{comp.desc}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-glow animate-pulse-dot" style={{ color: '#10b981' }} />
                <span className="text-xs text-emerald-glow">在线</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-6">
        <h3 className="mb-4 text-sm font-medium text-base-200">执行约束</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: '执行模式', value: '单线程' },
            { label: 'Worker 数量', value: '1' },
            { label: '审核闸门', value: '已启用' },
            { label: '自动恢复', value: '已启用' },
          ].map(item => (
            <div key={item.label} className="rounded-xl bg-base-850/50 p-4 ring-1 ring-base-800">
              <div className="text-xs text-base-500">{item.label}</div>
              <div className="mt-1 font-mono text-sm font-medium text-base-100">{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
