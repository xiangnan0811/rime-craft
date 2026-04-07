import { Link, Outlet, useParams } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { TUTORIAL_NAV } from '@/data/tutorial-nav'
import { ScrollArea } from '@/components/ui/scroll-area'

export function DocsLayout() {
  const { slug } = useParams()

  return (
    <div className="flex h-[calc(100vh-57px)]">
      <ScrollArea className="w-64 border-r bg-gray-50">
        <nav className="p-4">
          {TUTORIAL_NAV.map((section) => (
            <div key={section.title} className="mb-6">
              <h3 className="mb-2 text-sm font-semibold text-gray-500">
                {section.title}
              </h3>
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item.slug}>
                    <Link
                      to={`/docs/${item.slug}`}
                      className={cn(
                        'block rounded-md px-3 py-1.5 text-sm transition-colors',
                        slug === item.slug
                          ? 'bg-white font-medium text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:bg-gray-100',
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
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-8 py-10">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
