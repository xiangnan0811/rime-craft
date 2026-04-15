import { describe, it, expect } from 'vitest'
import type { PlatformConfig, SchemaConfig, ThemeStyle } from '@/types/config'
import { DEFAULT_PLATFORM_CONFIG } from '@/lib/config/defaults'
import {
  serializePlatformConfig,
  serializeSchemaConfig,
  buildCustomYaml,
} from './serializer'
import {
  parseCustomYaml,
  expandPatchPaths,
  mapToPlatformConfig,
  mapToSchemaConfig,
} from './parser'

describe('YAML round-trip: theme colors', () => {
  it('preserves theme colors through serialize -> parse -> map', () => {
    const style: ThemeStyle = {
      name: 'my-theme',
      horizontal: true,
      fontFace: 'PingFang SC',
      fontSize: 18,
      labelFontSize: 12,
      cornerRadius: 8,
      borderWidth: 2,
      lineSpacing: 4,
      spacing: 10,
      colors: {
        backgroundColor: '#FF0000',
        borderColor: '#00FF00',
        textColor: '#0000FF',
        hilitedTextColor: '#FFFF00',
        hilitedBackColor: '#FF00FF',
        candidateTextColor: '#00FFFF',
        hilitedCandidateTextColor: '#FFFFFF',
        hilitedCandidateBackColor: '#000000',
        commentTextColor: '#888888',
        labelColor: '#666666',
      },
    }

    const platformConfig: PlatformConfig = {
      platform: 'macos',
      style,
      appOptions: {},
    }

    const patch = serializePlatformConfig(platformConfig)
    const yaml = buildCustomYaml(patch)
    const { patch: parsed } = parseCustomYaml(yaml)
    const expanded = expandPatchPaths(parsed)
    const recovered = mapToPlatformConfig(expanded, DEFAULT_PLATFORM_CONFIG)

    expect(recovered.style).toBeDefined()
    expect(recovered.style!.name).toBe('my-theme')
    expect(recovered.style!.horizontal).toBe(true)
    expect(recovered.style!.fontFace).toBe('PingFang SC')
    expect(recovered.style!.fontSize).toBe(18)

    // Color values go through hex -> BGR int -> hex conversion so we compare
    // case-insensitively since the format may differ slightly.
    const originalColors = style.colors
    const recoveredColors = recovered.style!.colors
    for (const key of Object.keys(originalColors) as (keyof typeof originalColors)[]) {
      expect(recoveredColors[key].toUpperCase()).toBe(
        originalColors[key].toUpperCase(),
      )
    }
  })
})

describe('YAML round-trip: fuzzy rules', () => {
  it('preserves enabled fuzzy rules through serialize -> parse -> map', () => {
    // Use rules with unique algebra signatures so the parser can recover them.
    // Rules like z_zh/c_ch/s_sh share the same algebra rules, and
    // an_ang/en_eng/in_ing also share, so the parser skips ambiguous ones.
    // l_n and ian_iang each have unique algebra signatures.
    const schemaConfig: SchemaConfig = {
      schemaId: 'test_schema',
      fuzzyRules: [
        { ruleId: 'l_n', enabled: true },
        { ruleId: 'ian_iang', enabled: true },
        { ruleId: 'f_h', enabled: false },
      ],
    }

    const patch = serializeSchemaConfig(schemaConfig)
    const yaml = buildCustomYaml(patch)
    const { patch: parsed } = parseCustomYaml(yaml)
    const expanded = expandPatchPaths(parsed)
    const recovered = mapToSchemaConfig(expanded, 'test_schema')

    expect(recovered.fuzzyRules).toBeDefined()
    const recoveredIds = recovered.fuzzyRules!.map((r) => r.ruleId)
    expect(recoveredIds).toContain('l_n')
    expect(recoveredIds).toContain('ian_iang')
    // Disabled rules (f_h) should not appear in serialized output
    expect(recoveredIds).not.toContain('f_h')
  })
})

describe('YAML round-trip: switches', () => {
  it('preserves binary switches through serialize -> parse -> map', () => {
    const schemaConfig: SchemaConfig = {
      schemaId: 'test_schema',
      fuzzyRules: [],
      switches: [
        { name: 'emoji', reset: 1, states: ['关', '开'] },
        { name: 'full_shape', reset: 0, states: ['半角', '全角'] },
      ],
    }

    const patch = serializeSchemaConfig(schemaConfig)
    const yaml = buildCustomYaml(patch)
    const { patch: parsed } = parseCustomYaml(yaml)
    const expanded = expandPatchPaths(parsed)
    const recovered = mapToSchemaConfig(expanded, 'test_schema')

    expect(recovered.switches).toBeDefined()
    expect(recovered.switches).toHaveLength(2)

    const emojiSwitch = recovered.switches!.find(
      (s) => 'name' in s && s.name === 'emoji',
    )
    expect(emojiSwitch).toBeDefined()
    expect(emojiSwitch!.reset).toBe(1)

    const fullShapeSwitch = recovered.switches!.find(
      (s) => 'name' in s && s.name === 'full_shape',
    )
    expect(fullShapeSwitch).toBeDefined()
    expect(fullShapeSwitch!.reset).toBe(0)
  })

  it('preserves multi-state switches through serialize -> parse -> map', () => {
    const schemaConfig: SchemaConfig = {
      schemaId: 'test_schema',
      fuzzyRules: [],
      switches: [
        {
          options: ['s2s', 's2t', 's2hk', 's2tw'],
          reset: 2,
          states: ['简体', '通繁', '港繁', '臺繁'],
        },
      ],
    }

    const patch = serializeSchemaConfig(schemaConfig)
    const yaml = buildCustomYaml(patch)
    const { patch: parsed } = parseCustomYaml(yaml)
    const expanded = expandPatchPaths(parsed)
    const recovered = mapToSchemaConfig(expanded, 'test_schema')

    expect(recovered.switches).toBeDefined()
    expect(recovered.switches).toHaveLength(1)
    const ms = recovered.switches![0]!
    expect('options' in ms).toBe(true)
    if ('options' in ms) {
      expect(ms.options).toEqual(['s2s', 's2t', 's2hk', 's2tw'])
      expect(ms.reset).toBe(2)
      expect(ms.states).toEqual(['简体', '通繁', '港繁', '臺繁'])
    }
  })
})

describe('YAML round-trip: punctuator', () => {
  it('preserves half-shape punctuation through serialize -> parse -> map', () => {
    const schemaConfig: SchemaConfig = {
      schemaId: 'test_schema',
      fuzzyRules: [],
      punctuator: {
        halfShape: {
          ',': '\uFF0C',
          '.': '\u3002',
          '/': ['/', '\u00F7'],
          '?': '\uFF1F',
        },
      },
    }

    const patch = serializeSchemaConfig(schemaConfig)
    const yaml = buildCustomYaml(patch)
    const { patch: parsed } = parseCustomYaml(yaml)
    const expanded = expandPatchPaths(parsed)
    const recovered = mapToSchemaConfig(expanded, 'test_schema')

    expect(recovered.punctuator).toBeDefined()
    expect(recovered.punctuator!.halfShape[',']).toBe('\uFF0C')
    expect(recovered.punctuator!.halfShape['.']).toBe('\u3002')
    expect(recovered.punctuator!.halfShape['/']).toEqual(['/', '\u00F7'])
    expect(recovered.punctuator!.halfShape['?']).toBe('\uFF1F')
  })
})
