import { describe, it, expect, beforeEach } from 'vitest'
import { useConfigStore } from './config-store'
import { createEmptyProject, DEFAULT_THEME_STYLE } from '@/lib/config/defaults'

describe('useConfigStore', () => {
  beforeEach(() => {
    useConfigStore.getState().reset()
  })

  it('initializes with default project', () => {
    const state = useConfigStore.getState()
    expect(state.project.defaultConfig.pageSize).toBe(5)
    expect(state.activeModule).toBe('schema-manager')
  })

  it('setActiveModule changes the active module', () => {
    useConfigStore.getState().setActiveModule('fuzzy-pinyin')
    expect(useConfigStore.getState().activeModule).toBe('fuzzy-pinyin')
  })

  it('updateDefaultConfig merges partial updates', () => {
    useConfigStore.getState().updateDefaultConfig({ pageSize: 9 })
    const state = useConfigStore.getState()
    expect(state.project.defaultConfig.pageSize).toBe(9)
    expect(state.project.defaultConfig.schemaList).toHaveLength(1)
  })

  it('setSchemaList replaces the schema list', () => {
    useConfigStore.getState().setSchemaList([
      { schema: 'rime_ice' },
      { schema: 'double_pinyin_flypy' },
    ])
    expect(useConfigStore.getState().project.defaultConfig.schemaList).toEqual([
      { schema: 'rime_ice' },
      { schema: 'double_pinyin_flypy' },
    ])
  })

  it('setAppOption adds or updates an app option', () => {
    useConfigStore.getState().setAppOption('com.apple.Terminal', true)
    const opts = useConfigStore.getState().project.platformConfig.appOptions
    expect(opts['com.apple.Terminal']).toEqual({ asciiMode: true })
  })

  it('removeAppOption removes an app option', () => {
    useConfigStore.getState().setAppOption('com.apple.Terminal', true)
    useConfigStore.getState().removeAppOption('com.apple.Terminal')
    const opts = useConfigStore.getState().project.platformConfig.appOptions
    expect(opts['com.apple.Terminal']).toBeUndefined()
  })

  it('loadProject replaces entire project state', () => {
    const newProject = createEmptyProject()
    newProject.defaultConfig.pageSize = 7
    useConfigStore.getState().loadProject(newProject)
    expect(useConfigStore.getState().project.defaultConfig.pageSize).toBe(7)
  })

  it('setFuzzyRules sets rules for a schema', () => {
    useConfigStore.getState().setFuzzyRules('rime_ice', [
      { ruleId: 'z_zh', enabled: true },
      { ruleId: 'l_n', enabled: false },
    ])
    const rules = useConfigStore.getState().project.schemaConfigs['rime_ice']?.fuzzyRules
    expect(rules).toHaveLength(2)
    expect(rules?.[0]).toEqual({ ruleId: 'z_zh', enabled: true })
  })

  it('setSwitches sets switches for a schema', () => {
    useConfigStore.getState().setSwitches('rime_ice', [
      { name: 'emoji', reset: 1 },
    ])
    const switches = useConfigStore.getState().project.schemaConfigs['rime_ice']?.switches
    expect(switches).toEqual([{ name: 'emoji', reset: 1 }])
  })

  it('setPunctuator sets punctuator for a schema', () => {
    useConfigStore.getState().setPunctuator('rime_ice', { halfShape: { ',': '，' } })
    const p = useConfigStore.getState().project.schemaConfigs['rime_ice']?.punctuator
    expect(p).toEqual({ halfShape: { ',': '，' } })
  })

  it('addCustomPhrase adds a phrase', () => {
    useConfigStore.getState().addCustomPhrase({ text: '你好', code: 'nihao', weight: 1 })
    expect(useConfigStore.getState().project.customPhrases).toHaveLength(1)
  })

  it('removeCustomPhrase removes by index', () => {
    useConfigStore.getState().addCustomPhrase({ text: '你好', code: 'nihao', weight: 1 })
    useConfigStore.getState().addCustomPhrase({ text: '世界', code: 'shijie', weight: 2 })
    useConfigStore.getState().removeCustomPhrase(0)
    const phrases = useConfigStore.getState().project.customPhrases
    expect(phrases).toHaveLength(1)
    expect(phrases[0]!.text).toBe('世界')
  })

  it('updateCustomPhrase updates a phrase at index', () => {
    useConfigStore.getState().addCustomPhrase({ text: '你好', code: 'nihao', weight: 1 })
    useConfigStore.getState().updateCustomPhrase(0, { text: '再见', code: 'zaijian', weight: 5 })
    const phrases = useConfigStore.getState().project.customPhrases
    expect(phrases[0]).toEqual({ text: '再见', code: 'zaijian', weight: 5 })
  })

  it('setCustomPhrases replaces all phrases', () => {
    useConfigStore.getState().setCustomPhrases([
      { text: 'a', code: 'a', weight: 1 },
      { text: 'b', code: 'b', weight: 2 },
    ])
    expect(useConfigStore.getState().project.customPhrases).toHaveLength(2)
  })

  it('setThemeStyle sets the theme', () => {
    const theme = { ...DEFAULT_THEME_STYLE, name: 'test' }
    useConfigStore.getState().setThemeStyle(theme)
    expect(useConfigStore.getState().project.platformConfig.style?.name).toBe('test')
    expect(useConfigStore.getState().isDirty).toBe(true)
  })

  it('updateThemeColors merges color changes', () => {
    useConfigStore.getState().setThemeStyle(structuredClone(DEFAULT_THEME_STYLE))
    useConfigStore.getState().updateThemeColors({ backgroundColor: '#FF0000' })
    expect(useConfigStore.getState().project.platformConfig.style?.colors.backgroundColor).toBe('#FF0000')
    expect(useConfigStore.getState().project.platformConfig.style?.colors.textColor).toBe('#000000')
  })

  it('updateThemeColors does nothing when no style set', () => {
    useConfigStore.getState().updateThemeColors({ backgroundColor: '#FF0000' })
    expect(useConfigStore.getState().project.platformConfig.style).toBeUndefined()
  })

  it('updateThemeLayout merges layout changes', () => {
    useConfigStore.getState().setThemeStyle(structuredClone(DEFAULT_THEME_STYLE))
    useConfigStore.getState().updateThemeLayout({ horizontal: true, fontSize: 20 })
    expect(useConfigStore.getState().project.platformConfig.style?.horizontal).toBe(true)
    expect(useConfigStore.getState().project.platformConfig.style?.fontSize).toBe(20)
  })

  it('updateThemeLayout does nothing when no style set', () => {
    useConfigStore.getState().updateThemeLayout({ horizontal: true })
    expect(useConfigStore.getState().project.platformConfig.style).toBeUndefined()
  })

  describe('custom triggers', () => {
    beforeEach(() => {
      useConfigStore.getState().setSchemaList([{ schema: 'rime_ice' }])
    })

    it('addCustomTrigger appends a trigger with a generated id', () => {
      useConfigStore.getState().addCustomTrigger('rime_ice', {
        name: 'IP 查询',
        triggerCode: '/ip',
        description: '查询本机 IP',
        scriptId: 'script-1',
      })
      const triggers = useConfigStore.getState().project.schemaConfigs['rime_ice']?.specialInput?.customTriggers
      expect(triggers).toHaveLength(1)
      expect(triggers?.[0]?.name).toBe('IP 查询')
      expect(triggers?.[0]?.id).toBeTruthy()
    })

    it('updateCustomTrigger modifies fields', () => {
      useConfigStore.getState().addCustomTrigger('rime_ice', {
        name: 'old', triggerCode: '/a', description: '', scriptId: 's',
      })
      const id = useConfigStore.getState().project.schemaConfigs['rime_ice']!.specialInput!.customTriggers[0]!.id
      useConfigStore.getState().updateCustomTrigger('rime_ice', id, { name: 'new' })
      const updated = useConfigStore.getState().project.schemaConfigs['rime_ice']!.specialInput!.customTriggers[0]!
      expect(updated.name).toBe('new')
    })

    it('deleteCustomTrigger removes the trigger', () => {
      useConfigStore.getState().addCustomTrigger('rime_ice', {
        name: 'x', triggerCode: '/x', description: '', scriptId: 's',
      })
      const id = useConfigStore.getState().project.schemaConfigs['rime_ice']!.specialInput!.customTriggers[0]!.id
      useConfigStore.getState().deleteCustomTrigger('rime_ice', id)
      expect(useConfigStore.getState().project.schemaConfigs['rime_ice']!.specialInput!.customTriggers).toHaveLength(0)
    })
  })

  describe('lua scripts', () => {
    beforeEach(() => {
      useConfigStore.getState().setSchemaList([{ schema: 'rime_ice' }])
    })

    it('addLuaScript appends a script with a generated id', () => {
      useConfigStore.getState().addLuaScript('rime_ice', {
        fileName: 'my_translator.lua',
        scriptType: 'translator',
        description: 'test script',
        code: '-- code',
      })
      const scripts = useConfigStore.getState().project.schemaConfigs['rime_ice']?.luaScripts
      expect(scripts).toHaveLength(1)
      expect(scripts?.[0]?.fileName).toBe('my_translator.lua')
      expect(scripts?.[0]?.id).toBeTruthy()
    })

    it('updateLuaScript modifies fields', () => {
      useConfigStore.getState().addLuaScript('rime_ice', {
        fileName: 'a.lua', scriptType: 'filter', description: '', code: '-- a',
      })
      const id = useConfigStore.getState().project.schemaConfigs['rime_ice']!.luaScripts![0]!.id
      useConfigStore.getState().updateLuaScript('rime_ice', id, { code: '-- b' })
      expect(useConfigStore.getState().project.schemaConfigs['rime_ice']!.luaScripts![0]!.code).toBe('-- b')
    })

    it('deleteLuaScript removes the script', () => {
      useConfigStore.getState().addLuaScript('rime_ice', {
        fileName: 'x.lua', scriptType: 'processor', description: '', code: '',
      })
      const id = useConfigStore.getState().project.schemaConfigs['rime_ice']!.luaScripts![0]!.id
      useConfigStore.getState().deleteLuaScript('rime_ice', id)
      expect(useConfigStore.getState().project.schemaConfigs['rime_ice']!.luaScripts).toHaveLength(0)
    })
  })
})
