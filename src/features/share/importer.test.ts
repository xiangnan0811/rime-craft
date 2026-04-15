import { describe, it, expect } from 'vitest'
import { importFromYamlString, importFromFiles } from './importer'

describe('importFromYamlString', () => {
  it('parses default.custom.yaml and sets defaultConfig fields', () => {
    const yaml = `patch:
  "menu/page_size": 9
  "menu/alternative_select_keys": "ASDFGHJKL"
  schema_list:
    - schema: rime_ice
`
    const result = importFromYamlString(yaml, 'default.custom.yaml')
    expect(result.project.defaultConfig.pageSize).toBe(9)
    expect(result.project.defaultConfig.selectKeys).toBe('ASDFGHJKL')
    expect(result.project.defaultConfig.schemaList).toEqual([{ schema: 'rime_ice' }])
    expect(result.summary.filesProcessed).toBe(1)
    expect(result.summary.errors).toHaveLength(0)
  })

  it('parses squirrel.custom.yaml and sets platform to macos', () => {
    const yaml = `patch:
  app_options:
    com.apple.Terminal:
      ascii_mode: true
`
    const result = importFromYamlString(yaml, 'squirrel.custom.yaml')
    expect(result.project.targetPlatform).toBe('macos')
    expect(result.project.platformConfig.platform).toBe('macos')
    expect(result.project.platformConfig.appOptions['com.apple.Terminal']).toEqual({
      asciiMode: true,
    })
  })

  it('parses weasel.custom.yaml and sets platform to windows', () => {
    const yaml = `patch:
  app_options:
    cmd.exe:
      ascii_mode: true
`
    const result = importFromYamlString(yaml, 'weasel.custom.yaml')
    expect(result.project.targetPlatform).toBe('windows')
    expect(result.project.platformConfig.platform).toBe('windows')
  })

  it('parses luna_pinyin.custom.yaml and sets schemaConfigs', () => {
    const yaml = `patch:
  switches:
    - name: emoji
      reset: 1
      states:
        - "关"
        - "开"
`
    const result = importFromYamlString(yaml, 'luna_pinyin.custom.yaml')
    const schemaConfig = result.project.schemaConfigs['luna_pinyin']
    expect(schemaConfig).toBeDefined()
    expect(schemaConfig!.schemaId).toBe('luna_pinyin')
    expect(schemaConfig!.switches).toHaveLength(1)
    expect(schemaConfig!.switches![0]).toMatchObject({ name: 'emoji', reset: 1 })
  })

  it('handles malformed YAML without crashing and reports errors', () => {
    const yaml = 'not: valid: yaml: {{'
    const result = importFromYamlString(yaml, 'default.custom.yaml')
    expect(result.summary.errors.length).toBeGreaterThan(0)
    expect(result.project).toBeDefined()
  })

  it('handles YAML with no patch key gracefully', () => {
    const yaml = 'some_key: value'
    const result = importFromYamlString(yaml, 'default.custom.yaml')
    expect(result.summary.errors).toHaveLength(0)
    expect(result.summary.customSettings).toBe(0)
  })
})

describe('importFromFiles', () => {
  it('merges multiple files correctly', () => {
    const files = [
      {
        name: 'default.custom.yaml',
        content: `patch:
  "menu/page_size": 7
  schema_list:
    - schema: luna_pinyin
`,
      },
      {
        name: 'squirrel.custom.yaml',
        content: `patch:
  app_options:
    com.apple.Terminal:
      ascii_mode: true
`,
      },
      {
        name: 'luna_pinyin.custom.yaml',
        content: `patch:
  switches:
    - name: emoji
      reset: 1
`,
      },
    ]
    const result = importFromFiles(files)
    expect(result.summary.filesProcessed).toBe(3)
    expect(result.summary.errors).toHaveLength(0)
    expect(result.project.defaultConfig.pageSize).toBe(7)
    expect(result.project.targetPlatform).toBe('macos')
    expect(result.project.schemaConfigs['luna_pinyin']).toBeDefined()
  })

  it('accumulates errors from multiple files', () => {
    const files = [
      { name: 'default.custom.yaml', content: 'bad: yaml: {{' },
      { name: 'squirrel.custom.yaml', content: 'also: bad: {{' },
    ]
    const result = importFromFiles(files)
    expect(result.summary.errors.length).toBe(2)
  })
})
