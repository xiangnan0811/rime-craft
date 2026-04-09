export type AppCategory =
  | 'terminal'
  | 'editor'
  | 'ide'
  | 'browser'
  | 'communication'
  | 'office'
  | 'other'

export interface AppEntry {
  id: string
  name: string
  aliases?: string[]
  icon?: string
  platforms: {
    macos?: string
    windows?: string
    linux?: string
  }
  category: AppCategory
}

export const APP_DATABASE: AppEntry[] = [
  // Terminal
  {
    id: 'terminal',
    name: 'Terminal',
    aliases: ['终端'],
    platforms: { macos: 'com.apple.Terminal' },
    category: 'terminal',
  },
  {
    id: 'iterm2',
    name: 'iTerm2',
    platforms: { macos: 'com.googlecode.iterm2' },
    category: 'terminal',
  },
  {
    id: 'windows-terminal',
    name: 'Windows Terminal',
    platforms: { windows: 'WindowsTerminal.exe' },
    category: 'terminal',
  },
  {
    id: 'alacritty',
    name: 'Alacritty',
    platforms: {
      macos: 'org.alacritty',
      windows: 'alacritty.exe',
      linux: 'Alacritty',
    },
    category: 'terminal',
  },
  {
    id: 'warp',
    name: 'Warp',
    platforms: { macos: 'dev.warp.Warp-Stable' },
    category: 'terminal',
  },

  // Editor
  {
    id: 'vscode',
    name: 'VS Code',
    platforms: {
      macos: 'com.microsoft.VSCode',
      windows: 'Code.exe',
      linux: 'code',
    },
    category: 'editor',
  },
  {
    id: 'sublime-text',
    name: 'Sublime Text',
    platforms: {
      macos: 'com.sublimetext.4',
      windows: 'sublime_text.exe',
      linux: 'sublime_text',
    },
    category: 'editor',
  },

  // IDE
  {
    id: 'intellij',
    name: 'IntelliJ IDEA',
    platforms: {
      macos: 'com.jetbrains.intellij',
      windows: 'idea64.exe',
      linux: 'jetbrains-idea',
    },
    category: 'ide',
  },
  {
    id: 'webstorm',
    name: 'WebStorm',
    platforms: {
      macos: 'com.jetbrains.WebStorm',
      windows: 'webstorm64.exe',
      linux: 'jetbrains-webstorm',
    },
    category: 'ide',
  },
  {
    id: 'pycharm',
    name: 'PyCharm',
    platforms: {
      macos: 'com.jetbrains.pycharm',
      windows: 'pycharm64.exe',
      linux: 'jetbrains-pycharm',
    },
    category: 'ide',
  },
  {
    id: 'xcode',
    name: 'Xcode',
    platforms: { macos: 'com.apple.dt.Xcode' },
    category: 'ide',
  },
  {
    id: 'android-studio',
    name: 'Android Studio',
    platforms: {
      macos: 'com.google.android.studio',
      windows: 'studio64.exe',
      linux: 'android-studio',
    },
    category: 'ide',
  },

  // Browser
  {
    id: 'chrome',
    name: 'Chrome',
    aliases: ['谷歌浏览器'],
    platforms: {
      macos: 'com.google.Chrome',
      windows: 'chrome.exe',
      linux: 'google-chrome',
    },
    category: 'browser',
  },
  {
    id: 'firefox',
    name: 'Firefox',
    aliases: ['火狐浏览器'],
    platforms: {
      macos: 'org.mozilla.firefox',
      windows: 'firefox.exe',
      linux: 'firefox',
    },
    category: 'browser',
  },
  {
    id: 'safari',
    name: 'Safari',
    platforms: { macos: 'com.apple.Safari' },
    category: 'browser',
  },
  {
    id: 'arc',
    name: 'Arc',
    platforms: {
      macos: 'company.thebrowser.Browser',
      windows: 'Arc.exe',
    },
    category: 'browser',
  },

  // Communication
  {
    id: 'wechat',
    name: 'WeChat',
    aliases: ['微信'],
    platforms: {
      macos: 'com.tencent.xinWeChat',
      windows: 'WeChat.exe',
    },
    category: 'communication',
  },
  {
    id: 'telegram',
    name: 'Telegram',
    aliases: ['电报'],
    platforms: {
      macos: 'ru.keepcoder.Telegram',
      windows: 'Telegram.exe',
      linux: 'telegram-desktop',
    },
    category: 'communication',
  },

  // Office
  {
    id: 'wps',
    name: 'WPS Office',
    platforms: {
      macos: 'com.kingsoft.wpsoffice.mac',
      windows: 'wps.exe',
      linux: 'wps',
    },
    category: 'office',
  },

  // Other
  {
    id: 'raycast',
    name: 'Raycast',
    platforms: { macos: 'com.raycast.macos' },
    category: 'other',
  },
]

export const CATEGORY_LABELS: Record<AppCategory, string> = {
  terminal: '终端工具',
  editor: '编辑器',
  ide: 'IDE',
  browser: '浏览器',
  communication: '通讯',
  office: '办公',
  other: '其他',
}

type Platform = 'macos' | 'windows' | 'linux'

/**
 * Returns apps available on the given platform, optionally excluding
 * apps whose platform identifier appears in `configuredAppOptions`.
 */
export function getAppsForPlatform(
  platform: Platform,
  configuredAppOptions?: Record<string, unknown>,
): AppEntry[] {
  return APP_DATABASE.filter((app) => {
    const identifier = app.platforms[platform]
    if (identifier === undefined) return false
    if (configuredAppOptions && identifier in configuredAppOptions) return false
    return true
  })
}

/**
 * Search apps by query string, matching against name, platform identifier,
 * Chinese aliases, and category. Results are filtered to the given platform.
 */
export function searchApps(query: string, platform: Platform): AppEntry[] {
  const q = query.toLowerCase()
  return APP_DATABASE.filter((app) => {
    if (app.platforms[platform] === undefined) return false

    if (app.name.toLowerCase().includes(q)) return true

    const identifier = app.platforms[platform]
    if (identifier !== undefined && identifier.toLowerCase().includes(q))
      return true

    if (app.aliases?.some((alias) => alias.toLowerCase().includes(q)))
      return true

    if (app.category.toLowerCase().includes(q)) return true

    return false
  })
}

/**
 * Returns the platform-specific identifier for an app, or undefined
 * if the app does not support the given platform.
 */
export function getAppIdentifier(
  app: AppEntry,
  platform: Platform
): string | undefined {
  return app.platforms[platform]
}
