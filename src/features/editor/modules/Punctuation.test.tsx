import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { Punctuation } from './Punctuation'
import { useConfigStore } from '@/stores/config-store'

function renderWithRouter() {
  return render(
    <MemoryRouter>
      <Punctuation />
    </MemoryRouter>,
  )
}

describe('Punctuation helper functions', () => {
  // Test the valueToString and stringToValue logic inline since they're not exported.
  // We verify them through the component's behavior and equivalent logic.

  it('valueToString: joins array values with comma-space', () => {
    // Replicating the internal valueToString logic
    const valueToString = (val: string | string[]): string =>
      Array.isArray(val) ? val.join(', ') : val

    expect(valueToString('，')).toBe('，')
    expect(valueToString(['/', '÷'])).toBe('/, ÷')
    expect(valueToString(['a', 'b', 'c'])).toBe('a, b, c')
  })

  it('stringToValue: splits comma-separated string back to array when original is array', () => {
    const stringToValue = (str: string, original: string | string[]): string | string[] => {
      if (Array.isArray(original)) {
        return str.split(',').map((s) => s.trim()).filter(Boolean)
      }
      return str
    }

    expect(stringToValue('，', '，')).toBe('，')
    expect(stringToValue('/, ÷', ['/', '÷'])).toEqual(['/', '÷'])
    expect(stringToValue('a, b, c', ['x'])).toEqual(['a', 'b', 'c'])
    // Edge case: empty input with array original
    expect(stringToValue('', ['x'])).toEqual([])
  })
})

describe('<Punctuation>', () => {
  beforeEach(() => {
    useConfigStore.getState().reset()
    useConfigStore.getState().setSchemaList([{ schema: 'rime_ice' }])
  })

  it('shows a message when no schema is configured', () => {
    useConfigStore.getState().setSchemaList([])
    renderWithRouter()
    expect(screen.getByText(/请先在「输入方案管理」中添加至少一个方案/)).toBeInTheDocument()
  })

  it('renders the section heading', () => {
    renderWithRouter()
    expect(screen.getByText('标点符号映射')).toBeInTheDocument()
  })

  it('renders table headers', () => {
    renderWithRouter()
    expect(screen.getByText('键（输入）')).toBeInTheDocument()
    expect(screen.getByText('输出')).toBeInTheDocument()
  })

  it('renders punctuation keys from the default half shape map', () => {
    renderWithRouter()
    // Check a few representative keys are rendered
    expect(screen.getByText(',')).toBeInTheDocument()
    expect(screen.getByText('.')).toBeInTheDocument()
    expect(screen.getByText('?')).toBeInTheDocument()
  })

  it('renders a reset button', () => {
    renderWithRouter()
    expect(screen.getByText('重置为默认')).toBeInTheDocument()
  })

  it('changing an input value updates the store punctuator', async () => {
    const user = userEvent.setup()
    renderWithRouter()

    // Find the input for the comma key - the default output is '，'
    const inputs = screen.getAllByRole('textbox')
    expect(inputs.length).toBeGreaterThan(0)

    // Find the input that has the comma mapping value
    const commaInput = inputs.find((input) => (input as HTMLInputElement).value === '，')
    expect(commaInput).toBeDefined()

    // Clear and type new value
    await user.clear(commaInput!)
    await user.type(commaInput!, ',')

    const punctuator = useConfigStore.getState().project.schemaConfigs['rime_ice']?.punctuator
    expect(punctuator?.halfShape[',']).toBe(',')
  })
})
