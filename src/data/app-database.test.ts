import { describe, it, expect } from 'vitest'
import {
  APP_DATABASE,
  CATEGORY_LABELS,
  getAppsForPlatform,
  searchApps,
  getAppIdentifier,
  type AppEntry,
  type AppCategory,
} from './app-database'

describe('APP_DATABASE', () => {
  it('contains 15-25 entries', () => {
    expect(APP_DATABASE.length).toBeGreaterThanOrEqual(15)
    expect(APP_DATABASE.length).toBeLessThanOrEqual(25)
  })

  it('each entry has a unique id', () => {
    const ids = APP_DATABASE.map((app) => app.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('each entry has at least one platform identifier', () => {
    for (const app of APP_DATABASE) {
      const hasAnyPlatform =
        app.platforms.macos !== undefined ||
        app.platforms.windows !== undefined ||
        app.platforms.linux !== undefined
      expect(hasAnyPlatform, `${app.id} should have at least one platform`).toBe(
        true
      )
    }
  })

  it('each entry has required fields', () => {
    for (const app of APP_DATABASE) {
      expect(app.id).toBeTruthy()
      expect(app.name).toBeTruthy()
      expect(app.category).toBeTruthy()
      expect(app.platforms).toBeDefined()
    }
  })

  it('covers all expected categories', () => {
    const categories = new Set(APP_DATABASE.map((app) => app.category))
    expect(categories).toContain('terminal')
    expect(categories).toContain('editor')
    expect(categories).toContain('ide')
    expect(categories).toContain('browser')
    expect(categories).toContain('communication')
    expect(categories).toContain('office')
    expect(categories).toContain('other')
  })
})

describe('CATEGORY_LABELS', () => {
  it('has Chinese labels for all categories', () => {
    const allCategories: AppCategory[] = [
      'terminal',
      'editor',
      'ide',
      'browser',
      'communication',
      'office',
      'other',
    ]
    for (const cat of allCategories) {
      expect(CATEGORY_LABELS[cat]).toBeTruthy()
    }
  })
})

describe('getAppsForPlatform', () => {
  it('returns only apps available on macOS', () => {
    const macApps = getAppsForPlatform('macos')
    expect(macApps.length).toBeGreaterThan(0)
    for (const app of macApps) {
      expect(app.platforms.macos).toBeDefined()
    }
  })

  it('returns only apps available on Windows', () => {
    const winApps = getAppsForPlatform('windows')
    expect(winApps.length).toBeGreaterThan(0)
    for (const app of winApps) {
      expect(app.platforms.windows).toBeDefined()
    }
  })

  it('returns only apps available on Linux', () => {
    const linuxApps = getAppsForPlatform('linux')
    expect(linuxApps.length).toBeGreaterThan(0)
    for (const app of linuxApps) {
      expect(app.platforms.linux).toBeDefined()
    }
  })

  it('excludes already configured apps by option key', () => {
    const configured = ['com.microsoft.VSCode', 'com.google.Chrome']
    const result = getAppsForPlatform('macos', configured)
    const ids = result.map((app) => app.id)
    expect(ids).not.toContain('vscode')
    expect(ids).not.toContain('chrome')
  })

  it('returns all apps when no configured list is provided', () => {
    const all = getAppsForPlatform('macos')
    const withEmpty = getAppsForPlatform('macos', [])
    expect(all.length).toBe(withEmpty.length)
  })

  it('does not exclude apps whose identifier does not match configured list', () => {
    const configured = ['com.nonexistent.app']
    const result = getAppsForPlatform('macos', configured)
    const allMac = getAppsForPlatform('macos')
    expect(result.length).toBe(allMac.length)
  })
})

describe('searchApps', () => {
  it('matches by name case-insensitively', () => {
    const results = searchApps('chrome', 'macos')
    expect(results.some((app) => app.id === 'chrome')).toBe(true)

    const resultsUpper = searchApps('CHROME', 'macos')
    expect(resultsUpper.some((app) => app.id === 'chrome')).toBe(true)
  })

  it('matches by platform identifier', () => {
    const results = searchApps('com.google.Chrome', 'macos')
    expect(results.some((app) => app.id === 'chrome')).toBe(true)
  })

  it('matches by Chinese alias', () => {
    const results = searchApps('微信', 'macos')
    expect(results.some((app) => app.id === 'wechat')).toBe(true)
  })

  it('matches by category', () => {
    const results = searchApps('terminal', 'macos')
    expect(results.length).toBeGreaterThan(0)
    for (const app of results) {
      expect(app.category).toBe('terminal')
    }
  })

  it('returns only apps available on the specified platform', () => {
    // Safari is macOS only
    const macResults = searchApps('safari', 'macos')
    expect(macResults.some((app) => app.id === 'safari')).toBe(true)

    const winResults = searchApps('safari', 'windows')
    expect(winResults.some((app) => app.id === 'safari')).toBe(false)
  })

  it('returns empty array for no matches', () => {
    const results = searchApps('xyznonexistent', 'macos')
    expect(results).toEqual([])
  })

  it('matches partial names', () => {
    const results = searchApps('tele', 'macos')
    expect(results.some((app) => app.id === 'telegram')).toBe(true)
  })
})

describe('getAppIdentifier', () => {
  it('returns macOS bundle id for macOS platform', () => {
    const chrome = APP_DATABASE.find((app) => app.id === 'chrome')!
    expect(getAppIdentifier(chrome, 'macos')).toBe('com.google.Chrome')
  })

  it('returns Windows executable for Windows platform', () => {
    const chrome = APP_DATABASE.find((app) => app.id === 'chrome')!
    expect(getAppIdentifier(chrome, 'windows')).toBe('chrome.exe')
  })

  it('returns Linux identifier for Linux platform', () => {
    const chrome = APP_DATABASE.find((app) => app.id === 'chrome')!
    expect(getAppIdentifier(chrome, 'linux')).toBe('google-chrome')
  })

  it('returns undefined when app does not support the platform', () => {
    const safari = APP_DATABASE.find((app) => app.id === 'safari')!
    expect(getAppIdentifier(safari, 'windows')).toBeUndefined()
    expect(getAppIdentifier(safari, 'linux')).toBeUndefined()
  })
})
