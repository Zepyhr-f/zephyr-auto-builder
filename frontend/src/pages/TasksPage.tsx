import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api, type Task } from '../api/client'

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

const taskTypeLabels: Record<string, string> = {
  requirement: '需求',
  document: '文档',
  bug: 'Bug',
  optimization: '优化',
}

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] || statusConfig.Queued
  const pulse = status === 'Executing' || status === 'Planning'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md ${cfg.bg} px-2 py-0.5 text-xs font-medium ${cfg.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot} ${pulse ? 'animate-pulse-dot' : ''}`} />
      {status}
    </span>
  )
}

function CreateTaskModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [taskType, setTaskType] = useState('requirement')

  const mutation = useMutation({
    mutationFn: () => api.createTask({ title, source_payload: body, task_type: taskType }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      onClose()
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={onClose}>
      <div className="paper-card w-full max-w-lg rounded-2xl p-6" onClick={e => e.stopPropagation()}>
        <h3 className="mb-4 font-serif-sc text-base font-medium text-primary">新建任务</h3>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-tertiary">标题</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-base)] px-3 py-2 text-sm text-primary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/20"
              placeholder="简要描述任务目标..."
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-tertiary">正文</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-base)] px-3 py-2 text-sm text-primary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/20"
              rows={5}
              placeholder="详细描述任务背景、需求、验收标准等..."
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-tertiary">类型</label>
            <select
              value={taskType}
              onChange={e => setTaskType(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-base)] px-3 py-2 text-sm text-primary focus:border-brand focus:outline-none"
            >
              <option value="requirement">需求</option>
              <option value="document">文档</option>
              <option value="bug">Bug 巡检</option>
              <option value="optimization">优化</option>
            </select>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => mutation.mutate()}
              disabled={!title.trim() || mutation.isPending}
              className="flex-1 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {mutation.isPending ? '创建中...' : '创建'}
            </button>
            <button
              onClick={onClose}
              className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-secondary transition hover:bg-primary/5"
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

  const stats = [
    { label: '待规划', key: 'New', color: 'text-[var(--color-status-new)]', dot: 'bg-[var(--color-status-new)]' },
    { label: '执行中', key: 'Executing', color: 'text-[var(--color-status-exec)]', dot: 'bg-[var(--color-status-exec)]' },
    { label: '待审核', key: 'PendingApproval', color: 'text-[var(--color-status-review)]', dot: 'bg-[var(--color-status-review)]' },
    { label: '已完成', key: 'Succeeded', color: 'text-[var(--color-status-done)]', dot: 'bg-[var(--color-status-done)]' },
  ]

  return (
    <div className="space-y-5">
      {/* 页面标题 */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-playfair text-2xl font-bold text-primary">任务队列</h2>
          <p className="mt-0.5 font-serif-sc text-xs tracking-wider text-tertiary">管理和监控所有执行任务</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:brightness-110"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          新建任务
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-3">
        {stats.map(stat => (
          <div key={stat.key} className="paper-card rounded-xl p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-tertiary">{stat.label}</span>
              <span className={`h-1.5 w-1.5 rounded-full ${stat.dot}`} />
            </div>
            <p className={`mt-1 font-mono text-xl font-bold ${stat.color}`}>
              {statusCounts[stat.key] || 0}
            </p>
          </div>
        ))}
      </div>

      {/* 任务列表 */}
      <div className="paper-card overflow-hidden rounded-xl">
        <div className="border-b border-[var(--color-border)] px-4 py-2.5">
          <div className="flex items-center gap-2">
            <h3 className="font-serif-sc text-sm font-medium text-secondary">任务列表</h3>
            <span className="rounded-full bg-secondary/5 px-2 py-0.5 text-xs text-tertiary">
              {tasks?.length || 0}
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-1">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-12 animate-pulse bg-secondary/5" />
            ))}
          </div>
        ) : tasks && tasks.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm text-tertiary">还没有任务，点击"新建任务"开始</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left text-xs">
                <th className="px-4 py-2 font-medium text-tertiary">任务</th>
                <th className="px-4 py-2 font-medium text-tertiary">状态</th>
                <th className="px-4 py-2 font-medium text-tertiary">类型</th>
                <th className="px-4 py-2 font-medium text-tertiary">来源</th>
                <th className="px-4 py-2 font-medium text-tertiary">创建时间</th>
              </tr>
            </thead>
            <tbody>
              {tasks?.map((task: Task) => (
                <tr
                  key={task.id}
                  className="group border-b border-[var(--color-border-light)] transition hover:bg-brand/3"
                >
                  <td className="px-4 py-2.5">
                    <Link to={`/tasks/${task.id}`} className="font-medium text-primary transition group-hover:text-brand">
                      {task.title}
                    </Link>
                    <div className="mt-0.5 font-mono text-[10px] text-tertiary">{task.id.slice(0, 8)}</div>
                  </td>
                  <td className="px-4 py-2.5"><StatusBadge status={task.status} /></td>
                  <td className="px-4 py-2.5">
                    <span className="rounded bg-secondary/5 px-1.5 py-0.5 text-xs text-secondary">
                      {taskTypeLabels[task.task_type] || task.task_type}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="font-mono text-xs text-tertiary">{task.source_type}</span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-tertiary">
                    {new Date(task.created_at).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && <CreateTaskModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
