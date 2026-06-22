import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Tasks' },
  { to: '/approvals', label: 'Approvals' },
  { to: '/system', label: 'System' },
]

export function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b bg-white px-6 py-3">
        <div className="flex items-center gap-6">
          <h1 className="text-lg font-bold">Hermes Orchestrator</h1>
          <nav className="flex gap-4">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `text-sm ${isActive ? 'font-semibold text-blue-600' : 'text-gray-600 hover:text-gray-900'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-6">
        <Outlet />
      </main>
    </div>
  )
}
