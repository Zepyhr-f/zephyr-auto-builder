const API_BASE = '/api/v1'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!response.ok) {
    throw new Error(`API ${response.status}: ${await response.text()}`)
  }
  return response.json()
}

export interface Task {
  id: string
  title: string
  source_type: string
  task_type: string
  status: string
  priority: number
  current_plan_id: string | null
  approved_plan_id: string | null
  created_at: string
  updated_at: string
}

export interface SystemStatus {
  status: string
  version: string
}

export interface EventLog {
  id: string
  task_id: string
  event_type: string
  event_payload: string
  created_at: string
}

export interface PlanStep {
  title: string
  detail: string
}

export interface PendingPlan {
  id: string
  task_id: string
  task_title: string
  task_type: string
  version: number
  plan_text: string
  plan_structured: { steps?: PlanStep[] }
  risk_summary: string
  expected_outputs: string
  status: string
  created_by: string
  created_at: string
}

export const api = {
  listTasks: () => request<Task[]>('/tasks'),
  getTask: (id: string) => request<Task>(`/tasks/${id}`),
  getTaskEvents: (id: string) => request<{ task_id: string; events: EventLog[] }>(`/tasks/${id}/events`),
  createTask: (data: { title: string; source_type?: string; task_type?: string }) =>
    request<Task>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  listPendingPlans: () => request<PendingPlan[]>('/plans/pending'),
  submitApproval: (data: { plan_id: string; decision: string; review_comment?: string }) =>
    request<{ status: string; decision: string }>('/approvals', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getSystemStatus: () => request<SystemStatus>('/system/status'),
}
