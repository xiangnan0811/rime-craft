# App Selector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the manual bundle ID input with a searchable app selector Dialog that supports preset apps, local file picking, and terminal command helpers across macOS, Windows, and Linux.

**Architecture:** New data layer (`app-database.ts`) provides a searchable preset app catalog. New utility module (`app-identifier.ts`) handles cross-platform file parsing (Info.plist XML, .exe filename, .desktop INI). A new `AppSelectorDialog` component composes search, grid, local picker, and manual input into a progressive Dialog. The existing `AsciiMode.tsx` is updated to use the shared database and new Dialog.

**Tech Stack:** React 18, TypeScript, Zustand, Radix UI Dialog, Vitest (happy-dom), Tailwind CSS

---

## File Structure

| File | Responsibility |
|------|---------------|
| `src/data/app-database.ts` | Preset app catalog (data + search/filter functions) |
| `src/data/app-database.test.ts` | Tests for search, filter, alias matching |
| `src/lib/app-identifier.ts` | Cross-platform file parsing (plist, exe, desktop) |
| `src/lib/app-identifier.test.ts` | Tests for all three parsers + error cases |
| `src/types/config.ts` | Extend `PlatformConfig.platform` to include `'linux'` |
| `src/lib/config/defaults.ts` | No change needed (already generic) |
| `src/features/editor/components/AppSelectorDialog.tsx` | Dialog container with search + grid + fallback panels |
| `src/features/editor/components/LocalAppPicker.tsx` | Platform-specific file selection + parsing |
| `src/features/editor/components/TerminalCommandHelper.tsx` | macOS terminal command copy + paste input |
| `src/features/editor/modules/AsciiMode.tsx` | Replace hardcoded COMMON_APPS + manual input with database + Dialog |
| `src/features/wizard/steps/BasicConfigStep.tsx` | Use shared database instead of local COMMON_APPS |

---

### Task 1: App Database — Data and Search

**Files:**
- Create: `src/data/app-database.ts`
- Create: `src/data/app-database.test.ts`

- [ ] **Step 1: Write failing tests for the app database**

Create `src/data/app-database.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import {
  APP_DATABASE,
  searchApps,
  getAppsForPlatform,
  getAppIdentifier,
  type AppEntry,
} from './app-database'

describe('APP_DATABASE', () => {
  it('contains between 15 and 25 entries', () => {
    expect(APP_DATABASE.length).toBeGreaterThanOrEqual(15)
    expect(APP_DATABASE.length).toBeLessThanOrEqual(25)
  })

  it('every entry has unique id', () => {
    const ids = APP_DATABASE.map((a) => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every entry has at least one platform identifier', () => {
    for (const app of APP_DATABASE) {
      const hasAny =
        app.platforms.macos || app.platforms.windows || app.platforms.linux
      expect(hasAny, `${app.id} has no platform identifiers`).toBeTruthy()
    }
  })
})

describe('getAppsForPlatform', () => {
  it('filters to macOS apps only', () => {
    const apps = getAppsForPlatform('macos')
    for (const app of apps) {
      expect(app.platforms.macos).toBeDefined()
    }
  })

  it('filters to windows apps only', () => {
    const apps = getAppsForPlatform('windows')
    for (const app of apps) {
      expect(app.platforms.windows).toBeDefined()
    }
  })

  it('filters to linux apps only', () => {
    const apps = getAppsForPlatform('linux')
    for (const app of apps) {
      expect(app.platforms.linux).toBeDefined()
    }
  })

  it('excludes already-configured app IDs', () => {
    const configured = { 'com.apple.Terminal': { asciiMode: true } }
    const apps = getAppsForPlatform('macos', configured)
    expect(apps.find((a) => a.platforms.macos === 'com.apple.Terminal')).toBeUndefined()
  })
})

describe('searchApps', () => {
  it('matches by name (case-insensitive)', () => {
    const results = searchApps('terminal', 'macos')
    expect(results.some((a) => a.id === 'terminal')).toBe(true)
  })

  it('matches by platform identifier', () => {
    const results = searchApps('Code.exe', 'windows')
    expect(results.some((a) => a.id === 'vscode')).toBe(true)
  })

  it('matches by Chinese alias', () => {
    const results = searchApps('微信', 'macos')
    expect(results.some((a) => a.id === 'wechat')).toBe(true)
  })

  it('returns empty for no match', () => {
    const results = searchApps('xyznonexistent', 'macos')
    expect(results).toHaveLength(0)
  })

  it('only returns apps available on the target platform', () => {
    const results = searchApps('xcode', 'windows')
    expect(results).toHaveLength(0)
  })
})

describe('getAppIdentifier', () => {
  it('returns macOS bundle ID for macos platform', () => {
    const app = APP_DATABASE.find((a) => a.id === 'vscode')!
    expect(getAppIdentifier(app, 'macos')).toBe('com.microsoft.VSCode')
  })

  it('returns exe name for windows platform', () => {
    const app = APP_DATABASE.find((a) => a.id === 'vscode')!
    expect(getAppIdentifier(app, 'windows')).toBe('Code.exe')
  })

  it('returns undefined for unsupported platform', () => {
    const app = APP_DATABASE.find((a) => a.id === 'xcode')!
    expect(getAppIdentifier(app, 'windows')).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/data/app-database.test.ts`
