import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { findSectionBySlug } from '@/lib/docs/tutorial-helpers'

interface DocsBreadcrumbProps {
  slug: string
  pageTitle: string
}

export function DocsBreadcrumb({ slug, pageTitle }: DocsBreadcrumbProps) {
  const section = findSectionBySlug(slug)
  if (!section) return null

  const firstSlug = section.items[0]?.slug ?? slug

  return (
    <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
      <Link
        to={`/docs/${firstSlug}`}
        className="transition-colors hover:text-foreground"
      >
        {section.title}
      </Link>
      <ChevronRight className="h-3.5 w-3.5" />
      <span className="text-foreground">{pageTitle}</span>
    </nav>
  )
}
