import { Link, Outlet } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-white px-6 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link to="/" className="text-xl font-bold">
            Rime Craft
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/docs">
              <Button variant="ghost">教程中心</Button>
            </Link>
            <Link to="/editor">
              <Button variant="ghost">配置编辑器</Button>
            </Link>
            <Link to="/theme">
              <Button variant="ghost">主题工作室</Button>
            </Link>
            <Link to="/compare">
              <Button variant="ghost">方案对比</Button>
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
