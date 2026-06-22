import { NavLink, Outlet, useLocation } from 'react-router-dom'

const navItems = [
  { to: '/', label: '任务', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { to: '/approvals', label: '审核', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  { to: '/system', label: '系统', icon: 'M9 17v-2m3 2V9m3 8v-4M9 7h6M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z' },
]

const pageTitles: Record<string, string> = {
  '/': '任务队列',
  '/approvals': '计划审核',
  '/system': '系统状态',
}

export function Layout() {
  const location = useLocation()
  const currentTitle = pageTitles[location.pathname] || 'Hermes Orchestrator'

  return (
    <div className="min-h-screen bg-base-950 bg-grid">
      <div className="pointer-events-none fixed inset-0 bg-radial-glow" />

      <aside className="fixed left-0 top-0 z-20 flex h-full w-16 flex-col items-center border-r border-base-800 bg-base-900/80 backdrop-blur-xl">
        <div className="mt-6 mb-8 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-glow/10 ring-1 ring-amber-glow/30">
          <div className="h-3 w-3 rounded-full bg-amber-glow animate-pulse-dot" style={{ color: '#f59e0b' }} />
        </div>

        <nav className="flex flex-1 flex-col gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `group relative flex h-12 w-12 items-center justify-center rounded-xl transition-all ${
                  isActive
                    ? 'bg-amber-glow/10 text-amber-glow ring-1 ring-amber-glow/30'
                    : 'text-base-400 hover:bg-base-800 hover:text-base-100'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                  {isActive && (
                    <span className="absolute -left-4 top-1/2 h-6 -translate-y-1/2 rounded-full border-l-2 border-amber-glow" />
                  )}
                  <span className="pointer-events-none absolute left-14 z-50 whitespace-nowrap rounded-lg bg-base-800 px-2.5 py-1 text-xs text-base-100 opacity-0 ring-1 ring-base-700 transition-opacity group-hover:opacity-100">
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mb-6 flex flex-col items-center gap-1">
          <div className="h-1 w-1 rounded-full bg-base-600" />
          <div className="h-1 w-1 rounded-full bg-base-700" />
        </div>
      </aside>

      <div className="ml-16">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-base-800/50 bg-base-950/70 px-8 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <h1 className="font-mono text-sm font-medium tracking-wide text-base-300">
              hermes
            </h1>
            <span className="text-base-600">/</span>
            <span className="text-sm font-medium text-base-100">{currentTitle}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-full bg-base-850 px-3 py-1 ring-1 ring-base-700">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-glow animate-pulse-dot" style={{ color: '#10b981' }} />
              <span className="font-mono text-xs text-base-300">24/7</span>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl p-8">
          <div className="animate-fade-in-up">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
