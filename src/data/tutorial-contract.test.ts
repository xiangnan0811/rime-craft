import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { MODULE_REGISTRY } from './module-registry'
import { MDX_LOADERS } from './tutorial-loaders'
import { findTutorialBySlug, resolveTutorialSlug, TUTORIAL_NAV } from './tutorial-nav'

const contentDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../content',
)

const contentSlugs = fs.readdirSync(contentDir)
  .filter((file) => file.endsWith('.mdx'))
  .map((file) => file.replace(/\.mdx$/, ''))

const navSlugs = TUTORIAL_NAV.flatMap((section) =>
  section.items.map((item) => item.slug),
)

const moduleSlugs = MODULE_REGISTRY.flatMap((module) =>
  module.tutorialSlug ? [module.tutorialSlug] : [],
)

describe('tutorial contracts', () => {
  it('publishes every module tutorial slug in docs routing', () => {
    for (const slug of moduleSlugs) {
      expect(findTutorialBySlug(slug), slug).toBeDefined()
      expect(MDX_LOADERS[slug], slug).toBeTypeOf('function')
    }
  })

  it('keeps every public content file routable', () => {
    for (const slug of contentSlugs) {
      expect(findTutorialBySlug(slug), slug).toBeDefined()
      expect(MDX_LOADERS[slug], slug).toBeTypeOf('function')
    }
  })

  it('keeps the legacy auxiliary-code slug redirectable', () => {
    expect(resolveTutorialSlug('auxiliary-code')).toBe('auxiliary-code-config')
    expect(findTutorialBySlug('auxiliary-code')?.slug).toBe('auxiliary-code-config')
  })

  it('includes the restored advanced tutorials in public navigation', () => {
    expect(navSlugs).toEqual(expect.arrayContaining([
      'spelling-scheme',
      'auxiliary-code-config',
      'reverse-lookup',
      'candidate-display',
      'comment-hints',
    ]))
  })
})
