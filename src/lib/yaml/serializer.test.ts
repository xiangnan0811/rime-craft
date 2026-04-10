import { describe, it, expect } from 'vitest'
import { parse } from 'yaml'
import {
  serializeDefaultConfig,
  serializePlatformConfig,
  serializeSchemaConfig,
  buildCustomYaml,
} from './serializer'
import type { SchemaConfig } from '@/types/config'
import { expandPatchPaths, mapToDefaultConfig } from './parser'
import { DEFAULT_CONFIG, DEFAULT_PLATFORM_CONFIG } from '@/lib/config/defaults'

describe('serializeDefaultConfig', () => {
  it('serializes schema list and page size', () => {
    const config = {
      ...DEFAULT_CONFIG,
      schemaList: [{ schema: 'rime_ice' }, { schema: 'double_pinyin_flypy' }],
      pageSize: 9,
    }
    const patch = serializeDefaultConfig(config)
    expect(patch.schema_list).toEqual([
      { schema: 'rime_ice' },
      { schema: 'double_pinyin_flypy' },
    ])
    expect(patch['menu/page_size']).toBe(9)
  })

  it('serializes ascii composer switch keys', () => {
    const config = {
      ...DEFAULT_CONFIG,
      asciiComposer: {
        goodOldCapsLock: true,
        switchKey: {
          shiftL: 'commit_code' as const,
          shiftR: 'inline_ascii' as const,
          controlL: 'noop' as const,
          controlR: 'noop' as const,
          capsLock: 'clear' as const,
        },
      },
    }
    const patch = serializeDefaultConfig(config)
    expect(patch.ascii_composer).toEqual({
      good_old_caps_lock: true,
      switch_key: {
        Shift_L: 'commit_code',
        Shift_R: 'inline_ascii',
        Control_L: 'noop',
        Control_R: 'noop',
        Caps_Lock: 'clear',
      },
    })
  })
})

describe('serializePlatformConfig', () => {
  it('serializes app options', () => {
    const config = {
      ...DEFAULT_PLATFORM_CONFIG,
      appOptions: {
        'com.apple.Terminal': { asciiMode: true },
      },
    }
    const patch = serializePlatformConfig(config)
    expect(patch.app_options).toEqual({
      'com.apple.Terminal': { ascii_mode: true },
    })
  })
})

describe('serializePlatformConfig with style', () => {
  it('serializes theme colors as BGR integers', () => {
    const config = {
      ...DEFAULT_PLATFORM_CONFIG,
      style: {
        name: 'test',
        horizontal: true,
        fontFace: 'PingFang SC',
        fontSize: 16,
        labelFontSize: 14,
        cornerRadius: 6,
        borderWidth: 1,
        lineSpacing: 5,
        spacing: 8,
        colors: {
          backgroundColor: '#FFFFFF',
          borderColor: '#CCCCCC',
          textColor: '#000000',
          hilitedTextColor: '#FF6600',
          hilitedBackColor: '#EEEEEE',
          candidateTextColor: '#000000',
          hilitedCandidateTextColor: '#FFFFFF',
          hilitedCandidateBackColor: '#4A90D9',
          commentTextColor: '#888888',
          labelColor: '#666666',
        },
      },
    }
    const patch = serializePlatformConfig(config)
    expect(patch.style).toBeDefined()
    const style = patch.style as Record<string, unknown>
    expect(style.back_color).toBe(0xFFFFFF)
    expect(style.text_color).toBe(0x000000)
    expect(style.horizontal).toBe(true)
    expect(style.font_face).toBe('PingFang SC')
  })

  it('outputs hex format colors in YAML string', () => {
    const config = {
      ...DEFAULT_PLATFORM_CONFIG,
      style: {
        name: 'test',
        horizontal: true,
        fontFace: 'sans-serif',
        fontSize: 16,
        labelFontSize: 14,
        cornerRadius: 6,
        borderWidth: 1,
        lineSpacing: 5,
        spacing: 8,
        colors: {
          backgroundColor: '#FF0000',
          borderColor: '#CCCCCC',
          textColor: '#000000',
          hilitedTextColor: '#0000FF',
          hilitedBackColor: '#EEEEEE',
          candidateTextColor: '#000000',
          hilitedCandidateTextColor: '#FFFFFF',
          hilitedCandidateBackColor: '#4A90D9',
          commentTextColor: '#888888',
          labelColor: '#666666',
        },
      },
    }
    const patch = serializePlatformConfig(config)
    const yamlStr = buildCustomYaml(patch)
    expect(yamlStr).toContain('0x')
  })

  it('does not include style when absent', () => {
    const config = { ...DEFAULT_PLATFORM_CONFIG, appOptions: {} }
    const patch = serializePlatformConfig(config)
    expect(patch.style).toBeUndefined()
  })
})

