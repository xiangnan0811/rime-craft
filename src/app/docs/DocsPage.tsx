import { useParams, Navigate } from 'react-router-dom'
import { useState, useEffect, type ComponentType } from 'react'
import { MDXProvider } from '@mdx-js/react'
import { mdxComponents } from '@/components/shared/mdx-components'
import { findTutorialBySlug, resolveTutorialSlug } from '@/data/tutorial-nav'
import { MDX_LOADERS } from '@/data/tutorial-loaders'
import { DocsBreadcrumb } from './DocsBreadcrumb'
import { DocsPagination } from './DocsPagination'

export function DocsPage() {
  const { slug } = useParams()
  const [Content, setContent] = useState<ComponentType | null>(null)
  const [loading, setLoading] = useState(true)

  const resolvedSlug = slug ? resolveTutorialSlug(slug) : undefined
  const item = resolvedSlug ? findTutorialBySlug(resolvedSlug) : undefined

  useEffect(() => {
    if (!resolvedSlug || !MDX_LOADERS[resolvedSlug]) {
      setLoading(false)
      return
    }

    setLoading(true)
    setContent(null)
    MDX_LOADERS[resolvedSlug]!()
      .then((mod) => {
        setContent(() => mod.default)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [resolvedSlug])

  if (!slug) {
    return <Navigate to="/docs/what-is-rime" replace />
  }

  if (resolvedSlug && resolvedSlug !== slug) {
    return <Navigate to={`/docs/${resolvedSlug}`} replace />
  }

  if (!item || !resolvedSlug) {
    return <p className="text-gray-500 dark:text-slate-400">页面不存在。</p>
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-4 w-32 rounded bg-gray-200 dark:bg-slate-700" />
        <div className="h-8 w-64 rounded bg-gray-200 dark:bg-slate-700" />
        <div className="h-4 w-full rounded bg-gray-100 dark:bg-slate-800" />
        <div className="h-4 w-3/4 rounded bg-gray-100 dark:bg-slate-800" />
      </div>
    )
  }

  if (!Content) {
    return <p className="text-gray-500 dark:text-slate-400">内容暂未编写。</p>
  }

  return (
    <>
      <DocsBreadcrumb slug={resolvedSlug} pageTitle={item.title} />
      <div data-docs-content>
        <MDXProvider components={mdxComponents}>
          <Content />
        </MDXProvider>
      </div>
      <DocsPagination slug={resolvedSlug} />
    </>
  )
}
