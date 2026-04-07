import { describe, it, expect } from 'vitest'
import {
  compressConfig,
  decompressConfig,
  createConfigSnapshot,
  parseConfigSnapshot,
} from './share'
import { createEmptyProject } from '@/lib/config/defaults'

describe('compressConfig / decompressConfig', () => {
  it('round-trips correctly', () => {
    const data = { module: 'fuzzy-pinyin', yaml: 'test: value' }
    const compressed = compressConfig(data)
    const result = decompressConfig(compressed)
    expect(result).toEqual(data)
  })

  it('returns null for invalid compressed data', () => {
    expect(decompressConfig('invalid')).toBeNull()
  })

  it('produces URL-safe output', () => {
    const data = { key: '你好世界' }
    const compressed = compressConfig(data)
    // Should not contain characters that need URL encoding
    expect(compressed).not.toContain(' ')
    expect(compressed).not.toContain('#')
  })
})

describe('createConfigSnapshot / parseConfigSnapshot', () => {
  it('round-trips project through snapshot', () => {
    const project = createEmptyProject()
    project.defaultConfig.pageSize = 9
    const snapshot = createConfigSnapshot(project)
    const json = JSON.stringify(snapshot)
    const result = parseConfigSnapshot(json)
    expect(result.error).toBeUndefined()
    expect(result.snapshot!.version).toBe(1)
    expect(result.snapshot!.project.defaultConfig.pageSize).toBe(9)
  })

  it('rejects invalid version', () => {
    const result = parseConfigSnapshot(
      JSON.stringify({ version: 2, project: {} }),
    )
    expect(result.error).toContain('不支持的版本')
  })

  it('rejects missing project', () => {
    const result = parseConfigSnapshot(JSON.stringify({ version: 1 }))
    expect(result.error).toContain('缺少 project')
  })

  it('rejects invalid JSON', () => {
    const result = parseConfigSnapshot('not json')
    expect(result.error).toContain('JSON')
  })
})
