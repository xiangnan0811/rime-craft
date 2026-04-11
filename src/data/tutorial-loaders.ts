import type { ComponentType } from 'react'

export const MDX_LOADERS: Record<string, () => Promise<{ default: ComponentType }>> = {
  'schema-manager': () => import('@/content/schema-manager.mdx'),
  'candidate-settings': () => import('@/content/candidate-settings.mdx'),
  'key-bindings': () => import('@/content/key-bindings.mdx'),
  'fuzzy-pinyin': () => import('@/content/fuzzy-pinyin.mdx'),
  'ascii-mode': () => import('@/content/ascii-mode.mdx'),
  'punctuation': () => import('@/content/punctuation.mdx'),
  'dictionary': () => import('@/content/dictionary.mdx'),
  'switches': () => import('@/content/switches.mdx'),
  'spelling-scheme': () => import('@/content/spelling-scheme.mdx'),
  'auxiliary-code-config': () => import('@/content/auxiliary-code-config.mdx'),
  'reverse-lookup': () => import('@/content/reverse-lookup.mdx'),
  'lua-extensions': () => import('@/content/lua-extensions.mdx'),
  'candidate-display': () => import('@/content/candidate-display.mdx'),
  'comment-hints': () => import('@/content/comment-hints.mdx'),
}
