import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { KeyBindings } from './KeyBindings'
import { useConfigStore } from '@/stores/config-store'
import { FUNCTION_KEY_DEFINITIONS, FUNCTION_KEY_CATEGORIES } from '@/data/key-binding-definitions'

function renderWithRouter() {
  return render(
    <MemoryRouter>
      <KeyBindings />
    </MemoryRouter>,
  )
}

describe('<KeyBindings>', () => {
  beforeEach(() => {
    useConfigStore.getState().reset()
  })

  it('renders the main heading and description', () => {
    renderWithRouter()
    expect(screen.getByText('按键绑定')).toBeInTheDocument()
    expect(screen.getByText(/配置修饰键的中英文切换行为/)).toBeInTheDocument()
  })

  it('renders all switch key labels', () => {
    renderWithRouter()
    expect(screen.getByText('左 Shift')).toBeInTheDocument()
    expect(screen.getByText('右 Shift')).toBeInTheDocument()
    expect(screen.getByText('左 Control')).toBeInTheDocument()
    expect(screen.getByText('右 Control')).toBeInTheDocument()
    expect(screen.getByText('Caps Lock')).toBeInTheDocument()
  })

  it('renders the function key section heading', () => {
    renderWithRouter()
    expect(screen.getByText('功能快捷键')).toBeInTheDocument()
  })

  it('renders function key category labels', () => {
    renderWithRouter()
    for (const cat of FUNCTION_KEY_CATEGORIES) {
      const defs = FUNCTION_KEY_DEFINITIONS.filter((d) => d.category === cat.id)
      if (defs.length > 0) {
        expect(screen.getByText(cat.label)).toBeInTheDocument()
      }
    }
  })

  it('renders the Caps Lock toggle label', () => {
    renderWithRouter()
    expect(screen.getByText('传统 Caps Lock 行为')).toBeInTheDocument()
  })

  it('toggling a function key updates the store key bindings', async () => {
    const user = userEvent.setup()
    renderWithRouter()

    // Find a specific function key definition to test against
    const firstDef = FUNCTION_KEY_DEFINITIONS[0]!

    // Find the switch inside the same container as the first function key label.
    const label = screen.getByText(firstDef.label)
    const container = label.closest('.flex.items-center.justify-between')!
    const toggle = container.querySelector('[role="switch"]') as HTMLElement
    expect(toggle).not.toBeNull()

    await user.click(toggle)

    const bindings = useConfigStore.getState().project.defaultConfig.keyBinder.bindings
    const added = bindings.find((b) => b.accept === firstDef.defaultAccept)
    expect(added).toBeDefined()
    expect(added!.when).toBe(firstDef.when)
  })
})
