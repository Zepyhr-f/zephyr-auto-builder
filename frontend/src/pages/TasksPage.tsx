import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
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

export function TasksPage() {
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: api.listTasks,
  })

  if (isLoading) return <div className="text-gray-500">Loading tasks...</div>

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold">Tasks</h2>
      {tasks && tasks.length === 0 ? (
        <p className="text-gray-500">No tasks yet.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-2 font-semibold">Title</th>
                <th className="px-4 py-2 font-semibold">Status</th>
                <th className="px-4 py-2 font-semibold">Type</th>
                <th className="px-4 py-2 font-semibold">Source</th>
                <th className="px-4 py-2 font-semibold">Created</th>
              </tr>
            </thead>
            <tbody>
              {tasks?.map((task) => (
                <tr key={task.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <Link to={`/tasks/${task.id}`} className="text-blue-600 hover:underline">
                      {task.title}
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusColors[task.status] || 'bg-gray-100'}`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-600">{task.task_type}</td>
                  <td className="px-4 py-2 text-gray-600">{task.source_type}</td>
                  <td className="px-4 py-2 text-gray-500">
                    {new Date(task.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
