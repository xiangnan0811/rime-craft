import { describe, it, expect } from 'vitest'
import { getModifiedFields } from './diff'
import { DEFAULT_CONFIG } from './defaults'
import type { DefaultConfig } from '@/types/config'

describe('getModifiedFields', () => {
  it('returns empty set for default config', () => {
    const modified = getModifiedFields(structuredClone(DEFAULT_CONFIG))
    expect(modified.size).toBe(0)
  })

  it('detects changed pageSize', () => {
    const config = { ...structuredClone(DEFAULT_CONFIG), pageSize: 9 }
    const modified = getModifiedFields(config)
    expect(modified.has('pageSize')).toBe(true)
  })

  it('detects changed selectKeys', () => {
    const config = { ...structuredClone(DEFAULT_CONFIG), selectKeys: 'ASDFGHJKL' }
    const modified = getModifiedFields(config)
    expect(modified.has('selectKeys')).toBe(true)
  })

  it('detects changed schema list', () => {
    const config = structuredClone(DEFAULT_CONFIG)
    config.schemaList = [{ schema: 'rime_ice' }]
    const modified = getModifiedFields(config)
    expect(modified.has('schemaList')).toBe(true)
  })

  it('detects changed switch key', () => {
    const config = structuredClone(DEFAULT_CONFIG)
    config.asciiComposer.switchKey.shiftL = 'commit_code'
    const modified = getModifiedFields(config)
    expect(modified.has('asciiComposer.switchKey.shiftL')).toBe(true)
  })

  it('does not flag unchanged fields', () => {
    const config = structuredClone(DEFAULT_CONFIG)
    config.pageSize = 9
    const modified = getModifiedFields(config)
    expect(modified.has('selectKeys')).toBe(false)
    expect(modified.has('asciiComposer.switchKey.shiftL')).toBe(false)
  })

  it('detects changed key bindings content', () => {
    const config: DefaultConfig = {
      ...DEFAULT_CONFIG,
      keyBinder: {
        bindings: [{ when: 'composing', accept: 'Tab', send: 'Page_Down' }],
      },
    }
    const modified = getModifiedFields(config)
    expect(modified.has('keyBinder.bindings')).toBe(true)
  })
})
