import { useParams, Navigate } from 'react-router-dom'
import { useState, useEffect, type ComponentType } from 'react'
import { MDXProvider } from '@mdx-js/react'
import { mdxComponents } from '@/components/shared/mdx-components'
import { findTutorialBySlug } from '@/data/tutorial-nav'

// Dynamic import map for MDX files
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
    return <p className="text-gray-500">页面不存在。</p>
  }

  if (loading) {
    return <p className="text-gray-400">加载中...</p>
  }

  if (!Content) {
    return <p className="text-gray-500">内容暂未编写。</p>
  }

  return (
    <MDXProvider components={mdxComponents}>
      <Content />
    </MDXProvider>
  )
}
