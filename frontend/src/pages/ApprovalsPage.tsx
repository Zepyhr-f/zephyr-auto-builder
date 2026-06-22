import { useState } from 'react'
import { api } from '../api/client'

export function ApprovalsPage() {
  const [planId, setPlanId] = useState('')
  const [decision, setDecision] = useState('approve')
  const [comment, setComment] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (!planId) {
      setError('Plan ID is required')
      return
    }
    try {
      const res = await api.submitApproval({ plan_id: planId, decision, review_comment: comment })
      setResult(`Submitted: ${res.status} (${res.decision})`)
      setError(null)
    } catch (e) {
      setError(String(e))
      setResult(null)
    }
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold">Plan Approval</h2>
      <div className="max-w-md space-y-4 rounded-lg border bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Plan ID</label>
          <input
            type="text"
            value={planId}
            onChange={(e) => setPlanId(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
            placeholder="Enter plan UUID"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Decision</label>
          <select
            value={decision}
            onChange={(e) => setDecision(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
          >
            <option value="approve">Approve</option>
            <option value="reject">Reject</option>
            <option value="revise">Revise</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Comment (optional)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
            rows={3}
          />
        </div>
        <button
          onClick={submit}
          className="w-full rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Submit
        </button>
        {result && <p className="text-sm text-green-600">{result}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  )
}
