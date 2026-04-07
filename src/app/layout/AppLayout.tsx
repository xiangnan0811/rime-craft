import { Link, Outlet, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { DarkModeToggle } from '@/components/shared/DarkModeToggle'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/docs', label: '教程中心' },
  { to: '/editor', label: '配置编辑器' },
  { to: '/theme', label: '主题工作室' },
  { to: '/compare', label: '方案对比' },
]

export function AppLayout() {
  const { pathname } = useLocation()

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b bg-background px-6 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link to="/" className="text-xl font-bold">
            Rime Craft
          </Link>
          <nav className="flex items-center gap-2">
            {NAV_ITEMS.map(({ to, label }) => (
              <Link key={to} to={to}>
                <Button
                  variant="ghost"
                  className={cn(
                    pathname.startsWith(to) &&
                      'bg-accent text-accent-foreground',
                  )}
                >
                  {label}
                </Button>
              </Link>
            ))}
            <DarkModeToggle />
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
