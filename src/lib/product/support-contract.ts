import type { Platform } from '@/types/config'

export const FORMAL_EDITOR_PLATFORM_SPECS = [
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
] as const

export type FormalEditorPlatform =
  (typeof FORMAL_EDITOR_PLATFORM_SPECS)[number]['id']

export const FORMAL_EDITOR_PLATFORMS: readonly FormalEditorPlatform[] =
  FORMAL_EDITOR_PLATFORM_SPECS.map((platform) => platform.id)

export const RIME_ECOSYSTEM_PLATFORMS = [
  'macOS',
  'Windows',
  'Linux',
  'Android',
  'iOS',
] as const

export function isFormalEditorPlatform(
  platform: Platform,
): platform is FormalEditorPlatform {
  return platform === 'macos' || platform === 'windows'
}

export function getFormalPlatformSpec(platform: FormalEditorPlatform) {
  const spec = FORMAL_EDITOR_PLATFORM_SPECS.find((item) => item.id === platform)

  if (!spec) {
    throw new Error(`Unsupported formal editor platform: ${platform}`)
  }

  return spec
}

export function getFormalPlatformLabel(platform: FormalEditorPlatform): string {
  return getFormalPlatformSpec(platform).label
}

export function getFormalPlatformFileName(
  platform: FormalEditorPlatform,
): string {
  return getFormalPlatformSpec(platform).fileName
}
