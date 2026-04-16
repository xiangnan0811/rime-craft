import { useReducer } from 'react'
import { Button } from '@/components/ui/button'
import { PlatformStep } from './steps/PlatformStep'
import { SchemaStep } from './steps/SchemaStep'
import { BasicConfigStep } from './steps/BasicConfigStep'
import { ThemeStep } from './steps/ThemeStep'
import { ExportStep } from './steps/ExportStep'
import { PRESET_THEMES } from '@/data/preset-themes'
import type { FormalEditorPlatform } from '@/lib/product/support-contract'
import type { SwitchKeyAction } from '@/types/config'
import { cn } from '@/lib/utils'
import { getDefaultWizardAsciiModeApps } from './ascii-mode-apps'

// ─── Wizard state ────────────────────────────────────────

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

const initialState: WizardState = {
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

// ─── Step indicator ──────────────────────────────────────

const STEP_LABELS = ['选择平台', '选择方案', '基础配置', '选择主题', '完成']

// ─── Component ───────────────────────────────────────────

export function WizardPage() {
  const [state, dispatch] = useReducer(wizardReducer, initialState)

  const isLastStep = state.step === 4

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold">新手配置向导</h1>

      {/* Step indicator */}
      <div className="mb-8 flex items-center justify-between">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="flex items-center">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
                i === state.step
                  ? 'bg-blue-500 text-white dark:bg-blue-600'
                  : i < state.step
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300'
                    : 'bg-muted text-muted-foreground',
              )}
            >
              {i + 1}
            </div>
            <span
              className={cn(
                'ml-2 text-sm',
                i === state.step ? 'font-medium' : 'text-muted-foreground',
              )}
            >
              {label}
            </span>
            {i < STEP_LABELS.length - 1 && (
              <div className="mx-4 h-px w-8 bg-border" />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      {state.step === 0 && (
        <PlatformStep
          value={state.platform}
          onChange={(p) => dispatch({ type: 'SET_PLATFORM', platform: p })}
        />
      )}
      {state.step === 1 && (
        <SchemaStep
          value={state.schemaId}
          onChange={(s) => dispatch({ type: 'SET_SCHEMA', schemaId: s })}
        />
      )}
      {state.step === 2 && (
        <BasicConfigStep state={state} dispatch={dispatch} />
      )}
      {state.step === 3 && (
        <ThemeStep
          value={state.themeName}
          onChange={(t) => dispatch({ type: 'SET_THEME', themeName: t })}
        />
      )}
      {state.step === 4 && <ExportStep state={state} />}

      {/* Navigation buttons */}
      <div className="mt-8 flex justify-between">
        <Button
          variant="outline"
          onClick={() => dispatch({ type: 'SET_STEP', step: state.step - 1 })}
          disabled={state.step === 0}
        >
          上一步
        </Button>
        {!isLastStep && (
          <Button
            onClick={() =>
              dispatch({ type: 'SET_STEP', step: state.step + 1 })
            }
          >
            下一步
          </Button>
        )}
      </div>
    </div>
  )
}