Expected: FAIL — module `./app-database` not found

- [ ] **Step 3: Implement the app database**

Create `src/data/app-database.ts`:

```typescript
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
  category: 'terminal' | 'editor' | 'ide' | 'browser' | 'communication' | 'office' | 'other'
}

export const APP_DATABASE: AppEntry[] = [
  // ── Terminal ──
  {
    id: 'terminal',
    name: 'Terminal',
    aliases: ['终端'],
    icon: '>_',
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
    platforms: { macos: 'org.alacritty', windows: 'alacritty.exe', linux: 'Alacritty' },
    category: 'terminal',
  },
  {
    id: 'warp',
    name: 'Warp',
    platforms: { macos: 'dev.warp.Warp-Stable' },
    category: 'terminal',
  },
  // ── Editor ──
  {
    id: 'vscode',
    name: 'VS Code',
    platforms: { macos: 'com.microsoft.VSCode', windows: 'Code.exe', linux: 'code' },
    category: 'editor',
  },
  {
    id: 'sublime-text',
    name: 'Sublime Text',
    platforms: { macos: 'com.sublimetext.4', windows: 'sublime_text.exe', linux: 'sublime_text' },
    category: 'editor',
  },
  // ── IDE ──
  {
    id: 'intellij',
    name: 'IntelliJ IDEA',
    platforms: { macos: 'com.jetbrains.intellij', windows: 'idea64.exe', linux: 'jetbrains-idea' },
    category: 'ide',
  },
  {
    id: 'webstorm',
    name: 'WebStorm',
    platforms: { macos: 'com.jetbrains.WebStorm', windows: 'webstorm64.exe', linux: 'jetbrains-webstorm' },
    category: 'ide',
  },
  {
    id: 'pycharm',
    name: 'PyCharm',
    platforms: { macos: 'com.jetbrains.pycharm', windows: 'pycharm64.exe', linux: 'jetbrains-pycharm' },
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
    platforms: { macos: 'com.google.android.studio', windows: 'studio64.exe', linux: 'android-studio' },
    category: 'ide',
  },
  // ── Browser ──
  {
    id: 'chrome',
    name: 'Chrome',
    aliases: ['谷歌浏览器'],
    platforms: { macos: 'com.google.Chrome', windows: 'chrome.exe', linux: 'google-chrome' },
    category: 'browser',
  },
  {
    id: 'firefox',
    name: 'Firefox',
    aliases: ['火狐浏览器'],
    platforms: { macos: 'org.mozilla.firefox', windows: 'firefox.exe', linux: 'firefox' },
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
    platforms: { macos: 'company.thebrowser.Browser', windows: 'Arc.exe' },
    category: 'browser',
  },
  // ── Communication ──
  {
    id: 'wechat',
    name: 'WeChat',
    aliases: ['微信'],
    platforms: { macos: 'com.tencent.xinWeChat', windows: 'WeChat.exe' },
    category: 'communication',
  },
  {
    id: 'telegram',
    name: 'Telegram',
    aliases: ['电报'],
    platforms: { macos: 'ru.keepcoder.Telegram', windows: 'Telegram.exe', linux: 'telegram-desktop' },
    category: 'communication',
  },
  // ── Office ──
  {
    id: 'wps',
    name: 'WPS Office',
    platforms: { macos: 'com.kingsoft.wpsoffice.mac', windows: 'wps.exe', linux: 'wps' },
    category: 'office',
  },
  // ── Other ──
  {
    id: 'raycast',
    name: 'Raycast',
    platforms: { macos: 'com.raycast.macos' },
    category: 'other',
  },
]

type PlatformKey = 'macos' | 'windows' | 'linux'

const CATEGORY_LABELS: Record<AppEntry['category'], string> = {
  terminal: '终端工具',
  editor: '编辑器',
  ide: 'IDE',
  browser: '浏览器',
  communication: '通讯',
  office: '办公',
  other: '其他',
}

export { CATEGORY_LABELS }

export function getAppsForPlatform(
  platform: PlatformKey,
  configuredAppOptions?: Record<string, unknown>,
): AppEntry[] {
  return APP_DATABASE.filter((app) => {
    if (!app.platforms[platform]) return false
    if (configuredAppOptions && app.platforms[platform]! in configuredAppOptions) return false
    return true
  })
}

export function searchApps(query: string, platform: PlatformKey): AppEntry[] {
  const q = query.toLowerCase().trim()
  if (!q) return getAppsForPlatform(platform)

  return APP_DATABASE.filter((app) => {
    if (!app.platforms[platform]) return false
    const nameMatch = app.name.toLowerCase().includes(q)
    const aliasMatch = app.aliases?.some((a) => a.toLowerCase().includes(q)) ?? false
    const idMatch = Object.values(app.platforms).some(
      (v) => v && v.toLowerCase().includes(q),
    )
    const categoryMatch = app.category.toLowerCase().includes(q)
    return nameMatch || aliasMatch || idMatch || categoryMatch
  })
}

export function getAppIdentifier(
  app: AppEntry,
  platform: PlatformKey,
): string | undefined {
  return app.platforms[platform]
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/data/app-database.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/data/app-database.ts src/data/app-database.test.ts
git commit -m "feat: add preset app database with search and platform filtering"
```