describe('serializeSchemaConfig', () => {
  it('serializes switches', () => {
    const config: SchemaConfig = {
      schemaId: 'test',
      fuzzyRules: [],
      switches: [
        { name: 'emoji', reset: 1, states: ['关', '开'] },
      ],
    }
    const patch = serializeSchemaConfig(config)
    expect(patch.switches).toEqual([{ name: 'emoji', reset: 1, states: ['关', '开'] }])
  })

  it('serializes punctuator', () => {
    const config: SchemaConfig = {
      schemaId: 'test',
      fuzzyRules: [],
      punctuator: { halfShape: { ',': '，' } },
    }
    const patch = serializeSchemaConfig(config)
    expect(patch.punctuator).toEqual({ half_shape: { ',': '，' } })
  })

  it('returns empty patch when no switches or punctuator', () => {
    const config: SchemaConfig = { schemaId: 'test', fuzzyRules: [] }
    const patch = serializeSchemaConfig(config)
    expect(Object.keys(patch)).toHaveLength(0)
  })

  it('omits states from switch entry when undefined', () => {
    const config: SchemaConfig = {
      schemaId: 'test',
      fuzzyRules: [],
      switches: [{ name: 'ascii_mode', reset: 0 }],
    }
    const patch = serializeSchemaConfig(config)
    const switches = patch.switches as Array<Record<string, unknown>>
    expect(switches[0]).toEqual({ name: 'ascii_mode', reset: 0 })
    expect(switches[0]).not.toHaveProperty('states')
  })

  it('serializes translator config', () => {
    const config = {
      schemaId: 'wanxiang',
      fuzzyRules: [],
      translator: {
        enableCompletion: true,
        enableSentence: false,
        enableUserDict: false,
        initialQuality: 2.0,
        coreWordLength: 4,
        maxWordLength: 7,
        maxHomophones: 8,
        maxHomographs: 8,
        spellingHints: 30,
        alwaysShowComments: true,
      },
    }
    const result = serializeSchemaConfig(config)
    expect(result['translator/enable_completion']).toBe(true)
    expect(result['translator/enable_sentence']).toBe(false)
    expect(result['translator/enable_user_dict']).toBe(false)
    expect(result['translator/initial_quality']).toBe(2.0)
    expect(result['translator/core_word_length']).toBe(4)
  })

  it('serializes multi-state switches', () => {
    const config = {
      schemaId: 'test',
      fuzzyRules: [],
      switches: [
        { options: ['s2s', 's2t'], reset: 0, states: ['简体', '繁体'] },
      ],
    }
    const result = serializeSchemaConfig(config)
    const switches = result.switches as Array<Record<string, unknown>>
    expect(switches[0]).toEqual({ options: ['s2s', 's2t'], reset: 0, states: ['简体', '繁体'] })
  })
})

describe('buildCustomYaml', () => {
  it('wraps patch in a valid custom yaml structure', () => {
    const patch = { schema_list: [{ schema: 'rime_ice' }] }
    const yamlStr = buildCustomYaml(patch)
    const parsed = parse(yamlStr)
    expect(parsed.patch.schema_list).toEqual([{ schema: 'rime_ice' }])
  })
})

describe('serializeSchemaConfig — custom triggers and lua scripts', () => {
  it('emits recognizer patterns for custom triggers', () => {
    const cfg: SchemaConfig = {
      schemaId: 'test',
      fuzzyRules: [],
      specialInput: {
        enabledTriggers: [],
        customTriggers: [{
          id: 'uuid-1',
          name: 'IP 查询',
          triggerCode: '/ip',
          description: '',
          scriptId: 'script-1',
        }],
      },
      luaScripts: [{
        id: 'script-1',
        fileName: 'ip_query.lua',
        scriptType: 'translator',
        description: '',
        code: '-- lua',
      }],
    }
    const out = serializeSchemaConfig(cfg)
    const recognizerKey = Object.keys(out).find((k) =>
      k.startsWith('recognizer/patterns/') && k.endsWith('ip_query'),
    )
    expect(recognizerKey).toBeDefined()
    expect(out[recognizerKey!]).toBe('^/ip$')
  })

  it('emits lua_translator registration under engine/translators/+', () => {
    const cfg: SchemaConfig = {
      schemaId: 'test',
      fuzzyRules: [],
      luaScripts: [{
        id: 'script-1',
        fileName: 'my_t.lua',
        scriptType: 'translator',
        description: '',
        code: '',
      }],
    }
    const out = serializeSchemaConfig(cfg)
    const translatorsKey = Object.keys(out).find((k) => k.startsWith('engine/translators'))
    expect(translatorsKey).toBeDefined()
    const list = out[translatorsKey!] as string[]
    expect(list).toContain('lua_translator@my_t')
  })

  it('uses the correct engine key per script type', () => {
    const cfg: SchemaConfig = {
      schemaId: 'test',
      fuzzyRules: [],
      luaScripts: [
        { id: '1', fileName: 't.lua', scriptType: 'translator', description: '', code: '' },
        { id: '2', fileName: 'f.lua', scriptType: 'filter', description: '', code: '' },
        { id: '3', fileName: 'p.lua', scriptType: 'processor', description: '', code: '' },
      ],
    }
    const out = serializeSchemaConfig(cfg)
    const keys = Object.keys(out)
    expect(keys.some((k) => k.startsWith('engine/translators') && (out[k] as string[]).includes('lua_translator@t'))).toBe(true)
    expect(keys.some((k) => k.startsWith('engine/filters') && (out[k] as string[]).includes('lua_filter@f'))).toBe(true)
    expect(keys.some((k) => k.startsWith('engine/processors') && (out[k] as string[]).includes('lua_processor@p'))).toBe(true)
  })
})

describe('round-trip: serialize → yaml → parse', () => {
  it('preserves config through round-trip', () => {
    const original = {
      ...DEFAULT_CONFIG,
      schemaList: [{ schema: 'rime_ice' }],
      pageSize: 9,
      selectKeys: 'ASDFGHJKL',
    }
    const patch = serializeDefaultConfig(original)
    const yamlStr = buildCustomYaml(patch)
    const reparsed = parse(yamlStr)
    const expanded = expandPatchPaths(reparsed.patch)
    const result = mapToDefaultConfig(expanded, DEFAULT_CONFIG)
    expect(result.schemaList).toEqual(original.schemaList)
    expect(result.pageSize).toBe(original.pageSize)
    expect(result.selectKeys).toBe(original.selectKeys)
  })
})
