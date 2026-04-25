import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EditorSidebar } from './EditorSidebar'
import { useConfigStore } from '@/stores/config-store'

describe('<EditorSidebar>', () => {
  beforeEach(() => {
    useConfigStore.getState().reset()
  })

  it('updates the active module when a visible module is selected', async () => {
    const user = userEvent.setup()
    render(<EditorSidebar />)

    await user.click(screen.getByRole('button', { name: '候选词设置' }))
    expect(useConfigStore.getState().activeModule).toBe('candidate-settings')
  })

  it('reveals non-applicable modules when showAll is enabled', async () => {
    const user = userEvent.setup()
    render(<EditorSidebar />)

    expect(screen.queryByRole('button', { name: 'Lua 扩展' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '查看所有模块…' }))

    expect(screen.getByText('Lua 扩展')).toBeInTheDocument()
    expect(screen.getAllByText('🔒').length).toBeGreaterThan(0)
  })
})
