import { useReducer } from 'react'
import { Button } from '@/components/ui/button'
import { PlatformStep } from './steps/PlatformStep'
import { SchemaStep } from './steps/SchemaStep'
import { BasicConfigStep } from './steps/BasicConfigStep'
import { ThemeStep } from './steps/ThemeStep'
import { ExportStep } from './steps/ExportStep'
import { cn } from '@/lib/utils'
import {
  initialWizardState,
  wizardReducer,
  WIZARD_STEP_LABELS,
} from './wizard-state'

// ─── Component ───────────────────────────────────────────

export function WizardPage() {
  const [state, dispatch] = useReducer(wizardReducer, initialWizardState)

  const isLastStep = state.step === 4

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold">新手配置向导</h1>

      {/* Step indicator */}
      <div className="mb-8 flex items-center justify-between">
        {WIZARD_STEP_LABELS.map((label, i) => (
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
            {i < WIZARD_STEP_LABELS.length - 1 && (
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
