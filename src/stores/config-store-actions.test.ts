import { describe, it, expect, beforeEach } from 'vitest'
import { useConfigStore } from './config-store'

describe('config store — untested actions', () => {
  beforeEach(() => {
    useConfigStore.getState().reset()
  })

  describe('clearWorkspace', () => {
    it('resets project to empty state', () => {
      useConfigStore.getState().setSchemaList([{ schema: 'luna_pinyin' }])
      expect(useConfigStore.getState().project.defaultConfig.schemaList).toHaveLength(1)

      useConfigStore.getState().clearWorkspace()
      const after = useConfigStore.getState()
      expect(after.project.defaultConfig.schemaList).toHaveLength(1)
      expect(after.isDirty).toBe(false)
      expect(after.activeModule).toBe('schema-manager')
    })

    it('rebuilds source files from empty project', () => {
      useConfigStore.getState().clearWorkspace()
      const { sourceFiles } = useConfigStore.getState()
      expect(Object.keys(sourceFiles).length).toBeGreaterThan(0)
    })
  })

  describe('setTargetPlatform', () => {
    it('changes the target platform', () => {
      useConfigStore.getState().setTargetPlatform('windows')
      expect(useConfigStore.getState().project.targetPlatform).toBe('windows')
    })

    it('marks as dirty', () => {
      useConfigStore.getState().setTargetPlatform('windows')
      expect(useConfigStore.getState().isDirty).toBe(true)
    })
  })

  describe('updateSchemaConfig', () => {
    it('merges partial update into schema config', () => {
      useConfigStore.getState().setSchemaList([{ schema: 'luna_pinyin' }])
      useConfigStore.getState().updateSchemaConfig('luna_pinyin', {
        spellingScheme: 'flypy',
      })
      const config = useConfigStore.getState().project.schemaConfigs['luna_pinyin']
      expect(config?.spellingScheme).toBe('flypy')
    })

    it('creates schema config if it did not exist', () => {
      useConfigStore.getState().updateSchemaConfig('new_schema', {
        fuzzyRules: [{ ruleId: 'zh_z', enabled: true }],
      })
      const config = useConfigStore.getState().project.schemaConfigs['new_schema']
      expect(config?.fuzzyRules).toHaveLength(1)
    })
  })

  describe('setViewMode', () => {
    it('changes view mode without setting isDirty', () => {
      useConfigStore.getState().setViewMode('immersive')
      const state = useConfigStore.getState()
      expect(state.editorUI.viewMode).toBe('immersive')
      expect(state.isDirty).toBe(false)
    })
  })

  describe('setTutorialCollapsed', () => {
    it('changes tutorial collapsed without setting isDirty', () => {
      useConfigStore.getState().setTutorialCollapsed(true)
      const state = useConfigStore.getState()
      expect(state.editorUI.tutorialCollapsed).toBe(true)
      expect(state.isDirty).toBe(false)
    })
  })
})
