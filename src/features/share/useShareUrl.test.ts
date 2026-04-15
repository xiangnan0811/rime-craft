import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { parseShareUrl, compressConfig } from '@/lib/compress/share'

describe('parseShareUrl', () => {
  it('returns null when no share param is present', () => {
    const result = parseShareUrl('')
    expect(result).toBeNull()
  })

  it('returns null for an empty query string', () => {
    const result = parseShareUrl('?foo=bar')
    expect(result).toBeNull()
  })

  it('parses a valid share param correctly', () => {
    const payload = { module: 'fuzzy-pinyin', yaml: 'patch:\n  key: value' }
    const compressed = compressConfig(payload)
    const result = parseShareUrl(`?share=${compressed}`)
    expect(result).not.toBeNull()
    expect(result!.module).toBe('fuzzy-pinyin')
    expect(result!.yaml).toBe('patch:\n  key: value')
  })

  it('returns null for an invalid module name', () => {
    const payload = { module: 'not-a-real-module', yaml: 'patch:' }
    const compressed = compressConfig(payload)
    const result = parseShareUrl(`?share=${compressed}`)
    expect(result).toBeNull()
  })

  it('returns null for corrupted share data', () => {
    const result = parseShareUrl('?share=not-valid-compressed-data!!!')
    expect(result).toBeNull()
  })

  it('returns null when module or yaml fields are missing', () => {
    const payload = { module: 'fuzzy-pinyin' } // missing yaml
    const compressed = compressConfig(payload as Record<string, unknown>)
    const result = parseShareUrl(`?share=${compressed}`)
    expect(result).toBeNull()
  })
})
