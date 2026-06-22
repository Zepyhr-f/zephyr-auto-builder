import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { TasksPage } from './pages/TasksPage'
import { TaskDetailPage } from './pages/TaskDetailPage'
import { ApprovalsPage } from './pages/ApprovalsPage'
import { SystemPage } from './pages/SystemPage'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<TasksPage />} />
            <Route path="/tasks/:id" element={<TaskDetailPage />} />
            <Route path="/approvals" element={<ApprovalsPage />} />
            <Route path="/system" element={<SystemPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
