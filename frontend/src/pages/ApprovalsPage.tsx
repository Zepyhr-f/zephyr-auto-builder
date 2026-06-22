import { useState } from 'react'
import { api } from '../api/client'

const decisionConfig = {
  approve: {
    label: '批准',
    desc: '通过计划，进入执行队列',
    color: 'text-emerald-glow',
    bg: 'bg-emerald-glow/10',
    ring: 'ring-emerald-glow/30',
    btn: 'bg-emerald-glow/90 hover:bg-emerald-glow text-base-950',
    icon: 'M5 13l4 4L19 7',
  },
  reject: {
    label: '拒绝',
    desc: '终止该计划',
    color: 'text-rose-glow',
    bg: 'bg-rose-glow/10',
    ring: 'ring-rose-glow/30',
    btn: 'bg-rose-glow/90 hover:bg-rose-glow text-base-950',
    icon: 'M6 18L18 6M6 6l12 12',
  },
  revise: {
    label: '修改',
    desc: '退回重新规划',
    color: 'text-amber-glow',
    bg: 'bg-amber-glow/10',
    ring: 'ring-amber-glow/30',
    btn: 'bg-amber-glow/90 hover:bg-amber-glow text-base-950',
    icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  },
}

export function ApprovalsPage() {
  const [planId, setPlanId] = useState('')
  const [decision, setDecision] = useState<'approve' | 'reject' | 'revise'>('approve')
  const [comment, setComment] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (!planId) {
      setError('请输入 Plan ID')
      return
    }
    try {
      const res = await api.submitApproval({ plan_id: planId, decision, review_comment: comment })
      setResult(`已提交：${res.status}（${res.decision}）`)
      setError(null)
      setComment('')
    } catch (e) {
      setError(String(e))
      setResult(null)
    }
  }

  const cfg = decisionConfig[decision]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-base-100">计划审核</h2>
        <p className="mt-1 text-sm text-base-400">审核 Hermes 生成的执行计划</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="glass-panel rounded-2xl p-6">
          <div className="mb-6">
            <label className="mb-2 block text-xs font-medium text-base-400">Plan ID</label>
            <div className="relative">
              <input
                type="text"
                value={planId}
                onChange={e => setPlanId(e.target.value)}
                className="w-full rounded-lg bg-base-850 px-3 py-2.5 font-mono text-sm text-base-100 ring-1 ring-base-700 focus:ring-2 focus:ring-amber-glow/50 focus:outline-none"
                placeholder="输入计划 UUID..."
              />
              {planId && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-base-600">
                  {planId.length} chars
                </span>
              )}
            </div>
          </div>

          <div className="mb-6">
            <label className="mb-3 block text-xs font-medium text-base-400">审核决策</label>
            <div className="grid grid-cols-3 gap-3">
              {(Object.keys(decisionConfig) as Array<keyof typeof decisionConfig>).map(key => {
                const d = decisionConfig[key]
                const isActive = decision === key
                return (
                  <button
                    key={key}
                    onClick={() => setDecision(key)}
                    className={`rounded-xl p-4 text-left ring-1 transition ${
                      isActive
                        ? `${d.bg} ${d.color} ${d.ring}`
                        : 'bg-base-850/50 text-base-400 ring-base-700 hover:bg-base-850'
                    }`}
                  >
                    <svg className="mb-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={d.icon} />
                    </svg>
                    <div className="text-sm font-medium">{d.label}</div>
                    <div className="mt-0.5 text-xs text-base-500">{d.desc}</div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-xs font-medium text-base-400">审核意见</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              className="w-full rounded-lg bg-base-850 px-3 py-2.5 text-sm text-base-100 ring-1 ring-base-700 focus:ring-2 focus:ring-amber-glow/50 focus:outline-none"
              rows={4}
              placeholder={decision === 'revise' ? '输入修改建议...' : '可选，输入审核意见...'}
            />
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={submit}
              disabled={!planId.trim()}
              className={`rounded-lg px-6 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${cfg.btn}`}
            >
              提交审核
            </button>
            {result && (
              <span className="flex items-center gap-2 text-sm text-emerald-glow">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {result}
              </span>
            )}
            {error && (
              <span className="flex items-center gap-2 text-sm text-rose-glow">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {error}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className={`glass-panel rounded-2xl p-5 ${cfg.bg} ${cfg.ring} ring-1`}>
            <div className="mb-3 flex items-center gap-2">
              <svg className={`h-5 w-5 ${cfg.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={cfg.icon} />
              </svg>
              <span className={`text-sm font-medium ${cfg.color}`}>{cfg.label}</span>
            </div>
            <p className="text-xs leading-relaxed text-base-400">{cfg.desc}</p>
          </div>

          <div className="glass-panel rounded-2xl p-5">
            <h3 className="mb-3 text-xs font-medium text-base-400">审核流程</h3>
            <div className="space-y-3">
              {[
                { step: '1', label: 'Hermes 生成计划', done: true },
                { step: '2', label: '人工审核计划', done: true },
                { step: '3', label: '提交审核决策', done: false },
                { step: '4', label: '进入执行队列', done: false },
              ].map(s => (
                <div key={s.step} className="flex items-center gap-3">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                    s.done ? 'bg-emerald-glow/15 text-emerald-glow' : 'bg-base-800 text-base-500'
                  }`}>
                    {s.done ? (
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : s.step}
                  </div>
                  <span className={`text-sm ${s.done ? 'text-base-200' : 'text-base-500'}`}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
