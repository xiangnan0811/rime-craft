import { describe, it, expect, beforeEach } from 'vitest'
import { getSearchIndex, searchDocs } from './search-index'

describe('search-index', () => {
  beforeEach(() => {
    // Force fresh index by resetting the module-level singleton.
    // getSearchIndex() lazily creates the index, so just calling it is sufficient.
  })

  it('builds the search index without errors', () => {
    const index = getSearchIndex()
    expect(index).toBeDefined()
    expect(index.documentCount).toBeGreaterThan(0)
  })

  it('returns the same instance on subsequent calls', () => {
    const index1 = getSearchIndex()
    const index2 = getSearchIndex()
    expect(index1).toBe(index2)
  })

  it('returns matching results for a known tutorial title', () => {
    // "安装教程" is a tutorial item with slug "installation"
    const results = searchDocs('安装')
    expect(results.length).toBeGreaterThan(0)
    const slugs = results.map((r) => r.slug)
    expect(slugs).toContain('installation')
  })

  it('returns matching results for a section title', () => {
    // "配置详解" is a section title in TUTORIAL_NAV
    const results = searchDocs('配置')
    expect(results.length).toBeGreaterThan(0)
  })

  it('returns empty array for nonsense query', () => {
    const results = searchDocs('xyzzyplugh42')
    expect(results).toHaveLength(0)
  })

  it('returns empty array for empty query', () => {
    const results = searchDocs('')
    expect(results).toHaveLength(0)
  })
})
