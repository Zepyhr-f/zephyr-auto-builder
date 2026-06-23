import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useState } from 'react'

interface NavSection {
  label: string
  icon: string
  items: { to: string; label: string; end?: boolean }[]
}

const navSections: NavSection[] = [
  {
    label: '任务',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    items: [
      { to: '/', label: '任务队列', end: true },
      { to: '/approvals', label: '计划审核' },
    ],
  },
  {
    label: '监控',
    icon: 'M9 17v-2m3 2V9m3 8v-4M9 7h6M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z',
    items: [
      { to: '/system', label: '系统状态' },
    ],
  },
]

const pageTitleMap: Record<string, string> = {
  '/': '任务队列',
  '/approvals': '计划审核',
  '/system': '系统状态',
}

function isPathActive(pathname: string, to: string, end?: boolean): boolean {
  if (end) return pathname === to
  return pathname.startsWith(to)
}

export function Layout() {
  const location = useLocation()
  const currentTitle = pageTitleMap[location.pathname] || 'Hermes Orchestrator'
  const [collapsed, setCollapsed] = useState(false)

  const activeSection = navSections.find(section =>
    section.items.some(item => isPathActive(location.pathname, item.to, item.end))
  )

  return (
    <div className="flex h-screen overflow-hidden bg-base-950 bg-grid">
      <div className="pointer-events-none fixed inset-0 bg-radial-glow" />

      {/* 二级目录侧边栏 */}
      <aside className={`relative z-20 flex flex-col border-r border-base-800 bg-base-900/90 backdrop-blur-xl transition-all duration-200 ${collapsed ? 'w-16' : 'w-52'}`}>
        {/* Logo */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-14 items-center gap-2.5 border-b border-base-800 px-4 transition hover:bg-base-850"
        >
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-amber-glow/10 ring-1 ring-amber-glow/30">
            <div className="h-2.5 w-2.5 rounded-full bg-amber-glow animate-pulse-dot" style={{ color: '#f59e0b' }} />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-mono text-xs font-bold tracking-wider text-base-100">HERMES</span>
              <span className="text-[10px] text-base-500">Orchestrator</span>
            </div>
          )}
        </button>

        {/* 导航区 */}
        <nav className="flex-1 overflow-y-auto py-3">
          {navSections.map(section => {
            const isActiveSection = activeSection?.label === section.label
            return (
              <div key={section.label} className="mb-1">
                {!collapsed && (
                  <div className="px-4 py-1.5">
                    <span className={`text-[10px] font-medium uppercase tracking-wider ${isActiveSection ? 'text-amber-glow' : 'text-base-500'}`}>
                      {section.label}
                    </span>
                  </div>
                )}
                {collapsed && (
                  <div className="mx-3 mb-1 border-t border-base-800" />
                )}
                <div className="px-2">
                  {section.items.map(item => {
                    const isActive = isPathActive(location.pathname, item.to, item.end)
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) =>
                          `group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-all ${
                            isActive
                              ? 'bg-amber-glow/10 text-amber-glow ring-1 ring-amber-glow/20'
                              : 'text-base-300 hover:bg-base-850 hover:text-base-100'
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d={section.icon} />
                            </svg>
                            {!collapsed && <span className="truncate">{item.label}</span>}
                            {isActive && !collapsed && (
                              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-amber-glow animate-pulse-dot" style={{ color: '#f59e0b' }} />
                            )}
                            {collapsed && (
                              <span className="pointer-events-none absolute left-12 z-50 whitespace-nowrap rounded-lg bg-base-800 px-2.5 py-1 text-xs text-base-100 opacity-0 ring-1 ring-base-700 transition-opacity group-hover:opacity-100">
                                {item.label}
                              </span>
                            )}
                          </>
                        )}
                      </NavLink>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>

        {/* 底部状态 */}
        <div className="border-t border-base-800 p-3">
          <div className="flex items-center justify-between rounded-lg bg-base-850/50 px-2.5 py-1.5">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-glow animate-pulse-dot" style={{ color: '#10b981' }} />
              {!collapsed && <span className="font-mono text-[10px] text-base-400">运行中</span>}
            </div>
            {!collapsed && <span className="font-mono text-[10px] text-base-500">24/7</span>}
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* 顶栏 */}
        <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-base-800/50 bg-base-950/70 px-6 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-base-500">hermes</span>
            <span className="text-base-700">/</span>
            <span className="text-sm font-medium text-base-100">{currentTitle}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-base-500">
            <span className="font-mono">{new Date().toLocaleDateString('zh-CN')}</span>
          </div>
        </header>

        {/* 滚动内容 */}
        <main className="flex-1 overflow-y-auto px-6 py-4">
          <div className="mx-auto max-w-7xl animate-fade-in-up">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
