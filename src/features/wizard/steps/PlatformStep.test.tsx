import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PlatformStep } from './PlatformStep'

describe('<PlatformStep>', () => {
  it('shows only formal editor platforms and emits the selected value', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<PlatformStep value="macos" onChange={onChange} />)

    expect(screen.getByText('macOS')).toBeInTheDocument()
    expect(screen.getByText('Windows')).toBeInTheDocument()
    expect(screen.queryByText('Linux')).not.toBeInTheDocument()
    expect(screen.queryByText('Android')).not.toBeInTheDocument()
    expect(screen.queryByText('iOS')).not.toBeInTheDocument()

    await user.click(screen.getByText('Windows'))

    expect(onChange).toHaveBeenCalledWith('windows')
  })
})
