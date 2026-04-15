import { describe, it, expect } from 'vitest'
import { isRecord, isValidSourceFile, isValidProject, SOURCE_FILE_KINDS } from './validators'

describe('isRecord', () => {
  it('returns true for plain objects', () => {
    expect(isRecord({})).toBe(true)
    expect(isRecord({ a: 1 })).toBe(true)
  })

  it('returns false for null', () => {
    expect(isRecord(null)).toBe(false)
  })

  it('returns false for arrays', () => {
    expect(isRecord([])).toBe(false)
  })

  it('returns false for primitives', () => {
    expect(isRecord('string')).toBe(false)
    expect(isRecord(42)).toBe(false)
  })
})

describe('isValidSourceFile', () => {
  const validFile = {
    id: 'default.custom.yaml',
    fileName: 'default.custom.yaml',
    kind: 'default',
    content: 'patch:\n  menu:\n    page_size: 9',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }

  it('accepts a valid source file', () => {
    expect(isValidSourceFile(validFile)).toBe(true)
  })

  it('accepts valid source file with optional platform', () => {
    expect(isValidSourceFile({ ...validFile, platform: 'macos' })).toBe(true)
  })

  it('rejects missing id', () => {
    const { id, ...rest } = validFile
    expect(isValidSourceFile(rest)).toBe(false)
  })

  it('rejects invalid kind', () => {
    expect(isValidSourceFile({ ...validFile, kind: 'unknown' })).toBe(false)
  })

  it('rejects invalid platform', () => {
    expect(isValidSourceFile({ ...validFile, platform: 'linux' })).toBe(false)
  })

  it('rejects null', () => {
    expect(isValidSourceFile(null)).toBe(false)
  })
})

describe('isValidProject', () => {
  const validProject = {
    targetPlatform: 'macos',
    defaultConfig: { schemaList: [], pageSize: 5, selectKeys: '', asciiComposer: {}, keyBinder: {} },
    platformConfig: { platform: 'macos', appOptions: {} },
    schemaConfigs: {},
    customPhrases: [],
    preserved: {},
  }

  it('accepts a valid project', () => {
    expect(isValidProject(validProject)).toBe(true)
  })

  it('rejects missing targetPlatform', () => {
    const { targetPlatform, ...rest } = validProject
    expect(isValidProject(rest)).toBe(false)
  })

  it('rejects missing schemaConfigs', () => {
    const { schemaConfigs, ...rest } = validProject
    expect(isValidProject(rest)).toBe(false)
  })

  it('rejects schemaConfigs as array', () => {
    expect(isValidProject({ ...validProject, schemaConfigs: [] })).toBe(false)
  })

  it('rejects null', () => {
    expect(isValidProject(null)).toBe(false)
  })
})

describe('SOURCE_FILE_KINDS', () => {
  it('contains exactly 4 kinds', () => {
    expect(SOURCE_FILE_KINDS.size).toBe(4)
    expect(SOURCE_FILE_KINDS.has('default')).toBe(true)
    expect(SOURCE_FILE_KINDS.has('platform')).toBe(true)
    expect(SOURCE_FILE_KINDS.has('schema')).toBe(true)
    expect(SOURCE_FILE_KINDS.has('custom_phrase')).toBe(true)
  })
})
