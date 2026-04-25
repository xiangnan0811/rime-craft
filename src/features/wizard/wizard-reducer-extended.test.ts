import { describe, it, expect } from 'vitest'
import { wizardReducer, type WizardState } from './wizard-state'

function createBaseState(overrides?: Partial<WizardState>): WizardState {
  return {
    step: 0,
    platform: 'macos',
    schemaId: 'rime_ice',
    pageSize: 9,
    shiftLBehavior: 'commit_code',
    asciiModeApps: [],
    themeName: 'Rime 默认',
    ...overrides,
  }
}

describe('wizardReducer extended cases', () => {
  describe('SET_STEP', () => {
    it('changes the step to the specified value', () => {
      const state = createBaseState({ step: 0 })
      const result = wizardReducer(state, { type: 'SET_STEP', step: 3 })
      expect(result.step).toBe(3)
    })

    it('preserves all other state fields when step changes', () => {
      const state = createBaseState({ step: 1, schemaId: 'double_pinyin_flypy' })
      const result = wizardReducer(state, { type: 'SET_STEP', step: 2 })
      expect(result.step).toBe(2)
      expect(result.schemaId).toBe('double_pinyin_flypy')
      expect(result.platform).toBe('macos')
    })

    it('allows navigating back to step 0', () => {
      const state = createBaseState({ step: 3 })
      const result = wizardReducer(state, { type: 'SET_STEP', step: 0 })
      expect(result.step).toBe(0)
    })
  })

  describe('SET_SCHEMA', () => {
    it('updates schemaId', () => {
      const state = createBaseState()
      const result = wizardReducer(state, { type: 'SET_SCHEMA', schemaId: 'double_pinyin_flypy' })
      expect(result.schemaId).toBe('double_pinyin_flypy')
    })

    it('preserves other state fields', () => {
      const state = createBaseState({ pageSize: 7, platform: 'windows' })
      const result = wizardReducer(state, { type: 'SET_SCHEMA', schemaId: 'wubi' })
      expect(result.schemaId).toBe('wubi')
      expect(result.pageSize).toBe(7)
      expect(result.platform).toBe('windows')
    })
  })

  describe('SET_PAGE_SIZE', () => {
    it('updates pageSize', () => {
      const state = createBaseState({ pageSize: 5 })
      const result = wizardReducer(state, { type: 'SET_PAGE_SIZE', pageSize: 7 })
      expect(result.pageSize).toBe(7)
    })

    it('preserves other state fields', () => {
      const state = createBaseState({ schemaId: 'rime_ice', themeName: 'Nord' })
      const result = wizardReducer(state, { type: 'SET_PAGE_SIZE', pageSize: 3 })
      expect(result.pageSize).toBe(3)
      expect(result.schemaId).toBe('rime_ice')
      expect(result.themeName).toBe('Nord')
    })
  })

  describe('SET_THEME', () => {
    it('updates themeName', () => {
      const state = createBaseState({ themeName: 'Rime 默认' })
      const result = wizardReducer(state, { type: 'SET_THEME', themeName: 'Dracula' })
      expect(result.themeName).toBe('Dracula')
    })

    it('preserves other state fields', () => {
      const state = createBaseState({ step: 3, pageSize: 7 })
      const result = wizardReducer(state, { type: 'SET_THEME', themeName: 'Nord' })
      expect(result.themeName).toBe('Nord')
      expect(result.step).toBe(3)
      expect(result.pageSize).toBe(7)
    })
  })

  describe('SET_PLATFORM', () => {
    it('returns the same reference when platform is unchanged', () => {
      const state = createBaseState({ platform: 'macos' })
      const result = wizardReducer(state, { type: 'SET_PLATFORM', platform: 'macos' })
      expect(result).toBe(state)
    })

    it('resets asciiModeApps when platform changes', () => {
      const state = createBaseState({ platform: 'macos', asciiModeApps: ['com.apple.Terminal'] })
      const result = wizardReducer(state, { type: 'SET_PLATFORM', platform: 'windows' })
      expect(result.platform).toBe('windows')
      // asciiModeApps should be regenerated for the new platform
      expect(result.asciiModeApps).not.toEqual(state.asciiModeApps)
    })
  })
})
