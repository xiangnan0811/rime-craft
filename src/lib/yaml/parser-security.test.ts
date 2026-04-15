import { describe, it, expect } from 'vitest'
import { expandPatchPaths } from './parser'

describe('expandPatchPaths security', () => {
  it('blocks __proto__ pollution at intermediate path', () => {
    const before = ({} as Record<string, unknown>).__proto__
    expandPatchPaths({ '__proto__/polluted': true })
    expect(({} as Record<string, unknown>).__proto__).toBe(before)
  })

  it('blocks __proto__ pollution at final path', () => {
    const result = expandPatchPaths({ 'safe/__proto__': true })
    // The intermediate 'safe' key is created, but '__proto__' is blocked
    expect(result).toEqual({ safe: {} })
    expect((result as Record<string, Record<string, unknown>>)['safe']!.__proto__).toBe(Object.prototype)
  })

  it('blocks constructor pollution', () => {
    expandPatchPaths({ 'constructor/prototype/polluted': true })
    expect(Object.prototype).not.toHaveProperty('polluted')
  })

  it('allows safe keys similar to dangerous ones', () => {
    const result = expandPatchPaths({ 'proto/value': 42 })
    expect(result).toEqual({ proto: { value: 42 } })
  })

  it('allows deeply nested safe paths', () => {
    const result = expandPatchPaths({ 'a/b/c/d': 'ok' })
    expect(result).toEqual({ a: { b: { c: { d: 'ok' } } } })
  })
})
