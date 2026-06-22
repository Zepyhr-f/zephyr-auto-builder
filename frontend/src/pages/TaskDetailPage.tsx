import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api/client'

const statusColors: Record<string, string> = {
  New: 'bg-blue-100 text-blue-800',
  Planning: 'bg-yellow-100 text-yellow-800',
  PendingApproval: 'bg-orange-100 text-orange-800',
  Approved: 'bg-green-100 text-green-800',
  Queued: 'bg-gray-100 text-gray-800',
  Executing: 'bg-purple-100 text-purple-800',
  Succeeded: 'bg-green-200 text-green-900',
  Failed: 'bg-red-100 text-red-800',
  Rejected: 'bg-red-100 text-red-800',
  Escalated: 'bg-red-200 text-red-900',
}

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: task, isLoading } = useQuery({
    queryKey: ['task', id],
    queryFn: () => api.getTask(id!),
    enabled: !!id,
  })
  const { data: eventsData } = useQuery({
    queryKey: ['task-events', id],
    queryFn: () => api.getTaskEvents(id!),
    enabled: !!id,
  })

  if (isLoading) return <div className="text-gray-500">Loading task...</div>
  if (!task) return <div className="text-gray-500">Task not found.</div>

  return (
    <div className="space-y-6">
      <div>
        <Link to="/" className="text-sm text-blue-600 hover:underline">&larr; Back to tasks</Link>
        <h2 className="mt-2 text-xl font-bold">{task.title}</h2>
        <span className={`mt-1 inline-block rounded px-2 py-0.5 text-xs font-medium ${statusColors[task.status] || 'bg-gray-100'}`}>
          {task.status}
        </span>
      </div>

      <div className="rounded-lg border bg-white p-6">
        <h3 className="mb-3 text-sm font-bold">Task Info</h3>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="font-medium text-gray-600">ID</dt>
          <dd className="font-mono text-xs">{task.id}</dd>
          <dt className="font-medium text-gray-600">Type</dt>
          <dd>{task.task_type}</dd>
          <dt className="font-medium text-gray-600">Source</dt>
          <dd>{task.source_type}</dd>
          <dt className="font-medium text-gray-600">Priority</dt>
          <dd>{task.priority}</dd>
          <dt className="font-medium text-gray-600">Current Plan</dt>
          <dd className="font-mono text-xs">{task.current_plan_id || '-'}</dd>
          <dt className="font-medium text-gray-600">Approved Plan</dt>
          <dd className="font-mono text-xs">{task.approved_plan_id || '-'}</dd>
          <dt className="font-medium text-gray-600">Created</dt>
          <dd>{new Date(task.created_at).toLocaleString()}</dd>
          <dt className="font-medium text-gray-600">Updated</dt>
          <dd>{new Date(task.updated_at).toLocaleString()}</dd>
        </dl>
      </div>

      <div className="rounded-lg border bg-white p-6">
        <h3 className="mb-3 text-sm font-bold">Event Log</h3>
        {eventsData?.events && eventsData.events.length > 0 ? (
          <div className="space-y-2">
            {eventsData.events.map((event) => (
              <div key={event.id} className="border-l-2 border-gray-200 pl-3 text-sm">
                <span className="font-medium">{event.event_type}</span>
                <span className="ml-2 text-xs text-gray-500">
                  {new Date(event.created_at).toLocaleString()}
                </span>
                {event.event_payload && (
                  <p className="mt-1 text-xs text-gray-600">{event.event_payload}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No events recorded.</p>
        )}
      </div>
    </div>
  )
}
