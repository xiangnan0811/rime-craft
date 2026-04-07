import type { DefaultConfig, PlatformConfig, RimeProject } from '@/types/config'

export const DEFAULT_CONFIG: DefaultConfig = {
  schemaList: [{ schema: 'luna_pinyin' }],
  pageSize: 5,
  selectKeys: '1234567890',
  asciiComposer: {
    goodOldCapsLock: true,
    switchKey: {
      shiftL: 'inline_ascii',
      shiftR: 'commit_text',
      controlL: 'noop',
      controlR: 'noop',
      capsLock: 'clear',
    },
  },
  keyBinder: {
    bindings: [],
  },
}

export const DEFAULT_PLATFORM_CONFIG: PlatformConfig = {
  platform: 'macos',
  appOptions: {},
}

export function createEmptyProject(): RimeProject {
  return {
    targetPlatform: 'macos',
    defaultConfig: structuredClone(DEFAULT_CONFIG),
    platformConfig: structuredClone(DEFAULT_PLATFORM_CONFIG),
    schemaConfigs: {},
    customPhrases: [],
    preserved: {},
  }
}
