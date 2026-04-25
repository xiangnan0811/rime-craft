import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { getDefaultWizardAsciiModeApps } from './ascii-mode-apps'
import { wizardReducer, type WizardState } from './wizard-state'
import { BasicConfigStep } from './steps/BasicConfigStep'

describe('wizard platform-specific ASCII-mode apps', () => {
  it('derives Windows default app identifiers from the selected platform', () => {
    expect(getDefaultWizardAsciiModeApps('windows')).toEqual([
      'WindowsTerminal.exe',
      'alacritty.exe',
      'Code.exe',
      'sublime_text.exe',
      'idea64.exe',
    ])
    expect(getDefaultWizardAsciiModeApps('windows')).not.toContain(
      'com.apple.Terminal',
    )
    expect(getDefaultWizardAsciiModeApps('windows')).not.toContain(
      'com.microsoft.VSCode',
    )
  })

  it('resets stale macOS identifiers when the wizard platform changes', () => {
    const initialState: WizardState = {
      step: 0,
      platform: 'macos',
      schemaId: 'rime_ice',
      pageSize: 9,
      shiftLBehavior: 'commit_code',
      asciiModeApps: ['com.apple.Terminal', 'com.microsoft.VSCode'],
      themeName: 'default',
    }

    const nextState = wizardReducer(initialState, {
      type: 'SET_PLATFORM',
      platform: 'windows',
    })

    expect(nextState.platform).toBe('windows')
    expect(nextState.asciiModeApps).toEqual(
      getDefaultWizardAsciiModeApps('windows'),
    )
    expect(nextState.asciiModeApps).not.toContain('com.apple.Terminal')
    expect(nextState.asciiModeApps).not.toContain('com.microsoft.VSCode')
  })

  it('renders and toggles Windows app identifiers in BasicConfigStep', async () => {
    const user = userEvent.setup()
    const dispatch = vi.fn()
    const state: WizardState = {
      step: 2,
      platform: 'windows',
      schemaId: 'rime_ice',
      pageSize: 9,
      shiftLBehavior: 'commit_code',
      asciiModeApps: getDefaultWizardAsciiModeApps('windows'),
      themeName: 'default',
    }

    render(<BasicConfigStep state={state} dispatch={dispatch} />)

    expect(
      screen.getByRole('switch', { name: 'Windows Terminal' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('switch', { name: 'Terminal' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('switch', { name: 'Windows Terminal' }))

    expect(dispatch).toHaveBeenCalledWith({
      type: 'TOGGLE_APP',
      app: 'WindowsTerminal.exe',
    })
  })
})
