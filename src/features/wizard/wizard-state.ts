import { PRESET_THEMES } from '@/data/preset-themes'
import type { FormalEditorPlatform } from '@/lib/product/support-contract'
import type { SwitchKeyAction } from '@/types/config'
import { getDefaultWizardAsciiModeApps } from './ascii-mode-apps'

export interface WizardState {
  step: number
  platform: FormalEditorPlatform
  schemaId: string
  pageSize: number
  shiftLBehavior: SwitchKeyAction
  asciiModeApps: string[]
  themeName: string
}

export type WizardAction =
  | { type: 'SET_STEP'; step: number }
  | { type: 'SET_PLATFORM'; platform: FormalEditorPlatform }
  | { type: 'SET_SCHEMA'; schemaId: string }
  | { type: 'SET_PAGE_SIZE'; pageSize: number }
  | { type: 'SET_SHIFT_L'; behavior: SwitchKeyAction }
  | { type: 'TOGGLE_APP'; app: string }
  | { type: 'SET_THEME'; themeName: string }

const firstTheme = PRESET_THEMES[0]

export const initialWizardState: WizardState = {
  step: 0,
  platform: 'macos',
  schemaId: 'rime_ice',
  pageSize: 9,
  shiftLBehavior: 'commit_code',
  asciiModeApps: getDefaultWizardAsciiModeApps('macos'),
  themeName: firstTheme ? firstTheme.name : 'default',
}

export function wizardReducer(
  state: WizardState,
  action: WizardAction,
): WizardState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.step }
    case 'SET_PLATFORM':
      if (action.platform === state.platform) {
        return state
      }
      return {
        ...state,
        platform: action.platform,
        asciiModeApps: getDefaultWizardAsciiModeApps(action.platform),
      }
    case 'SET_SCHEMA':
      return { ...state, schemaId: action.schemaId }
    case 'SET_PAGE_SIZE':
      return { ...state, pageSize: action.pageSize }
    case 'SET_SHIFT_L':
      return { ...state, shiftLBehavior: action.behavior }
    case 'TOGGLE_APP': {
      const exists = state.asciiModeApps.includes(action.app)
      return {
        ...state,
        asciiModeApps: exists
          ? state.asciiModeApps.filter((a) => a !== action.app)
          : [...state.asciiModeApps, action.app],
      }
    }
    case 'SET_THEME':
      return { ...state, themeName: action.themeName }
  }
}

export const WIZARD_STEP_LABELS = [
  '选择平台',
  '选择方案',
  '基础配置',
  '选择主题',
  '完成',
]
