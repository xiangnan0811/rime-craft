import { describe, it, expect } from 'vitest'
import { flattenNav, findSectionBySlug, getPrevNext } from '../tutorial-helpers'

describe('flattenNav', () => {
  it('returns all items with section titles', () => {
    const flat = flattenNav()
    expect(flat.length).toBe(17)
    expect(flat[0]).toEqual({
      slug: 'what-is-rime',
      title: 'Rime 是什么',
      sectionTitle: '入门指南',
    })
  })

  it('preserves order across sections', () => {
    const flat = flattenNav()
    const slugs = flat.map((i) => i.slug)
    expect(slugs.indexOf('config-structure')).toBeLessThan(
      slugs.indexOf('schema-manager'),
    )
  })
})

describe('findSectionBySlug', () => {
  it('finds section for a known slug', () => {
    const section = findSectionBySlug('schema-manager')
    expect(section?.title).toBe('配置详解')
  })

  it('returns undefined for unknown slug', () => {
    expect(findSectionBySlug('nonexistent')).toBeUndefined()
  })
})

describe('getPrevNext', () => {
  it('returns null prev for first item', () => {
    const { prev, next } = getPrevNext('what-is-rime')
    expect(prev).toBeNull()
    expect(next?.slug).toBe('installation')
  })

  it('returns null next for last item', () => {
    const { prev, next } = getPrevNext('multi-device-sync')
    expect(prev?.slug).toBe('lua-extensions')
    expect(next).toBeNull()
  })

  it('spans across sections', () => {
    const { prev, next } = getPrevNext('config-structure')
    expect(prev?.slug).toBe('first-deploy')
    expect(next?.slug).toBe('schema-manager')
    expect(next?.sectionTitle).toBe('配置详解')
  })

  it('returns both null for unknown slug', () => {
    const { prev, next } = getPrevNext('nonexistent')
    expect(prev).toBeNull()
    expect(next).toBeNull()
  })
})
