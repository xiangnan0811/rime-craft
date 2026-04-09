import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { KeyboardLayout } from '../KeyboardLayout'
import type { KeyboardLayoutData } from '@/types/schema'

const MOCK_LAYOUT: KeyboardLayoutData = {
  name: '测试双拼',
  rows: [
    [
      { key: 'Q', initial: 'q', final: 'iu' },
      { key: 'W', initial: 'w', final: 'ei' },
    ],
    [
      { key: 'A', initial: null, final: 'a' },
      { key: ';', initial: null, final: 'ing', isSpecial: true },
    ],
    [
      { key: 'V', initial: 'zh', final: 'ui', isDualRole: true },
    ],
  ],
}

describe('KeyboardLayout', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders all keys from the layout data', () => {
    render(<KeyboardLayout data={MOCK_LAYOUT} />)
    expect(screen.getByText('Q')).toBeInTheDocument()
    expect(screen.getByText('W')).toBeInTheDocument()
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText(';')).toBeInTheDocument()
    expect(screen.getByText('V')).toBeInTheDocument()
  })

  it('renders final mappings for each key', () => {
    render(<KeyboardLayout data={MOCK_LAYOUT} />)
    expect(screen.getByText('iu')).toBeInTheDocument()
    expect(screen.getByText('ei')).toBeInTheDocument()
    expect(screen.getByText('ing')).toBeInTheDocument()
  })

  it('renders the layout name', () => {
    render(<KeyboardLayout data={MOCK_LAYOUT} />)
    expect(screen.getByText('测试双拼')).toBeInTheDocument()
  })

  it('applies special style to isSpecial keys', () => {
    render(<KeyboardLayout data={MOCK_LAYOUT} />)
    const semicolonKey = screen.getByText(';').closest('[data-key]')
    expect(semicolonKey).toHaveAttribute('data-special', 'true')
  })

  it('applies dual-role style to isDualRole keys', () => {
    render(<KeyboardLayout data={MOCK_LAYOUT} />)
    const vKey = screen.getByText('V').closest('[data-key]')
    expect(vKey).toHaveAttribute('data-dual-role', 'true')
  })
})
