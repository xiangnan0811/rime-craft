import { useParams, Navigate } from 'react-router-dom'
import { useState, useEffect, type ComponentType } from 'react'
import { MDXProvider } from '@mdx-js/react'
import { mdxComponents } from '@/components/shared/mdx-components'
import { findTutorialBySlug } from '@/data/tutorial-nav'
import { DocsBreadcrumb } from './DocsBreadcrumb'
import { DocsPagination } from './DocsPagination'

const MDX_MODULES: Record<string, () => Promise<{ default: ComponentType }>> = {
  'what-is-rime': () => import('@/content/what-is-rime.mdx'),
  'installation': () => import('@/content/installation.mdx'),
  'first-deploy': () => import('@/content/first-deploy.mdx'),
  'config-structure': () => import('@/content/config-structure.mdx'),
  'schema-manager': () => import('@/content/schema-manager.mdx'),
  'candidate-settings': () => import('@/content/candidate-settings.mdx'),
  'key-bindings': () => import('@/content/key-bindings.mdx'),
  'fuzzy-pinyin': () => import('@/content/fuzzy-pinyin.mdx'),
  'ascii-mode': () => import('@/content/ascii-mode.mdx'),
  'punctuation': () => import('@/content/punctuation.mdx'),
  'dictionary': () => import('@/content/dictionary.mdx'),
  'switches': () => import('@/content/switches.mdx'),
  'double-pinyin-guide': () => import('@/content/double-pinyin-guide.mdx'),
  'auxiliary-code': () => import('@/content/auxiliary-code.mdx'),
  'custom-dictionary': () => import('@/content/custom-dictionary.mdx'),
  'lua-scripting': () => import('@/content/lua-scripting.mdx'),
  'multi-device-sync': () => import('@/content/multi-device-sync.mdx'),
}

export function DocsPage() {
  const { slug } = useParams()
  const [Content, setContent] = useState<ComponentType | null>(null)
  const [loading, setLoading] = useState(true)

  const item = slug ? findTutorialBySlug(slug) : undefined

  useEffect(() => {
    if (!slug || !MDX_MODULES[slug]) {
      setLoading(false)
      return
    }

    setLoading(true)
    setContent(null)
    MDX_MODULES[slug]!()
      .then((mod) => {
        setContent(() => mod.default)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [slug])

  if (!slug) {
    return <Navigate to="/docs/what-is-rime" replace />
  }

  if (!item) {
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
      <DocsBreadcrumb slug={slug} pageTitle={item.title} />
      <div data-docs-content>
        <MDXProvider components={mdxComponents}>
          <Content />
        </MDXProvider>
      </div>
      <DocsPagination slug={slug} />
    </>
  )
}
