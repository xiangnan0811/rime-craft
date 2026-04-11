import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Details } from './Details'

describe('<Details>', () => {
  it('renders title and is collapsed by default', () => {
    render(
      <Details title="Advanced topic">
        <p>Hidden body</p>
      </Details>
    )
    expect(screen.getByText('Advanced topic')).toBeInTheDocument()
    const details = screen.getByText('Advanced topic').closest('details')
    expect(details?.open).toBe(false)
  })

  it('expands when clicked', async () => {
    const user = userEvent.setup()
    render(
      <Details title="Click me">
        <p>Now visible</p>
      </Details>
    )
    await user.click(screen.getByText('Click me'))
    const details = screen.getByText('Click me').closest('details')
    expect(details?.open).toBe(true)
  })

  it('shows advanced badge when level=advanced', () => {
    render(
      <Details title="Deep dive" level="advanced">
        <p>body</p>
      </Details>
    )
    expect(screen.getByText('进阶')).toBeInTheDocument()
  })

  it('shows intermediate badge when level=intermediate', () => {
    render(
      <Details title="Mid level" level="intermediate">
        <p>body</p>
      </Details>
    )
    expect(screen.getByText('扩展')).toBeInTheDocument()
  })

  it('respects defaultOpen=true', () => {
    render(
      <Details title="Open by default" defaultOpen>
        <p>Immediately visible</p>
      </Details>
    )
    const details = screen.getByText('Open by default').closest('details')
    expect(details?.open).toBe(true)
  })
})
