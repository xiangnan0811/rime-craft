import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ExportStep } from './ExportStep'
import { useConfigStore } from '@/stores/config-store'
import { PRESET_THEMES } from '@/data/preset-themes'
import { SCHEMA_REGISTRY } from '@/data/schema-registry'
import type { WizardState } from '../WizardPage'

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}))

// Mock jszip and file-saver to avoid real file operations
vi.mock('jszip', () => ({
  default: vi.fn().mockImplementation(() => ({
    file: vi.fn(),
    generateAsync: vi.fn().mockResolvedValue(new Blob()),
  })),
}))
vi.mock('file-saver', () => ({
  saveAs: vi.fn(),
}))

function createWizardState(overrides?: Partial<WizardState>): WizardState {
  return {
    step: 4,
    platform: 'macos',
    schemaId: 'rime_ice',
    pageSize: 9,
    shiftLBehavior: 'commit_code',
    asciiModeApps: ['com.apple.Terminal'],
    themeName: PRESET_THEMES[0]?.name ?? 'Rime 默认',
    ...overrides,
  }
}

describe('<ExportStep>', () => {
  beforeEach(() => {
    useConfigStore.getState().reset()
  })

  it('renders the completion heading and instructions', () => {
    render(<ExportStep state={createWizardState()} />)
    expect(screen.getByText('配置完成')).toBeInTheDocument()
    expect(screen.getByText(/请确认以下配置/)).toBeInTheDocument()
  })

  it('displays the platform from wizard state', () => {
    render(<ExportStep state={createWizardState({ platform: 'windows' })} />)
    expect(screen.getByText('windows')).toBeInTheDocument()
  })

  it('displays the schema name resolved from the registry', () => {
    const state = createWizardState({ schemaId: 'rime_ice' })
    render(<ExportStep state={state} />)

    const schemaName = SCHEMA_REGISTRY.find((s) => s.id === 'rime_ice')?.name ?? 'rime_ice'
    expect(screen.getByText(schemaName)).toBeInTheDocument()
  })

  it('displays page size and shift behavior', () => {
    const state = createWizardState({ pageSize: 7, shiftLBehavior: 'inline_ascii' })
    render(<ExportStep state={state} />)

    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText('inline_ascii')).toBeInTheDocument()
  })

  it('displays ascii mode apps or "无" when empty', () => {
    const stateWithApps = createWizardState({ asciiModeApps: ['com.apple.Terminal', 'com.vscode'] })
    const { unmount } = render(<ExportStep state={stateWithApps} />)
    expect(screen.getByText('com.apple.Terminal, com.vscode')).toBeInTheDocument()
    unmount()

    const stateEmpty = createWizardState({ asciiModeApps: [] })
    render(<ExportStep state={stateEmpty} />)
    expect(screen.getByText('无')).toBeInTheDocument()
  })

  it('displays the theme name', () => {
    const themeName = PRESET_THEMES[2]?.name ?? 'Material Light'
    const state = createWizardState({ themeName })
    render(<ExportStep state={state} />)
    expect(screen.getByText(themeName)).toBeInTheDocument()
  })
})
