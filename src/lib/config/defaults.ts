import type { DefaultConfig, PlatformConfig, RimeProject, ThemeStyle } from '@/types/config'

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

export const DEFAULT_THEME_STYLE: ThemeStyle = {
  name: 'default',
  horizontal: false,
  fontFace: 'sans-serif',
  fontSize: 16,
  labelFontSize: 14,
  cornerRadius: 6,
  borderWidth: 1,
  lineSpacing: 5,
  spacing: 8,
  colors: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CCCCCC',
    textColor: '#000000',
    hilitedTextColor: '#0000FF',
    hilitedBackColor: '#EEEEEE',
    candidateTextColor: '#000000',
    hilitedCandidateTextColor: '#FFFFFF',
    hilitedCandidateBackColor: '#4A90D9',
    commentTextColor: '#888888',
    labelColor: '#666666',
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
