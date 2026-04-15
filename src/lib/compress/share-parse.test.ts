import { describe, it, expect } from 'vitest'
import { decompressConfig, parseShareUrl, parseConfigSnapshot, compressConfig } from './share'

describe('parseShareUrl', () => {
  it('parses a valid share URL', () => {
    const payload = compressConfig({ module: 'fuzzy-pinyin', yaml: 'patch:\n  speller: {}' })
    const result = parseShareUrl(`?share=${payload}`)
    expect(result).toEqual({
      module: 'fuzzy-pinyin',
      yaml: 'patch:\n  speller: {}',
    })
  })

  it('returns null for missing share param', () => {
    expect(parseShareUrl('?other=value')).toBeNull()
  })

  it('returns null for malformed compressed data', () => {
    expect(parseShareUrl('?share=notvalidlz')).toBeNull()
  })

  it('returns null for invalid module name', () => {
    const payload = compressConfig({ module: 'not-a-module', yaml: 'test' })
    const result = parseShareUrl(`?share=${payload}`)
    expect(result).toBeNull()
  })

  it('returns null when module field is missing', () => {
    const payload = compressConfig({ yaml: 'test' })
    expect(parseShareUrl(`?share=${payload}`)).toBeNull()
  })
})

describe('decompressConfig size limits', () => {
  it('rejects compressed data longer than 50KB', () => {
    expect(decompressConfig('a'.repeat(50_001))).toBeNull()
  })

  it('does not throw for input at 50KB limit', () => {
    expect(() => decompressConfig('a'.repeat(50_000))).not.toThrow()
  })
})

describe('parseConfigSnapshot', () => {
  it('rejects invalid JSON', () => {
    const result = parseConfigSnapshot('not json')
    expect(result.error).toBe('无效的 JSON 格式')
  })

  it('rejects wrong version', () => {
    const result = parseConfigSnapshot(JSON.stringify({ version: 2 }))
    expect(result.error).toContain('不支持的版本')
  })

  it('rejects missing project', () => {
    const result = parseConfigSnapshot(JSON.stringify({ version: 1 }))
    expect(result.error).toContain('缺少 project')
  })

  it('rejects incomplete project structure', () => {
    const result = parseConfigSnapshot(JSON.stringify({
      version: 1,
      project: { targetPlatform: 'macos' },
    }))
    expect(result.error).toContain('project 结构不完整')
  })

  it('accepts a valid snapshot', () => {
    const validProject = {
      targetPlatform: 'macos',
      defaultConfig: { schemaList: [], pageSize: 5, selectKeys: '', asciiComposer: { goodOldCapsLock: false, switchKey: {} }, keyBinder: { bindings: [] } },
      platformConfig: { platform: 'macos', appOptions: {} },
      schemaConfigs: {},
      customPhrases: [],
      preserved: {},
    }
    const result = parseConfigSnapshot(JSON.stringify({ version: 1, project: validProject }))
    expect(result.snapshot).toBeDefined()
    expect(result.error).toBeUndefined()
  })
})
