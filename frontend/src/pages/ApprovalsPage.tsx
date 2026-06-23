import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type PendingPlan, type PlanStep } from '../api/client'

const taskTypeLabels: Record<string, string> = {
  requirement: '需求',
  document: '文档',
  bug: 'Bug',
  optimization: '优化',
}

function safeStr(val: unknown): string {
  return typeof val === 'string' ? val : ''
}

function safeSteps(plan: PendingPlan): PlanStep[] {
  const steps = plan.plan_structured?.steps
  if (!Array.isArray(steps)) return []
  return steps
    .filter((s): s is PlanStep => typeof s?.title === 'string' && s.title.trim() !== '')
    .map(s => ({ title: s.title, detail: safeStr(s.detail) }))
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
    { key: 'approve' as const, label: '批准', color: 'text-[var(--color-status-approved)]', bg: 'bg-[var(--color-status-approved)]/8', btn: 'bg-[var(--color-status-approved)] hover:brightness-110 text-white', icon: 'M5 13l4 4L19 7' },
    { key: 'reject' as const, label: '拒绝', color: 'text-[var(--color-status-fail)]', bg: 'bg-[var(--color-status-fail)]/8', btn: 'bg-[var(--color-status-fail)] hover:brightness-110 text-white', icon: 'M6 18L18 6M6 6l12 12' },
    { key: 'revise' as const, label: '修改', color: 'text-brand', bg: 'bg-brand/8', btn: 'bg-brand hover:brightness-110 text-white', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-playfair text-2xl font-bold text-primary">计划审核</h2>
          <p className="mt-0.5 font-serif-sc text-xs tracking-wider text-tertiary">
            审核 Hermes 生成的执行计划
            {plans && plans.length > 0 && (
              <span className="ml-2 rounded-full bg-brand/8 px-2 py-0.5 text-xs text-brand">
                {plans.length} 待审
              </span>
            )}
          </p>
        </div>
        {result && (
          <span className="flex items-center gap-1.5 text-xs text-[var(--color-status-done)]">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {result}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map(i => (
            <div key={i} className="paper-card h-20 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : plans && plans.length === 0 ? (
        <div className="paper-card rounded-xl px-4 py-12 text-center">
          <p className="text-sm text-tertiary">暂无待审核计划</p>
          <p className="mt-0.5 text-xs text-tertiary">Hermes 生成计划后会出现在这里</p>
        </div>
      ) : (
        <div className="space-y-2">
          {plans?.map((plan: PendingPlan) => {
            const isExpanded = expandedId === plan.id
            return (
              <div key={plan.id} className="paper-card overflow-hidden rounded-xl">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : plan.id)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-brand/3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/8">
                      <svg className="h-4 w-4 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-serif-sc text-sm font-medium text-primary">{plan.task_title}</span>
                        <span className="rounded bg-secondary/5 px-1.5 py-0.5 text-[10px] text-tertiary">
                          {taskTypeLabels[plan.task_type] || plan.task_type}
                        </span>
                      </div>
                      <div className="mt-0.5 font-mono text-[10px] text-tertiary">
                        v{plan.version} · {plan.id.slice(0, 8)} · {new Date(plan.created_at).toLocaleString('zh-CN')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-brand/8 px-2 py-0.5 text-[10px] text-brand">
                      待审核
                    </span>
                    <svg className={`h-3.5 w-3.5 text-tertiary transition ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-[var(--color-border)] px-4 py-4">
                    <div className="grid gap-3 lg:grid-cols-3">
                      <div className="space-y-3 lg:col-span-2">
                        <div>
                          <div className="mb-1 font-serif-sc text-xs font-medium text-brand">执行计划</div>
                          <div className="rounded-lg border border-[var(--color-border-light)] bg-[var(--color-bg-base)] p-3">
                            {(() => {
                              const planText = safeStr(plan.plan_text)
                              const steps = safeSteps(plan)
                              if (!planText && steps.length === 0) {
                                return <p className="text-xs text-tertiary">计划内容为空</p>
                              }
                              return (
                                <>
                                  {planText && (
                                    <p className="mb-2 text-xs leading-relaxed text-secondary">{planText}</p>
                                  )}
                                  {steps.length > 0 ? (
                                    <ol className="space-y-1.5">
                                      {steps.map((step, idx) => (
                                        <li key={idx} className="flex gap-2">
                                          <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-brand/10 text-[10px] font-medium text-brand">
                                            {idx + 1}
                                          </span>
                                          <div className="flex-1">
                                            <div className="text-xs font-medium text-primary">{step.title}</div>
                                            {step.detail && (
                                              <p className="mt-0.5 text-[11px] leading-relaxed text-tertiary">{step.detail}</p>
                                            )}
                                          </div>
                                        </li>
                                      ))}
                                    </ol>
                                  ) : planText ? (
                                    <pre className="whitespace-pre-wrap text-xs leading-relaxed text-secondary">
                                      {planText}
                                    </pre>
                                  ) : null}
                                </>
                              )
                            })()}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {safeStr(plan.risk_summary) && (
                            <div>
                              <div className="mb-1 font-serif-sc text-xs text-[var(--color-status-fail)]">风险提示</div>
                              <p className="rounded-lg border border-[var(--color-status-fail)]/20 bg-[var(--color-status-fail)]/5 p-2 text-xs text-secondary">
                                {safeStr(plan.risk_summary)}
                              </p>
                            </div>
                          )}
                          {safeStr(plan.expected_outputs) && (
                            <div>
                              <div className="mb-1 font-serif-sc text-xs text-[var(--color-status-done)]">预期产出</div>
                              <p className="rounded-lg border border-[var(--color-status-done)]/20 bg-[var(--color-status-done)]/5 p-2 text-xs text-secondary">
                                {safeStr(plan.expected_outputs)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="mb-1.5 text-xs text-tertiary">审核决策</div>
                          <div className="grid grid-cols-3 gap-1.5">
                            {decisionButtons.map(d => {
                              const isActive = decision === d.key
                              return (
                                <button
                                  key={d.key}
                                  onClick={() => setDecision(d.key)}
                                  className={`rounded-lg p-2 text-xs transition ${
                                    isActive
                                      ? `${d.bg} ${d.color}`
                                      : 'bg-secondary/5 text-tertiary hover:bg-secondary/10'
                                  }`}
                                >
                                  <svg className="mx-auto mb-0.5 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d={d.icon} />
                                  </svg>
                                  {d.label}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        <div>
                          <div className="mb-1.5 text-xs text-tertiary">审核意见</div>
                          <textarea
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-base)] px-2.5 py-1.5 text-xs text-primary focus:border-brand focus:outline-none"
                            rows={3}
                            placeholder={decision === 'revise' ? '输入修改建议...' : '可选...'}
                          />
                        </div>

                        <button
                          onClick={() => handleSubmit(plan.id)}
                          disabled={mutation.isPending}
                          className={`w-full rounded-lg px-3 py-2 text-xs font-medium text-white transition disabled:opacity-40 ${
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
