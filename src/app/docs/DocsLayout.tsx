import { Link, Outlet, useParams } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { TUTORIAL_NAV } from '@/data/tutorial-nav'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DocsToc } from './DocsToc'
import { DocsMobileSidebar } from './DocsMobileSidebar'

export function DocsLayout() {
  const { slug } = useParams()

  return (
    <div className="flex min-h-[calc(100vh-57px)] bg-muted/20">
      <div className="fixed left-0 right-0 top-[57px] z-30 flex items-center gap-3 border-b border-border/80 bg-background/80 px-4 py-3 backdrop-blur lg:hidden">
        <DocsMobileSidebar />
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Knowledge
          </p>
          <p className="text-sm font-semibold text-foreground">教程导航</p>
        </div>
      </div>

      <ScrollArea className="hidden w-[240px] flex-shrink-0 border-r border-border/80 bg-card/60 lg:block">
        <nav aria-label="教程导航" className="p-4">
          {TUTORIAL_NAV.map((section) => (
            <div key={section.title} className="mb-6">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </h3>
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item.slug}>
                    <Link
                      to={`/docs/${item.slug}`}
                      className={cn(
                        'block rounded-xl px-3 py-2 text-sm transition-colors',
                        slug === item.slug
                          ? 'bg-background font-medium text-foreground shadow-sm ring-1 ring-border'
                          : 'text-foreground/80 hover:bg-accent hover:text-foreground',
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

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto pt-[72px] lg:pt-0">
          <div className="mx-auto max-w-4xl px-6 py-8 lg:px-10 lg:py-10">
            <Outlet />
          </div>
        </main>

        <aside className="hidden w-[220px] flex-shrink-0 overflow-y-auto border-l border-border/80 bg-card/40 px-4 py-8 xl:block">
          <DocsToc slug={slug} />
        </aside>
      </div>
    </div>
  )
}
