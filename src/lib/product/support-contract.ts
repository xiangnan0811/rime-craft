import type { Platform } from '@/types/config'

export const FORMAL_EDITOR_PLATFORMS = ['macos', 'windows'] as const

export type FormalEditorPlatform = (typeof FORMAL_EDITOR_PLATFORMS)[number]

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

export function getFormalPlatformLabel(platform: FormalEditorPlatform): string {
  switch (platform) {
    case 'macos':
      return 'macOS（Squirrel）'
    case 'windows':
      return 'Windows（Weasel）'
  }
}
