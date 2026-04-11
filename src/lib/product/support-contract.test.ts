import { describe, expect, it } from 'vitest'

import {
  FORMAL_EDITOR_PLATFORM_SPECS,
  FORMAL_EDITOR_PLATFORMS,
  getFormalPlatformFileName,
  RIME_ECOSYSTEM_PLATFORMS,
  getFormalPlatformLabel,
  isFormalEditorPlatform,
} from './support-contract'

describe('support contract', () => {
  it('exposes the formal editor platforms', () => {
    expect(FORMAL_EDITOR_PLATFORMS).toEqual(['macos', 'windows'])
  })

  it('identifies supported formal editor platforms', () => {
    expect(isFormalEditorPlatform('macos')).toBe(true)
    expect(isFormalEditorPlatform('windows')).toBe(true)
    expect(isFormalEditorPlatform('linux')).toBe(false)
    expect(isFormalEditorPlatform('android')).toBe(false)
    expect(isFormalEditorPlatform('ios')).toBe(false)
  })

  it('exposes the wider rime ecosystem platform list', () => {
    expect(RIME_ECOSYSTEM_PLATFORMS).toEqual([
      'macOS',
      'Windows',
      'Linux',
      'Android',
      'iOS',
    ])
  })

  it('exposes the runtime metadata for the formal editor platforms', () => {
    expect(FORMAL_EDITOR_PLATFORM_SPECS).toEqual([
      {
        id: 'macos',
        name: 'macOS',
        description: '鼠须管 (Squirrel)',
        label: 'macOS（Squirrel）',
        fileName: 'squirrel.custom.yaml',
      },
      {
        id: 'windows',
        name: 'Windows',
        description: '小狼毫 (Weasel)',
        label: 'Windows（Weasel）',
        fileName: 'weasel.custom.yaml',
      },
    ])
  })

  it('returns the formal platform labels', () => {
    expect(getFormalPlatformLabel('macos')).toBe('macOS（Squirrel）')
    expect(getFormalPlatformLabel('windows')).toBe('Windows（Weasel）')
  })

  it('returns the formal export file name for each supported platform', () => {
    expect(getFormalPlatformFileName('macos')).toBe('squirrel.custom.yaml')
    expect(getFormalPlatformFileName('windows')).toBe('weasel.custom.yaml')
  })
})
