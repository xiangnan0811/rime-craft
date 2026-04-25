import { Link, Outlet, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { DarkModeToggle } from '@/components/shared/DarkModeToggle'
import { DocsSearch, SearchTrigger } from '@/app/docs/DocsSearch'
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
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/80 px-4 py-3 backdrop-blur md:px-6">
        <div className="mx-auto flex max-w-7xl items-center gap-4">
          <Link to="/" aria-label="Rime Craft" className="flex min-w-0 flex-col">
            <span className="text-base font-semibold tracking-tight text-foreground">
              Rime Craft
            </span>
            <span className="hidden text-xs text-muted-foreground md:block">
              Rime 配置工作台
            </span>
          </Link>
          <nav aria-label="主导航" className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
            {NAV_ITEMS.map(({ to, label }) => (
              <Link key={to} to={to}>
                <Button
                  variant="ghost"
                  className={cn(
                    'rounded-full border border-transparent px-4 text-sm transition-colors duration-200 transition-[border-color,background-color,box-shadow,color]',
                    pathname.startsWith(to)
                      ? 'border-border/80 bg-accent text-accent-foreground shadow-sm'
                      : 'text-muted-foreground hover:border-border/70 hover:bg-accent/70 hover:text-foreground hover:shadow-sm',
                  )}
                >
                  {label}
                </Button>
              </Link>
            ))}
          </nav>
          <div role="group" aria-label="快捷操作" className="flex items-center gap-2 md:hidden">
            <SearchTrigger compact />
            <DarkModeToggle />
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <SearchTrigger />
            <DarkModeToggle />
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <DocsSearch />
    </div>
  )
}
