import {
  getAppsForPlatform,
  getAppIdentifier,
  type AppCategory,
  type AppEntry,
} from '@/data/app-database'
import type { FormalEditorPlatform } from '@/lib/product/support-contract'

const WIZARD_ASCII_MODE_APP_CATEGORIES: AppCategory[] = [
  'terminal',
  'editor',
  'ide',
]
const WIZARD_ASCII_MODE_APP_LIMIT = 5

export function getWizardAsciiModeAppOptions(
  platform: FormalEditorPlatform,
): AppEntry[] {
  return getAppsForPlatform(platform)
    .filter((app) => WIZARD_ASCII_MODE_APP_CATEGORIES.includes(app.category))
    .slice(0, WIZARD_ASCII_MODE_APP_LIMIT)
}

export function getDefaultWizardAsciiModeApps(
  platform: FormalEditorPlatform,
): string[] {
  return getWizardAsciiModeAppOptions(platform)
    .map((app) => getAppIdentifier(app, platform))
    .filter((identifier): identifier is string => identifier !== undefined)
}
