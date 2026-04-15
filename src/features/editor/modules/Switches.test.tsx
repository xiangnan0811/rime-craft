import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { Switches } from './Switches'
import { useConfigStore } from '@/stores/config-store'
import { SWITCH_DEFINITIONS, SWITCH_CATEGORIES, isBinarySwitch } from '@/data/switch-definitions'

function renderWithRouter() {
  return render(
    <MemoryRouter>
      <Switches />
    </MemoryRouter>,
  )
}

describe('<Switches>', () => {
  beforeEach(() => {
    useConfigStore.getState().reset()
  })

  it('shows fallback message when no schema is configured', () => {
    useConfigStore.getState().setSchemaList([])
    renderWithRouter()
    expect(screen.getByText(/请先在「输入方案管理」中添加至少一个方案/)).toBeInTheDocument()
  })

  it('renders the section heading and description with schema id', () => {
    useConfigStore.getState().setSchemaList([{ schema: 'rime_ice' }])
    renderWithRouter()
    expect(screen.getByText('开关与杂项')).toBeInTheDocument()
    expect(screen.getByText(/当前配置应用于方案：rime_ice/)).toBeInTheDocument()
  })

  it('renders switch category headings', () => {
    useConfigStore.getState().setSchemaList([{ schema: 'rime_ice' }])
    renderWithRouter()
    for (const cat of SWITCH_CATEGORIES) {
      const defs = SWITCH_DEFINITIONS.filter((d) => d.category === cat.id)
      if (defs.length > 0) {
        // Some category labels may match switch definition labels too,
        // so use getAllByText to avoid multiple-match errors.
        const matches = screen.getAllByText(cat.label)
        expect(matches.length).toBeGreaterThanOrEqual(1)
      }
    }
  })

  it('renders switch definition labels for unique entries', () => {
    useConfigStore.getState().setSchemaList([{ schema: 'rime_ice' }])
    renderWithRouter()
    // Some labels may appear in multiple places (e.g. state text matching
    // another label). Use getAllByText to confirm presence.
    for (const def of SWITCH_DEFINITIONS) {
      const matches = screen.getAllByText(def.label)
      expect(matches.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('toggling a binary switch updates the store switches', async () => {
    const user = userEvent.setup()
    useConfigStore.getState().setSchemaList([{ schema: 'rime_ice' }])
    renderWithRouter()

    // Find all role="switch" elements (binary switches render as Switch components)
    const switches = screen.getAllByRole('switch')
    expect(switches.length).toBeGreaterThan(0)

    // Click the first binary switch (emoji)
    await user.click(switches[0]!)

    const schemaConfig = useConfigStore.getState().project.schemaConfigs['rime_ice']
    expect(schemaConfig?.switches).toBeDefined()

    // Find the first binary definition to verify the update
    const firstBinaryDef = SWITCH_DEFINITIONS.find(isBinarySwitch)!
    const updatedSwitch = schemaConfig!.switches!.find(
      (s) => 'name' in s && s.name === firstBinaryDef.name,
    )
    expect(updatedSwitch).toBeDefined()
  })
})
