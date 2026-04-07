import { Link, Outlet, useParams } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { TUTORIAL_NAV } from '@/data/tutorial-nav'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DocsToc } from './DocsToc'
import { DocsMobileSidebar } from './DocsMobileSidebar'

export function DocsLayout() {
  const { slug } = useParams()

  return (
    <div className="flex h-[calc(100vh-57px)]">
      {/* Mobile sidebar trigger */}
      <div className="fixed left-0 right-0 top-[57px] z-30 flex items-center border-b bg-background px-4 py-2 lg:hidden">
        <DocsMobileSidebar />
        <span className="ml-2 text-sm font-medium text-gray-700 dark:text-slate-300">Tutorial</span>
      </div>

      {/* Desktop/Tablet sidebar */}
      <ScrollArea className="hidden w-[220px] flex-shrink-0 border-r border-gray-200 bg-gray-50 dark:border-slate-800 dark:bg-slate-900 lg:block">
        <nav className="p-4">
          {TUTORIAL_NAV.map((section) => (
            <div key={section.title} className="mb-6">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                {section.title}
              </h3>
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <li key={item.slug}>
                    <Link
                      to={`/docs/${item.slug}`}
                      className={cn(
                        'block rounded-md px-3 py-1.5 text-sm transition-colors',
                        slug === item.slug
                          ? 'border-l-2 border-blue-500 bg-white font-medium text-gray-900 shadow-sm dark:bg-slate-800 dark:text-slate-100'
                          : 'text-gray-600 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800',
                      )}
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto pt-12 lg:pt-0">
          <div className="mx-auto max-w-3xl px-6 py-8 lg:px-8 lg:py-10">
            <Outlet />
          </div>
        </main>

        {/* Right-side TOC — desktop only */}
        <aside className="hidden w-[180px] flex-shrink-0 overflow-y-auto border-l border-gray-100 px-4 py-8 dark:border-slate-800 xl:block">
          <DocsToc slug={slug} />
        </aside>
      </div>
    </div>
  )
}
