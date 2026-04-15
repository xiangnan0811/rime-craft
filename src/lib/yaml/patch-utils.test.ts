import { describe, it, expect } from 'vitest'
import { parseDocument } from 'yaml'
import { flattenPatchEntries, isYamlMapNodeEmpty, pruneEmptyParents } from './patch-utils'

describe('flattenPatchEntries', () => {
  it('flattens nested object into path/value pairs', () => {
    const result = flattenPatchEntries({ a: { b: 'v1', c: 'v2' } })
    expect(result).toEqual([
      { path: ['a', 'b'], value: 'v1' },
      { path: ['a', 'c'], value: 'v2' },
    ])
  })

  it('treats arrays as leaf values', () => {
    const result = flattenPatchEntries({ a: [1, 2] })
    expect(result).toEqual([{ path: ['a'], value: [1, 2] }])
  })

  it('treats empty objects as leaf values', () => {
    const result = flattenPatchEntries({ a: {} })
    expect(result).toEqual([{ path: ['a'], value: {} }])
  })

  it('returns empty array for empty input', () => {
    expect(flattenPatchEntries({})).toEqual([])
  })

  it('handles deeply nested structures', () => {
    const result = flattenPatchEntries({ a: { b: { c: 'deep' } } })
    expect(result).toEqual([{ path: ['a', 'b', 'c'], value: 'deep' }])
  })
})

describe('isYamlMapNodeEmpty', () => {
  it('returns true for node with empty items array', () => {
    expect(isYamlMapNodeEmpty({ items: [] })).toBe(true)
  })

  it('returns false for node with items', () => {
    expect(isYamlMapNodeEmpty({ items: ['something'] })).toBe(false)
  })

  it('returns false for non-object', () => {
    expect(isYamlMapNodeEmpty('string')).toBe(false)
  })

  it('returns false for null', () => {
    expect(isYamlMapNodeEmpty(null)).toBe(false)
  })

  it('returns false for object without items', () => {
    expect(isYamlMapNodeEmpty({ other: [] })).toBe(false)
  })
})

describe('pruneEmptyParents', () => {
  it('removes empty parent map nodes from yaml document', () => {
    const doc = parseDocument('patch:\n  a:\n    b: 1')
    doc.deleteIn(['patch', 'a', 'b'])
    pruneEmptyParents(doc, ['a', 'b'])
    expect(doc.getIn(['patch', 'a'])).toBeUndefined()
  })

  it('preserves non-empty parents', () => {
    const doc = parseDocument('patch:\n  a:\n    b: 1\n    c: 2')
    doc.deleteIn(['patch', 'a', 'b'])
    pruneEmptyParents(doc, ['a', 'b'])
    expect(doc.getIn(['patch', 'a', 'c'])).toBe(2)
  })
})
