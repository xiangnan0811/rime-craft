import { describe, it, expect } from 'vitest'
import {
  parseCustomYaml,
  expandPatchPaths,
  mapToDefaultConfig,
  mapToPlatformConfig,
  mapToSchemaConfig,
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

describe('mapToSchemaConfig', () => {
  it('maps switches from expanded patch', () => {
    const patch = {
      switches: [
        { name: 'emoji', reset: 1, states: ['关', '开'] },
        { name: 'simplification', reset: 1 },
      ],
    }
    const config = mapToSchemaConfig(patch, 'rime_ice')
    expect(config.switches).toHaveLength(2)
    expect(config.switches![0]).toEqual({ name: 'emoji', reset: 1, states: ['关', '开'] })
    expect(config.switches![1]).toEqual({ name: 'simplification', reset: 1, states: undefined })
  })

  it('maps punctuator half_shape', () => {
    const patch = {
      punctuator: {
        half_shape: { ',': '，', '/': ['/', '÷'] },
      },
    }
    const config = mapToSchemaConfig(patch, 'rime_ice')
    expect(config.punctuator!.halfShape[',']).toBe('，')
    expect(config.punctuator!.halfShape['/']).toEqual(['/', '÷'])
  })

  it('returns only schemaId when no switches or punctuator', () => {
    const config = mapToSchemaConfig({}, 'test')
    expect(config.schemaId).toBe('test')
    expect(config.switches).toBeUndefined()
    expect(config.punctuator).toBeUndefined()
  })

  it('maps translator fields from expanded patch', () => {
    const patch = {
      translator: {
        enable_completion: true,
        enable_user_dict: false,
        core_word_length: 4,
        max_word_length: 7,
        max_homophones: 8,
        max_homographs: 8,
        spelling_hints: 30,
        always_show_comments: true,
      },
    }
    const config = mapToSchemaConfig(patch, 'wanxiang')
    expect(config.translator).toBeDefined()
    expect(config.translator!.enableCompletion).toBe(true)
    expect(config.translator!.enableUserDict).toBe(false)
    expect(config.translator!.coreWordLength).toBe(4)
    expect(config.translator!.spellingHints).toBe(30)
  })

  it('maps multi-state switches', () => {
    const patch = {
      switches: [
        { options: ['s2s', 's2t'], reset: 0, states: ['简体', '繁体'] },
        { name: 'emoji', reset: 1, states: ['关', '开'] },
      ],
    }
    const config = mapToSchemaConfig(patch, 'test')
    expect(config.switches).toHaveLength(2)
    const first = config.switches![0] as { options: string[]; reset: number; states: string[] }
    expect(first.options).toEqual(['s2s', 's2t'])
    expect(first.states).toEqual(['简体', '繁体'])
    const second = config.switches![1] as { name: string; reset: number }
    expect(second.name).toBe('emoji')
  })

  it('maps lua extension super_comment from expanded patch', () => {
    const patch = {
      super_comment: {
        candidate_length: 10,
        corrector_type: 'pinyin',
      },
    }
    const config = mapToSchemaConfig(patch, 'test')
    expect(config.luaExtensions).toBeDefined()
    expect(config.luaExtensions!.superComment!.candidateLength).toBe(10)
    expect(config.luaExtensions!.superComment!.correctorType).toBe('pinyin')
  })
})

describe('mapToPlatformConfig with style', () => {
  it('parses theme style with BGR colors', () => {
    const patch = {
      style: {
        horizontal: true,
        font_face: 'PingFang SC',
        font_point: 18,
        corner_radius: 8,
        back_color: 0xFFFFFF,
        text_color: 0x000000,
        hilited_candidate_back_color: 0xD99A4A,
      },
    }
    const config = mapToPlatformConfig(patch, DEFAULT_PLATFORM_CONFIG)
    expect(config.style).toBeDefined()
    expect(config.style!.horizontal).toBe(true)
    expect(config.style!.fontFace).toBe('PingFang SC')
    expect(config.style!.fontSize).toBe(18)
    expect(config.style!.colors.backgroundColor).toBe('#FFFFFF')
    expect(config.style!.colors.hilitedCandidateBackColor).toBe('#4A9AD9')
  })

  it('uses defaults when style fields are missing', () => {
    const patch = {
      style: {
        horizontal: true,
      },
    }
    const config = mapToPlatformConfig(patch, DEFAULT_PLATFORM_CONFIG)
    expect(config.style).toBeDefined()
    expect(config.style!.fontFace).toBe('sans-serif')
    expect(config.style!.fontSize).toBe(16)
    expect(config.style!.name).toBe('custom')
  })

  it('does not set style when no style block', () => {
    const patch = {
      app_options: { 'com.apple.Terminal': { ascii_mode: true } },
    }
    const config = mapToPlatformConfig(patch, DEFAULT_PLATFORM_CONFIG)
    expect(config.style).toBeUndefined()
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
