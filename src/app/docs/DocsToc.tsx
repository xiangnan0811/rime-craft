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
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
        On this page
      </h4>
      <ul className="space-y-1 border-l-2 border-gray-100 dark:border-slate-800">
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
                  ? 'border-blue-500 font-medium text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200',
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
