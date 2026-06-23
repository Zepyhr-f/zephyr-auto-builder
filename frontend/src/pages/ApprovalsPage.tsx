import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type PendingPlan, type PlanStep } from '../api/client'

const taskTypeLabels: Record<string, string> = {
  requirement: '需求',
  document: '文档',
  bug: 'Bug 巡检',
  optimization: '优化',
}

export function ApprovalsPage() {
  const queryClient = useQueryClient()
  const { data: plans, isLoading } = useQuery({
    queryKey: ['pending-plans'],
    queryFn: api.listPendingPlans,
    refetchInterval: 5000,
  })

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [decision, setDecision] = useState<'approve' | 'reject' | 'revise'>('approve')
  const [comment, setComment] = useState('')
  const [result, setResult] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (data: { plan_id: string; decision: string; review_comment?: string }) =>
      api.submitApproval(data),
    onSuccess: (res, vars) => {
      queryClient.invalidateQueries({ queryKey: ['pending-plans'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setResult(`计划已${vars.decision === 'approve' ? '批准' : vars.decision === 'reject' ? '拒绝' : '退回修改'}`)
      setExpandedId(null)
      setComment('')
      setTimeout(() => setResult(null), 3000)
    },
  })

  const handleSubmit = (planId: string) => {
    mutation.mutate({ plan_id: planId, decision, review_comment: comment })
  }

  const decisionButtons = [
    {
      key: 'approve' as const,
      label: '批准',
      color: 'text-emerald-glow',
      bg: 'bg-emerald-glow/10',
      ring: 'ring-emerald-glow/30',
      btn: 'bg-emerald-glow/90 hover:bg-emerald-glow text-base-950',
      icon: 'M5 13l4 4L19 7',
    },
    {
      key: 'reject' as const,
      label: '拒绝',
      color: 'text-rose-glow',
      bg: 'bg-rose-glow/10',
      ring: 'ring-rose-glow/30',
      btn: 'bg-rose-glow/90 hover:bg-rose-glow text-base-950',
      icon: 'M6 18L18 6M6 6l12 12',
    },
    {
      key: 'revise' as const,
      label: '修改',
      color: 'text-amber-glow',
      bg: 'bg-amber-glow/10',
      ring: 'ring-amber-glow/30',
      btn: 'bg-amber-glow/90 hover:bg-amber-glow text-base-950',
      icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-base-100">计划审核</h2>
          <p className="mt-1 text-sm text-base-400">
            审核 Hermes 生成的执行计划
            {plans && plans.length > 0 && (
              <span className="ml-2 rounded-full bg-amber-glow/10 px-2 py-0.5 text-xs text-amber-glow ring-1 ring-amber-glow/30">
                {plans.length} 待审
              </span>
            )}
          </p>
        </div>
        {result && (
          <span className="flex items-center gap-2 text-sm text-emerald-glow">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {result}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="glass-panel h-24 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : plans && plans.length === 0 ? (
        <div className="glass-panel rounded-xl p-16 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-base-800">
            <svg className="h-6 w-6 text-base-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-base-400">暂无待审核计划</p>
          <p className="mt-1 text-xs text-base-600">Hermes 生成计划后会出现在这里</p>
        </div>
      ) : (
        <div className="space-y-3">
          {plans?.map((plan: PendingPlan, i: number) => {
            const isExpanded = expandedId === plan.id
            return (
              <div
                key={plan.id}
                className="glass-panel overflow-hidden rounded-xl"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : plan.id)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-base-850/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-glow/10 ring-1 ring-amber-glow/30">
                      <svg className="h-5 w-5 text-amber-glow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-base-100">{plan.task_title}</span>
                        <span className="rounded bg-base-700/50 px-1.5 py-0.5 text-xs text-base-400">
                          {taskTypeLabels[plan.task_type] || plan.task_type}
                        </span>
                      </div>
                      <div className="mt-0.5 font-mono text-xs text-base-500">
                        plan v{plan.version} · {plan.id.slice(0, 8)} · {new Date(plan.created_at).toLocaleString('zh-CN')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-amber-glow/10 px-2.5 py-1 text-xs text-amber-glow ring-1 ring-amber-glow/30">
                      待审核
                    </span>
                    <svg className={`h-4 w-4 text-base-500 transition ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-base-800 px-5 py-5">
                    <div className="grid gap-4 lg:grid-cols-3">
                      <div className="lg:col-span-2 space-y-4">
                        <div>
                          <div className="mb-1.5 text-xs font-medium text-amber-glow">执行计划</div>
                          <div className="rounded-lg bg-base-950/50 p-4 ring-1 ring-base-800">
                            {plan.plan_text && (
                              <p className="mb-3 text-sm leading-relaxed text-base-200">{plan.plan_text}</p>
                            )}
                            {plan.plan_structured?.steps && plan.plan_structured.steps.length > 0 ? (
                              <ol className="space-y-2">
                                {plan.plan_structured.steps.map((step: PlanStep, idx: number) => (
                                  <li key={idx} className="flex gap-3">
                                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-amber-glow/15 text-xs font-medium text-amber-glow ring-1 ring-amber-glow/30">
                                      {idx + 1}
                                    </span>
                                    <div className="flex-1">
                                      <div className="text-sm font-medium text-base-100">{step.title}</div>
                                      {step.detail && (
                                        <p className="mt-0.5 text-xs leading-relaxed text-base-400">{step.detail}</p>
                                      )}
                                    </div>
                                  </li>
                                ))}
                              </ol>
                            ) : (
                              <pre className="whitespace-pre-wrap text-sm leading-relaxed text-base-200">
                                {plan.plan_text}
                              </pre>
                            )}
                          </div>
                        </div>
                        {plan.risk_summary && (
                          <div>
                            <div className="mb-1.5 text-xs font-medium text-rose-glow">风险提示</div>
                            <p className="rounded-lg bg-rose-glow/5 p-3 text-sm text-base-300 ring-1 ring-rose-glow/20">
                              {plan.risk_summary}
                            </p>
                          </div>
                        )}
                        {plan.expected_outputs && (
                          <div>
                            <div className="mb-1.5 text-xs font-medium text-emerald-glow">预期产出</div>
                            <p className="rounded-lg bg-emerald-glow/5 p-3 text-sm text-base-300 ring-1 ring-emerald-glow/20">
                              {plan.expected_outputs}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div>
                          <div className="mb-2 text-xs font-medium text-base-400">审核决策</div>
                          <div className="grid grid-cols-3 gap-2">
                            {decisionButtons.map(d => {
                              const isActive = decision === d.key
                              return (
                                <button
                                  key={d.key}
                                  onClick={() => setDecision(d.key)}
                                  className={`rounded-lg p-2.5 ring-1 transition ${
                                    isActive
                                      ? `${d.bg} ${d.color} ${d.ring}`
                                      : 'bg-base-850/50 text-base-400 ring-base-700 hover:bg-base-850'
                                  }`}
                                >
                                  <svg className="mx-auto mb-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d={d.icon} />
                                  </svg>
                                  <div className="text-xs">{d.label}</div>
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        <div>
                          <div className="mb-2 text-xs font-medium text-base-400">审核意见</div>
                          <textarea
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            className="w-full rounded-lg bg-base-850 px-3 py-2 text-sm text-base-100 ring-1 ring-base-700 focus:ring-2 focus:ring-amber-glow/50 focus:outline-none"
                            rows={3}
                            placeholder={decision === 'revise' ? '输入修改建议...' : '可选...'}
                          />
                        </div>

                        <button
                          onClick={() => handleSubmit(plan.id)}
                          disabled={mutation.isPending}
                          className={`w-full rounded-lg px-4 py-2.5 text-sm font-medium transition disabled:opacity-40 ${
                            decisionButtons.find(d => d.key === decision)!.btn
                          }`}
                        >
                          {mutation.isPending ? '提交中...' : `确认${decisionButtons.find(d => d.key === decision)!.label}`}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
