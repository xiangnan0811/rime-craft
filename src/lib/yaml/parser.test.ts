import { describe, it, expect } from 'vitest'
import {
  parseCustomYaml,
  expandPatchPaths,
  mapToDefaultConfig,
  mapToPlatformConfig,
  extractPreservedFields,
} from './parser'
import { DEFAULT_CONFIG, DEFAULT_PLATFORM_CONFIG } from '@/lib/config/defaults'

describe('parseCustomYaml', () => {
  it('extracts patch from valid custom yaml', () => {
    const yaml = `
patch:
  schema_list:
    - schema: luna_pinyin
    - schema: double_pinyin_flypy
  "menu/page_size": 9
`
    const result = parseCustomYaml(yaml)
    expect(result.patch).toBeDefined()
    expect(result.patch.schema_list).toHaveLength(2)
  })

  it('returns empty patch for invalid yaml', () => {
    const result = parseCustomYaml('not: valid: yaml: {{')
    expect(result.patch).toEqual({})
    expect(result.error).toBeDefined()
  })

  it('returns empty patch when no patch key', () => {
    const result = parseCustomYaml('some_key: value')
    expect(result.patch).toEqual({})
  })
})

describe('expandPatchPaths', () => {
  it('expands slash-delimited keys into nested objects', () => {
    const patch = { 'menu/page_size': 9, 'menu/alternative_select_keys': '123456789' }
    const expanded = expandPatchPaths(patch)
    expect(expanded).toEqual({
      menu: { page_size: 9, alternative_select_keys: '123456789' },
    })
  })

  it('preserves non-slash keys as-is', () => {
    const patch = { schema_list: [{ schema: 'luna_pinyin' }] }
    const expanded = expandPatchPaths(patch)
    expect(expanded).toEqual({ schema_list: [{ schema: 'luna_pinyin' }] })
  })

  it('merges flat path keys with nested object keys', () => {
    const patch = {
      ascii_composer: { good_old_caps_lock: true },
      'ascii_composer/switch_key/Shift_L': 'commit_code',
    }
    const expanded = expandPatchPaths(patch)
    expect(expanded.ascii_composer).toEqual({
      good_old_caps_lock: true,
      switch_key: { Shift_L: 'commit_code' },
    })
  })
})

describe('mapToDefaultConfig', () => {
  it('maps a full patch to DefaultConfig', () => {
    const patch = {
      schema_list: [{ schema: 'rime_ice' }, { schema: 'double_pinyin_flypy' }],
      menu: { page_size: 9, alternative_select_keys: 'ASDFGHJKL' },
      ascii_composer: {
        good_old_caps_lock: true,
        switch_key: {
          Shift_L: 'commit_code',
          Shift_R: 'inline_ascii',
          Control_L: 'noop',
          Control_R: 'noop',
          Caps_Lock: 'clear',
        },
      },
    }
    const config = mapToDefaultConfig(patch, DEFAULT_CONFIG)
    expect(config.schemaList).toEqual([
      { schema: 'rime_ice' },
      { schema: 'double_pinyin_flypy' },
    ])
    expect(config.pageSize).toBe(9)
    expect(config.selectKeys).toBe('ASDFGHJKL')
    expect(config.asciiComposer.switchKey.shiftL).toBe('commit_code')
  })

  it('falls back to defaults for missing fields', () => {
    const patch = { schema_list: [{ schema: 'rime_ice' }] }
    const config = mapToDefaultConfig(patch, DEFAULT_CONFIG)
    expect(config.pageSize).toBe(5)
    expect(config.asciiComposer.switchKey.shiftL).toBe('inline_ascii')
  })
})

describe('mapToPlatformConfig', () => {
  it('maps app_options to PlatformConfig', () => {
    const patch = {
      app_options: {
        'com.apple.Terminal': { ascii_mode: true },
        'com.microsoft.VSCode': { ascii_mode: true },
      },
    }
    const config = mapToPlatformConfig(patch, DEFAULT_PLATFORM_CONFIG)
    expect(config.appOptions['com.apple.Terminal']).toEqual({ asciiMode: true })
    expect(config.appOptions['com.microsoft.VSCode']).toEqual({ asciiMode: true })
  })
})

describe('extractPreservedFields', () => {
  it('extracts keys not in the known set', () => {
    const patch = {
      schema_list: [{ schema: 'luna_pinyin' }],
      menu: { page_size: 9 },
      some_unknown_key: 'value',
      'another/unknown': 42,
    }
    const knownBaseKeys = ['schema_list', 'menu', 'ascii_composer', 'key_binder', 'switcher']
    const preserved = extractPreservedFields(patch, knownBaseKeys)
    expect(preserved).toEqual({
      some_unknown_key: 'value',
      'another/unknown': 42,
    })
    expect(preserved.schema_list).toBeUndefined()
    expect(preserved.menu).toBeUndefined()
  })
})
