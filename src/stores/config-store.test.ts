import { describe, it, expect, beforeEach } from 'vitest'
import { useConfigStore } from './config-store'
import { createEmptyProject } from '@/lib/config/defaults'

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
})