---

### Task 2: App Identifier Parsers

**Files:**
- Create: `src/lib/app-identifier.ts`
- Create: `src/lib/app-identifier.test.ts`

- [ ] **Step 1: Write failing tests for the parsers**

Create `src/lib/app-identifier.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import {
  parseBundleIdFromPlist,
  getExeFileName,
  parseDesktopFile,
} from './app-identifier'

describe('parseBundleIdFromPlist', () => {
  it('extracts CFBundleIdentifier from valid XML plist', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key>
  <string>Visual Studio Code</string>
  <key>CFBundleIdentifier</key>
  <string>com.microsoft.VSCode</string>
  <key>CFBundleVersion</key>
  <string>1.85.0</string>
</dict>
</plist>`
    expect(parseBundleIdFromPlist(xml)).toBe('com.microsoft.VSCode')
  })

  it('returns null for plist without CFBundleIdentifier', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<plist version="1.0">
<dict>
  <key>CFBundleName</key>
  <string>SomeApp</string>
</dict>
</plist>`
    expect(parseBundleIdFromPlist(xml)).toBeNull()
  })

  it('returns null for binary plist content', () => {
    const binary = 'bplist00\x00\x01\x02\x03'
    expect(parseBundleIdFromPlist(binary)).toBeNull()
  })

  it('returns null for invalid XML', () => {
    expect(parseBundleIdFromPlist('not xml at all')).toBeNull()
  })
})

describe('getExeFileName', () => {
  it('returns the file name from a File object', () => {
    const file = new File([], 'Code.exe')
    expect(getExeFileName(file)).toBe('Code.exe')
  })

  it('returns name even with path-like name', () => {
    const file = new File([], 'notepad.exe')
    expect(getExeFileName(file)).toBe('notepad.exe')
  })
})

describe('parseDesktopFile', () => {
  it('extracts StartupWMClass when present', () => {
    const content = `[Desktop Entry]
Name=Visual Studio Code
Exec=/usr/bin/code %F
StartupWMClass=Code
Type=Application`
    expect(parseDesktopFile(content)).toBe('Code')
  })

  it('falls back to Exec command name when no StartupWMClass', () => {
    const content = `[Desktop Entry]
Name=Firefox
Exec=/usr/lib/firefox/firefox %u
Type=Application`
    expect(parseDesktopFile(content)).toBe('firefox')
  })

  it('strips arguments from Exec value', () => {
    const content = `[Desktop Entry]
Name=Telegram
Exec=/usr/bin/telegram-desktop -- %u
StartupWMClass=TelegramDesktop
Type=Application`
    expect(parseDesktopFile(content)).toBe('TelegramDesktop')
  })

  it('handles Exec with env prefix', () => {
    const content = `[Desktop Entry]
Name=App
Exec=env VAR=1 /usr/bin/myapp --flag
Type=Application`
    expect(parseDesktopFile(content)).toBe('myapp')
  })

  it('returns null when neither StartupWMClass nor Exec present', () => {
    const content = `[Desktop Entry]
Name=Broken
Type=Application`
    expect(parseDesktopFile(content)).toBeNull()
  })

  it('returns null for empty content', () => {
    expect(parseDesktopFile('')).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/app-identifier.test.ts`
Expected: FAIL — module `./app-identifier` not found

- [ ] **Step 3: Implement the parsers**

Create `src/lib/app-identifier.ts`:

```typescript
/**
 * Parse a macOS Info.plist XML to extract CFBundleIdentifier.
 * Returns null if the content is binary, invalid XML, or missing the key.
 */
export function parseBundleIdFromPlist(xmlContent: string): string | null {
  // Binary plist starts with "bplist"
  if (xmlContent.startsWith('bplist')) return null

  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xmlContent, 'application/xml')

    // Check for parse errors
    if (doc.querySelector('parsererror')) return null

    const keys = doc.querySelectorAll('dict > key')
    for (const key of keys) {
      if (key.textContent === 'CFBundleIdentifier') {
        const valueNode = key.nextElementSibling
        if (valueNode?.tagName === 'string') {
          return valueNode.textContent ?? null
        }
      }
    }
  } catch {
    return null
  }

  return null
}

/**
 * Extract the filename from a File object (for Windows .exe files).
 */
export function getExeFileName(file: File): string {
  return file.name
}

/**
 * Parse a Linux .desktop file to extract the app identifier.
 * Prefers StartupWMClass, falls back to the command name from Exec.
 */
export function parseDesktopFile(content: string): string | null {
  if (!content.trim()) return null

  const lines = content.split('\n')
  let wmClass: string | null = null
  let exec: string | null = null

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('StartupWMClass=')) {
      wmClass = trimmed.slice('StartupWMClass='.length).trim()
    } else if (trimmed.startsWith('Exec=') && !exec) {
      exec = trimmed.slice('Exec='.length).trim()
    }
  }

  if (wmClass) return wmClass

  if (exec) {
    return extractCommandName(exec)
  }

  return null
}

/**
 * Extract the base command name from an Exec line.
 * Handles: "/usr/bin/app --flag %u", "env VAR=1 /usr/bin/app"
 */
function extractCommandName(execLine: string): string {
  const parts = execLine.split(/\s+/)

  // Skip env prefix and env variable assignments (KEY=VALUE)
  let i = 0
  if (parts[0] === 'env') i = 1
  while (i < parts.length && parts[i]!.includes('=')) i++

  const command = parts[i]
  if (!command) return execLine

  // Take only the basename (after last /)
  const basename = command.split('/').pop()!
  return basename
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/app-identifier.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/app-identifier.ts src/lib/app-identifier.test.ts
git commit -m "feat: add cross-platform app identifier parsers (plist, exe, desktop)"
```

---

### Task 3: Extend PlatformConfig for Linux

**Files:**
- Modify: `src/types/config.ts:66`
- Modify: `src/features/editor/modules/AsciiMode.tsx:44-46` (help text)

- [ ] **Step 1: Update PlatformConfig type**

In `src/types/config.ts`, change line 66:

```typescript
// Before
platform: 'macos' | 'windows';

// After
platform: 'macos' | 'windows' | 'linux';
```

- [ ] **Step 2: Verify the build passes**

Run: `npx tsc --noEmit`
Expected: No new errors (the `Platform` union at line 5 already includes `'linux'`)

- [ ] **Step 3: Commit**

```bash
git add src/types/config.ts
git commit -m "feat: extend PlatformConfig.platform to include linux"
```

---

### Task 4: AppSelectorDialog Component

**Files:**
- Create: `src/features/editor/components/AppSelectorDialog.tsx`
- Create: `src/features/editor/components/LocalAppPicker.tsx`
- Create: `src/features/editor/components/TerminalCommandHelper.tsx`

- [ ] **Step 1: Create LocalAppPicker component**

Create `src/features/editor/components/LocalAppPicker.tsx`:

```tsx
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { parseBundleIdFromPlist, getExeFileName, parseDesktopFile } from '@/lib/app-identifier'

interface LocalAppPickerProps {
  platform: 'macos' | 'windows' | 'linux'
  onSelect: (identifier: string) => void
}

const PLATFORM_CONFIG = {
  macos: {
    accept: '.plist',
    label: '选择 Info.plist',
    hint: '在 Finder 中右键 .app → 显示包内容 → 打开 Contents 文件夹 → 选择 Info.plist',
  },
  windows: {
    accept: '.exe',
    label: '选择 .exe 文件',
    hint: '浏览到应用安装目录（通常在 C:\\Program Files），选择 .exe 文件',
  },
  linux: {
    accept: '.desktop',
    label: '选择 .desktop 文件',
    hint: '通常位于 /usr/share/applications 或 ~/.local/share/applications',
  },
} as const

export function LocalAppPicker({ platform, onSelect }: LocalAppPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [parsedId, setParsedId] = useState<string | null>(null)

  const config = PLATFORM_CONFIG[platform]

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setParsedId(null)

    if (platform === 'windows') {
      const name = getExeFileName(file)
      setParsedId(name)
      return
    }

    try {
      const content = await file.text()

      if (platform === 'macos') {
        const bundleId = parseBundleIdFromPlist(content)
        if (bundleId) {
          setParsedId(bundleId)
        } else {
          setError('未能解析 Bundle ID。文件可能为二进制格式，请使用终端命令获取。')
        }
      } else {
        const id = parseDesktopFile(content)
        if (id) {
          setParsedId(id)
        } else {
          setError('未能解析应用标识符，请手动输入。')
        }
      }
    } catch {
      setError('文件读取失败，请重试。')
    }

    // Reset input so selecting the same file again triggers onChange
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleConfirm() {
    if (parsedId) {
      onSelect(parsedId)
      setParsedId(null)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{config.hint}</p>

      <input
        ref={fileInputRef}
        type="file"
        accept={config.accept}
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
      >
        {config.label}
      </Button>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {parsedId && (
        <div className="flex items-center gap-2">
          <Input value={parsedId} readOnly className="flex-1 font-mono text-sm" />
          <Button size="sm" onClick={handleConfirm}>
            添加
          </Button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create TerminalCommandHelper component**

Create `src/features/editor/components/TerminalCommandHelper.tsx`:

```tsx
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface TerminalCommandHelperProps {
  onSelect: (identifier: string) => void
}

const COMMAND = 'mdls -name kMDItemCFBundleIdentifier -raw /Applications/应用名.app'

export function TerminalCommandHelper({ onSelect }: TerminalCommandHelperProps) {
  const [pastedId, setPastedId] = useState('')
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(COMMAND)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleSubmit() {
    const trimmed = pastedId.trim()
    if (trimmed) {
      onSelect(trimmed)
      setPastedId('')
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        在终端中执行以下命令，将「应用名」替换为实际的应用名称：
      </p>
      <div className="flex items-center gap-2">
        <code className="flex-1 rounded bg-muted px-3 py-2 text-xs font-mono break-all">
          {COMMAND}
        </code>
        <Button variant="outline" size="sm" onClick={handleCopy}>
          {copied ? '已复制' : '复制'}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">将结果粘贴到下方：</p>
      <div className="flex items-center gap-2">
        <Input
          value={pastedId}
          onChange={(e) => setPastedId(e.target.value)}
          placeholder="com.example.app"
          className="flex-1 font-mono text-sm"
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
        <Button size="sm" onClick={handleSubmit} disabled={!pastedId.trim()}>
          添加
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create AppSelectorDialog component**

Create `src/features/editor/components/AppSelectorDialog.tsx`:

```tsx
import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  searchApps,
  getAppsForPlatform,
  getAppIdentifier,
  CATEGORY_LABELS,
  type AppEntry,
} from '@/data/app-database'
import { LocalAppPicker } from './LocalAppPicker'
import { TerminalCommandHelper } from './TerminalCommandHelper'

interface AppSelectorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  platform: 'macos' | 'windows' | 'linux'
  configuredAppOptions: Record<string, unknown>
  onSelect: (identifier: string) => void
}

type FallbackPanel = 'local' | 'terminal' | 'manual' | null

export function AppSelectorDialog({
  open,
  onOpenChange,
  platform,
  configuredAppOptions,
  onSelect,
}: AppSelectorDialogProps) {
  const [query, setQuery] = useState('')
  const [activePanel, setActivePanel] = useState<FallbackPanel>(null)
  const [manualInput, setManualInput] = useState('')

  const filteredApps = useMemo(() => {
    if (query.trim()) {
      return searchApps(query, platform)
    }
    return getAppsForPlatform(platform)
  }, [query, platform])

  // Group by category
  const grouped = useMemo(() => {
    const groups: Record<string, AppEntry[]> = {}
    for (const app of filteredApps) {
      const cat = app.category
      if (!groups[cat]) groups[cat] = []
      groups[cat]!.push(app)
    }
    return groups
  }, [filteredApps])

  function handleSelectApp(app: AppEntry) {
    const id = getAppIdentifier(app, platform)
    if (id) {
      onSelect(id)
      handleClose()
    }
  }

  function handleFallbackSelect(identifier: string) {
    onSelect(identifier)
    handleClose()
  }

  function handleManualSubmit() {
    const trimmed = manualInput.trim()
    if (trimmed) {
      onSelect(trimmed)
      handleClose()
    }
  }

  function handleClose() {
    setQuery('')
    setActivePanel(null)
    setManualInput('')
    onOpenChange(false)
  }

  function isConfigured(app: AppEntry): boolean {
    const id = getAppIdentifier(app, platform)
    return id ? id in configuredAppOptions : false
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>添加应用</DialogTitle>
          <DialogDescription>
            选择需要设置默认输入模式的应用
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <Input
          placeholder="搜索应用名称..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />

        {/* App Grid */}
        <div className="space-y-4">
          {Object.entries(grouped).map(([category, apps]) => (
            <div key={category}>
              <p className="mb-2 text-sm font-medium text-muted-foreground">
                {CATEGORY_LABELS[category as AppEntry['category']] ?? category}
              </p>
              <div className="flex flex-wrap gap-2">
                {apps.map((app) => {
                  const configured = isConfigured(app)
                  return (
                    <Button
                      key={app.id}
                      variant="outline"
                      size="sm"
                      disabled={configured}
                      onClick={() => handleSelectApp(app)}
                      className={configured ? 'opacity-50' : ''}
                      title={getAppIdentifier(app, platform)}
                    >
                      {app.icon && <span className="mr-1">{app.icon}</span>}
                      {app.name}
                    </Button>
                  )
                })}
              </div>
            </div>
          ))}

          {Object.keys(grouped).length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              未找到匹配的应用
            </p>
          )}
        </div>

        {/* Fallback section */}
        <div className="border-t pt-4">
          <p className="mb-3 text-sm font-medium">找不到你的应用？</p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activePanel === 'local' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActivePanel(activePanel === 'local' ? null : 'local')}
            >
              从本地选择
            </Button>
            <Button
              variant={activePanel === 'manual' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActivePanel(activePanel === 'manual' ? null : 'manual')}
            >
              手动输入标识符
            </Button>
            {platform === 'macos' && (
              <Button
                variant={activePanel === 'terminal' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActivePanel(activePanel === 'terminal' ? null : 'terminal')}
              >
                终端命令获取
              </Button>
            )}
          </div>

          {activePanel === 'local' && (
            <div className="mt-3">
              <LocalAppPicker platform={platform} onSelect={handleFallbackSelect} />
            </div>
          )}

          {activePanel === 'terminal' && platform === 'macos' && (
            <div className="mt-3">
              <TerminalCommandHelper onSelect={handleFallbackSelect} />
            </div>
          )}

          {activePanel === 'manual' && (
            <div className="mt-3 flex items-center gap-2">
              <Input
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder={
                  platform === 'macos'
                    ? 'com.example.app'
                    : platform === 'windows'
                      ? 'app.exe'
                      : 'app-wm-class'
                }
                className="flex-1 font-mono text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
              />
              <Button size="sm" onClick={handleManualSubmit} disabled={!manualInput.trim()}>
                添加
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 4: Verify the build passes**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/features/editor/components/AppSelectorDialog.tsx \
        src/features/editor/components/LocalAppPicker.tsx \
        src/features/editor/components/TerminalCommandHelper.tsx
git commit -m "feat: add AppSelectorDialog with search, local picker, and terminal helper"
```

---

### Task 5: Update AsciiMode to Use Database and Dialog

**Files:**
- Modify: `src/features/editor/modules/AsciiMode.tsx`

- [ ] **Step 1: Rewrite AsciiMode.tsx**

Replace the entire content of `src/features/editor/modules/AsciiMode.tsx`:

```tsx
import { useState } from 'react'
import { useConfigStore } from '@/stores/config-store'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card } from '@/components/ui/card'
import { LearnMoreLink } from '@/components/shared/LearnMoreLink'
import { SettingHelp } from '@/components/shared/SettingHelp'
import { AppSelectorDialog } from '../components/AppSelectorDialog'
import {
  APP_DATABASE,
  getAppsForPlatform,
  getAppIdentifier,
} from '@/data/app-database'

/** Show up to 5 quick-add buttons for the most common unconfigured apps */
const QUICK_ADD_CATEGORIES = ['terminal', 'editor', 'ide'] as const
const QUICK_ADD_MAX = 5

export function AsciiMode() {
  const appOptions = useConfigStore((s) => s.project.platformConfig.appOptions)
  const targetPlatform = useConfigStore((s) => s.project.targetPlatform)
  const setAppOption = useConfigStore((s) => s.setAppOption)
  const removeAppOption = useConfigStore((s) => s.removeAppOption)
  const [dialogOpen, setDialogOpen] = useState(false)

  const platform = targetPlatform as 'macos' | 'windows' | 'linux'

  const configuredApps = Object.entries(appOptions)

  // Quick-add: filter to common categories, available on this platform, not yet configured
  const quickAddApps = getAppsForPlatform(platform, appOptions)
    .filter((app) => (QUICK_ADD_CATEGORIES as readonly string[]).includes(app.category))
    .slice(0, QUICK_ADD_MAX)

  function findAppName(identifier: string): string | undefined {
    return APP_DATABASE.find((app) =>
      Object.values(app.platforms).includes(identifier),
    )?.name
  }

  const platformHint =
    platform === 'macos'
      ? ' (macOS: 使用 Bundle Identifier)'
      : platform === 'windows'
        ? ' (Windows: 使用程序文件名)'
        : ' (Linux: 使用 WM_CLASS 或进程名)'

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">中英文切换与应用设置</h3>
          <LearnMoreLink module="ascii-mode" />
        </div>
        <div className="mt-1 flex flex-wrap items-start gap-x-1.5">
          <p className="text-sm text-gray-500">
            为特定应用设置默认输入模式。例如终端和代码编辑器通常默认英文模式。
            {platformHint}
          </p>
          <SettingHelp>
            <p>为应用设置默认英文模式后，切换到该应用时 Rime 自动进入英文输入状态。你仍可手动切换回中文（通过修饰键或 Caps Lock）。</p>
            {platform === 'macos' && (
              <p>macOS 使用 Bundle Identifier 标识应用（格式如 com.apple.Terminal），可在「活动监视器」的应用详情中查看。</p>
            )}
            {platform === 'windows' && (
              <p>Windows 使用程序文件名（如 Code.exe）标识应用。</p>
            )}
            {platform === 'linux' && (
              <p>Linux 使用 WM_CLASS 或进程名标识应用，可通过 xprop 命令或 .desktop 文件查看。</p>
            )}
          </SettingHelp>
        </div>
      </div>

      {/* Configured apps */}
      {configuredApps.length > 0 && (
        <div className="space-y-2">
          <Label>已配置的应用</Label>
          {configuredApps.map(([identifier, opt]) => {
            const appName = findAppName(identifier)
            return (
              <Card key={identifier} className="flex items-center justify-between p-3">
                <div>
                  <p className="font-medium">{appName ?? identifier}</p>
                  {appName && <p className="text-xs text-gray-400">{identifier}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">默认英文</span>
                    <Switch
                      checked={opt.asciiMode}
                      onCheckedChange={(checked) => setAppOption(identifier, checked)}
                    />
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeAppOption(identifier)}>
                    删除
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Quick-add buttons */}
      {quickAddApps.length > 0 && (
        <div>
          <Label>快速添加常用应用</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {quickAddApps.map((app) => {
              const id = getAppIdentifier(app, platform)!
              return (
                <Button
                  key={app.id}
                  variant="outline"
                  size="sm"
                  onClick={() => setAppOption(id, true)}
                >
                  + {app.name}
                </Button>
              )
            })}
          </div>
        </div>
      )}

      {/* Add app button → opens Dialog */}
      <div>
        <Button variant="outline" onClick={() => setDialogOpen(true)}>
          + 添加应用
        </Button>
      </div>

      <AppSelectorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        platform={platform}
        configuredAppOptions={appOptions}
        onSelect={(identifier) => setAppOption(identifier, true)}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verify the build passes**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Manual verification**

Run: `npm run dev`
- Navigate to 配置编辑器 → 中英文切换
- Verify quick-add buttons show platform-appropriate apps
- Click "添加应用" → Dialog opens with search and categorized grid
- Search for "chrome" → filters correctly
- Click an app → Dialog closes, app appears in configured list
- Click "从本地选择" → file picker guidance appears
- Click "手动输入标识符" → input field appears
- On macOS target → "终端命令获取" button visible

- [ ] **Step 4: Commit**

```bash
git add src/features/editor/modules/AsciiMode.tsx
git commit -m "feat: replace manual input with app selector dialog in AsciiMode"
```

---

### Task 6: Update BasicConfigStep Wizard

**Files:**
- Modify: `src/features/wizard/steps/BasicConfigStep.tsx`

- [ ] **Step 1: Update BasicConfigStep to use shared database**

In `src/features/wizard/steps/BasicConfigStep.tsx`, replace the local `COMMON_APPS` with a filtered import:

Replace lines 1-27 (imports and COMMON_APPS) with:

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { SwitchKeyAction } from '@/types/config'
import type { WizardState, WizardAction } from '../WizardPage'
import { getAppsForPlatform, getAppIdentifier } from '@/data/app-database'

const PAGE_SIZES = [5, 6, 7, 8, 9]

const SHIFT_L_OPTIONS: { value: SwitchKeyAction; label: string }[] = [
  { value: 'commit_code', label: '上屏编码' },
  { value: 'commit_text', label: '上屏候选' },
  { value: 'inline_ascii', label: '行内切换英文' },
  { value: 'clear', label: '清除编码' },
  { value: 'noop', label: '无操作' },
]
```

Then replace the wizard's ASCII mode section (lines 98-122) with:

```tsx
        {/* ASCII mode apps */}
        <div>
          <Label className="text-sm font-medium">默认英文模式的应用</Label>
          <p className="mb-3 text-xs text-gray-500">
            在以下应用中自动切换为英文输入
          </p>
          <div className="space-y-3">
            {getAppsForPlatform('macos')
              .filter((app) => ['terminal', 'editor', 'ide'].includes(app.category))
              .slice(0, 5)
              .map((app) => {
                const id = getAppIdentifier(app, 'macos')!
                const checked = state.asciiModeApps.includes(id)
                return (
                  <div key={app.id} className="flex items-center justify-between">
                    <Label htmlFor={app.id} className="text-sm">
                      {app.name}
                    </Label>
                    <Switch
                      id={app.id}
                      checked={checked}
                      onCheckedChange={() =>
                        dispatch({ type: 'TOGGLE_APP', app: id })
                      }
                    />
                  </div>
                )
              })}
          </div>
        </div>
```

- [ ] **Step 2: Verify the build passes**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Run all existing tests**

Run: `npx vitest run`
Expected: All tests PASS (including existing parser, serializer, store tests)

- [ ] **Step 4: Commit**

```bash
git add src/features/wizard/steps/BasicConfigStep.tsx
git commit -m "refactor: use shared app database in wizard BasicConfigStep"
```

---

### Task 7: Final Verification

- [ ] **Step 1: Run the full test suite**

Run: `npx vitest run`
Expected: All tests pass, including new app-database and app-identifier tests

- [ ] **Step 2: Run type checking**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Run the dev server and manual smoke test**

Run: `npm run dev`

Verify:
1. 配置编辑器 → 中英文切换 page loads correctly
2. Quick-add buttons show platform-appropriate apps
3. Dialog search, grid, local picker, terminal helper, manual input all work
4. Adding/removing apps persists correctly
5. Wizard basic config step shows apps from shared database
6. Switching target platform updates the app list

- [ ] **Step 4: Final commit if any cleanup needed**

```bash
git add -A
git commit -m "chore: app selector feature complete"
```
