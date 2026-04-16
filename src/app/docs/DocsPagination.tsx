import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getPrevNext } from '@/lib/docs/tutorial-helpers'

interface DocsPaginationProps {
  slug: string
}

export function DocsPagination({ slug }: DocsPaginationProps) {
  const { prev, next } = getPrevNext(slug)

  if (!prev && !next) return null

  return (
    <nav className="mt-12 flex items-stretch justify-between border-t border-border pt-6">
      {prev ? (
        <Link
          to={`/docs/${prev.slug}`}
          className="group flex items-center gap-2 rounded-lg border border-border px-4 py-3 transition-colors hover:border-blue-300 hover:bg-blue-50 dark:hover:border-blue-700 dark:hover:bg-blue-950/30"
        >
          <ChevronLeft className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-blue-500" />
          <div>
            <div className="text-xs text-muted-foreground">Previous</div>
            <div className="text-sm font-medium text-foreground">{prev.title}</div>
          </div>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          to={`/docs/${next.slug}`}
          className="group flex items-center gap-2 rounded-lg border border-border px-4 py-3 text-right transition-colors hover:border-blue-300 hover:bg-blue-50 dark:hover:border-blue-700 dark:hover:bg-blue-950/30"
        >
          <div>
            <div className="text-xs text-muted-foreground">Next</div>
            <div className="text-sm font-medium text-foreground">{next.title}</div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-blue-500" />
        </Link>
      ) : (
        <div />
      )}
    </nav>
  )
}
