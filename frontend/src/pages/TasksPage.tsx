import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api, type Task } from '../api/client'

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

const taskTypeLabels: Record<string, string> = {
  requirement: '需求',
  document: '文档',
  bug: 'Bug 巡检',
  optimization: '优化',
}

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] || statusConfig.Queued
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full ${cfg.bg} px-2.5 py-1 text-xs font-medium ${cfg.color} ring-1 ${cfg.ring}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot} ${(status === 'Executing' || status === 'Planning') ? 'animate-pulse-dot' : ''}`} style={{ color: cfg.dot.replace('bg-', '') }} />
      {status}
    </span>
  )
}

function CreateTaskModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [taskType, setTaskType] = useState('requirement')
  const [source, setSource] = useState('human')

  const mutation = useMutation({
    mutationFn: () => api.createTask({ title, task_type: taskType, source_type: source }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      onClose()
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-panel w-full max-w-md rounded-2xl p-6" onClick={e => e.stopPropagation()}>
        <h3 className="mb-4 text-base font-medium text-base-100">新建任务</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-base-400">标题</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full rounded-lg bg-base-850 px-3 py-2 text-sm text-base-100 ring-1 ring-base-700 focus:ring-2 focus:ring-amber-glow/50 focus:outline-none"
              placeholder="描述任务目标..."
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-base-400">类型</label>
              <select
                value={taskType}
                onChange={e => setTaskType(e.target.value)}
                className="w-full rounded-lg bg-base-850 px-3 py-2 text-sm text-base-100 ring-1 ring-base-700 focus:ring-2 focus:ring-amber-glow/50 focus:outline-none"
              >
                <option value="requirement">需求</option>
                <option value="document">文档</option>
                <option value="bug">Bug 巡检</option>
                <option value="optimization">优化</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-base-400">来源</label>
              <select
                value={source}
                onChange={e => setSource(e.target.value)}
                className="w-full rounded-lg bg-base-850 px-3 py-2 text-sm text-base-100 ring-1 ring-base-700 focus:ring-2 focus:ring-amber-glow/50 focus:outline-none"
              >
                <option value="human">人工</option>
                <option value="hermes">Hermes</option>
                <option value="scheduled">定时</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => mutation.mutate()}
              disabled={!title.trim() || mutation.isPending}
              className="flex-1 rounded-lg bg-amber-glow/90 px-4 py-2 text-sm font-medium text-base-950 transition hover:bg-amber-glow disabled:cursor-not-allowed disabled:opacity-40"
            >
              {mutation.isPending ? '创建中...' : '创建'}
            </button>
            <button
              onClick={onClose}
              className="rounded-lg bg-base-800 px-4 py-2 text-sm text-base-300 ring-1 ring-base-700 hover:text-base-100"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function TasksPage() {
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: api.listTasks,
    refetchInterval: 5000,
  })
  const [showCreate, setShowCreate] = useState(false)

  const statusCounts = tasks?.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-base-100">任务队列</h2>
          <p className="mt-1 text-sm text-base-400">管理和监控所有 Hermes 执行任务</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-amber-glow/90 px-4 py-2 text-sm font-medium text-base-950 transition hover:bg-amber-glow glow-amber"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          新建任务
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: '待规划', key: 'New', color: 'text-sky-glow' },
          { label: '执行中', key: 'Executing', color: 'text-violet-glow' },
          { label: '待审核', key: 'PendingApproval', color: 'text-amber-soft' },
          { label: '已完成', key: 'Succeeded', color: 'text-emerald-glow' },
        ].map(stat => (
          <div key={stat.key} className="glass-panel rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-base-400">{stat.label}</span>
              <span className={`h-2 w-2 rounded-full ${stat.color.replace('text-', 'bg-')}`} />
            </div>
            <p className={`mt-2 font-mono text-2xl font-bold ${stat.color}`}>
              {statusCounts[stat.key] || 0}
            </p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-panel h-16 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : tasks && tasks.length === 0 ? (
        <div className="glass-panel rounded-xl p-16 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-base-800">
            <svg className="h-6 w-6 text-base-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-sm text-base-400">还没有任务，点击"新建任务"开始</p>
        </div>
      ) : (
        <div className="glass-panel overflow-hidden rounded-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-base-800 text-left">
                <th className="px-4 py-3 font-medium text-base-400">任务</th>
                <th className="px-4 py-3 font-medium text-base-400">状态</th>
                <th className="px-4 py-3 font-medium text-base-400">类型</th>
                <th className="px-4 py-3 font-medium text-base-400">来源</th>
                <th className="px-4 py-3 font-medium text-base-400">创建时间</th>
              </tr>
            </thead>
            <tbody>
              {tasks?.map((task: Task, i: number) => (
                <tr
                  key={task.id}
                  className="group border-b border-base-850 transition hover:bg-base-850/50"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <td className="px-4 py-3">
                    <Link to={`/tasks/${task.id}`} className="font-medium text-base-100 transition group-hover:text-amber-glow">
                      {task.title}
                    </Link>
                    <div className="mt-0.5 font-mono text-xs text-base-600">{task.id.slice(0, 8)}</div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={task.status} /></td>
                  <td className="px-4 py-3 text-base-300">{taskTypeLabels[task.task_type] || task.task_type}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-base-400">{task.source_type}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-base-500">
                    {new Date(task.created_at).toLocaleString('zh-CN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && <CreateTaskModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
