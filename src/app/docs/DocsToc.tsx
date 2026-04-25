import { cn } from '@/lib/utils'
import { useHeadings } from '@/lib/docs/use-headings'
import { useActiveHeading } from '@/lib/docs/use-active-heading'

interface DocsTocProps {
  slug: string | undefined
}

export function DocsToc({ slug }: DocsTocProps) {
  const headings = useHeadings(slug)
  const activeId = useActiveHeading(headings.map((h) => h.id))

  if (headings.length === 0) return null

  return (
    <nav className="sticky top-20">
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        本页目录
      </h4>
      <ul className="space-y-1 border-l-2 border-border/80">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              onClick={(e) => {
                e.preventDefault()
                document.getElementById(heading.id)?.scrollIntoView({ behavior: 'smooth' })
              }}
              className={cn(
                'block border-l-2 -ml-[2px] py-1 text-sm transition-colors',
                heading.level === 3 ? 'pl-6' : 'pl-4',
                activeId === heading.id
                  ? 'border-foreground font-medium text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
