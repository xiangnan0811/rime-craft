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
