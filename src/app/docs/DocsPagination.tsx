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
          className="group flex items-center gap-3 rounded-xl border border-border/80 bg-card/70 px-4 py-3 transition-colors hover:bg-accent/50"
        >
          <ChevronLeft className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
          <div>
            <div className="text-xs text-muted-foreground">上一篇</div>
            <div className="text-sm font-medium text-foreground">{prev.title}</div>
          </div>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          to={`/docs/${next.slug}`}
          className="group flex items-center gap-3 rounded-xl border border-border/80 bg-card/70 px-4 py-3 text-right transition-colors hover:bg-accent/50"
        >
          <div>
            <div className="text-xs text-muted-foreground">下一篇</div>
            <div className="text-sm font-medium text-foreground">{next.title}</div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
        </Link>
      ) : (
        <div />
      )}
    </nav>
  )
}
