import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'

export function SystemPage() {
  const { data: status, isLoading } = useQuery({
    queryKey: ['system-status'],
    queryFn: api.getSystemStatus,
    refetchInterval: 5000,
  })

  if (isLoading) return <div className="text-gray-500">Loading...</div>

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold">System Status</h2>
      <div className="rounded-lg border bg-white p-6">
        <dl className="space-y-2">
          <div className="flex justify-between">
            <dt className="font-medium">Status</dt>
            <dd className="text-green-600">{status?.status ?? 'unknown'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-medium">Version</dt>
            <dd className="text-gray-600">{status?.version ?? 'unknown'}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
