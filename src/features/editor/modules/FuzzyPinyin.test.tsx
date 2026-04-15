import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { FuzzyPinyin } from './FuzzyPinyin'
import { useConfigStore } from '@/stores/config-store'
import { FUZZY_RULE_DEFINITIONS } from '@/data/fuzzy-rules'

function renderWithRouter() {
  return render(
    <MemoryRouter>
      <FuzzyPinyin />
    </MemoryRouter>,
  )
}

describe('<FuzzyPinyin>', () => {
  beforeEach(() => {
    useConfigStore.getState().reset()
    // Set up a schema so the component renders its full UI
    useConfigStore.getState().setSchemaList([{ schema: 'rime_ice' }])
  })

  it('shows a message when no schema is configured', () => {
    useConfigStore.getState().setSchemaList([])
    renderWithRouter()
    expect(screen.getByText(/请先在「输入方案管理」中添加至少一个方案/)).toBeInTheDocument()
  })

  it('renders the section heading and description', () => {
    renderWithRouter()
    expect(screen.getByText('模糊音规则')).toBeInTheDocument()
    expect(screen.getByText(/启用模糊音后/)).toBeInTheDocument()
  })

  it('renders category headings for initials and finals', () => {
    renderWithRouter()
    expect(screen.getByText('声母模糊')).toBeInTheDocument()
    expect(screen.getByText('韵母模糊')).toBeInTheDocument()
  })

  it('renders all fuzzy rule labels', () => {
    renderWithRouter()
    for (const rule of FUZZY_RULE_DEFINITIONS) {
      expect(screen.getByText(rule.label)).toBeInTheDocument()
    }
  })

  it('toggling a rule updates the store fuzzy rules', async () => {
    const user = userEvent.setup()
    renderWithRouter()

    // Find the first initial rule's switch by its role
    // The switches are rendered with the Switch component which uses role="switch"
    const switches = screen.getAllByRole('switch')
    expect(switches.length).toBe(FUZZY_RULE_DEFINITIONS.length)

    // Click the first switch (z_zh)
    await user.click(switches[0]!)

    const rules = useConfigStore.getState().project.schemaConfigs['rime_ice']?.fuzzyRules
    expect(rules).toBeDefined()
    const zZhRule = rules!.find((r) => r.ruleId === 'z_zh')
    expect(zZhRule).toBeDefined()
    expect(zZhRule!.enabled).toBe(true)
  })

  it('toggling a rule off removes its enabled state', async () => {
    const user = userEvent.setup()

    // Pre-enable a rule
    useConfigStore.getState().setFuzzyRules('rime_ice', [
      { ruleId: 'z_zh', enabled: true },
    ])

    renderWithRouter()

    const switches = screen.getAllByRole('switch')
    // First switch corresponds to z_zh. Click to toggle off.
    await user.click(switches[0]!)

    const rules = useConfigStore.getState().project.schemaConfigs['rime_ice']?.fuzzyRules
    const zZhRule = rules?.find((r) => r.ruleId === 'z_zh')
    expect(zZhRule?.enabled).toBe(false)
  })
})
