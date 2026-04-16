import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { TUTORIAL_NAV } from '@/data/tutorial-nav'

export function DocsMobileSidebar() {
  const { slug } = useParams()
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto bg-background p-6 shadow-xl lg:hidden">
            <div className="mb-6 flex items-center justify-between">
              <span className="text-lg font-bold">Tutorial</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav>
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
                          onClick={() => setOpen(false)}
                          className={cn(
                            'block rounded-md px-3 py-2 text-sm transition-colors',
                            slug === item.slug
                              ? 'border-l-2 border-blue-500 bg-blue-50 font-medium text-foreground dark:bg-blue-950/30'
                              : 'text-foreground/80 hover:bg-accent',
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
          </div>
        </>
      )}
    </>
  )
}
