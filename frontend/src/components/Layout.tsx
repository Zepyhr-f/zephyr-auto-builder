import { NavLink, Outlet, useLocation } from 'react-router-dom'

const navItems = [
  { to: '/', label: '任务', end: true },
  { to: '/approvals', label: '审核' },
  { to: '/system', label: '系统' },
]

const pageTitleMap: Record<string, string> = {
  '/': '任务队列',
  '/approvals': '计划审核',
  '/system': '系统状态',
}

export function Layout() {
  const location = useLocation()
  const currentTitle = pageTitleMap[location.pathname] || 'Hermes Orchestrator'

  return (
    <div className="min-h-screen bg-paper">
      {/* 顶部悬浮导航 */}
      <header className="fixed top-0 left-0 right-0 z-20 border-b border-[var(--color-border)] bg-[rgba(253,251,247,0.7)] backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="font-cormorant text-lg font-medium tracking-wider text-brand">Hermes</span>
            <span className="text-tertiary">·</span>
            <span className="font-serif-sc text-xs tracking-widest text-secondary">Orchestrator</span>
          </div>

          {/* 导航 */}
          <nav className="flex items-center gap-1">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `group relative px-3 py-1.5 font-serif-sc text-sm tracking-widest transition-colors ${
                    isActive ? 'text-brand' : 'text-secondary hover:text-primary'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {item.label}
                    <span
                      className={`absolute bottom-0 left-3 right-3 h-px bg-brand transition-all duration-300 ${
                        isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                      }`}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* 状态 */}
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-status-approved)] animate-pulse-dot" />
            <span className="font-mono text-[10px] text-tertiary">24/7</span>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <div className="mx-auto max-w-6xl px-6 pt-20 pb-16">
        {/* 面包屑 */}
        <div className="mb-6 flex items-center gap-2 text-xs">
          <span className="font-mono text-tertiary">hermes</span>
          <span className="text-tertiary">/</span>
          <span className="font-serif-sc tracking-wider text-secondary">{currentTitle}</span>
        </div>

        <div className="animate-fade-in-up">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
