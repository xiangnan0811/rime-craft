import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ModuleWrapper } from './ModuleWrapper'
import { useConfigStore } from '@/stores/config-store'
import type { EditorModule } from '@/types/config'

vi.mock('@/components/shared/YamlEditor', () => ({
  YamlEditor: ({
    value,
    onChange,
  }: {
    value: string
    onChange: (v: string) => void
    error?: string
  }) => (
    <textarea
      data-testid="yaml-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}))

function renderWrapper(module: EditorModule) {
  return render(
    <MemoryRouter>
      <ModuleWrapper module={module}>
        <div data-testid={`form-${module}`}>form for {module}</div>
      </ModuleWrapper>
    </MemoryRouter>,
  )
}

async function clickYamlTab(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('tab', { name: 'YAML 模式' }))
}

async function readYamlEditor(): Promise<string> {
  const editor = (await screen.findByTestId('yaml-editor')) as HTMLTextAreaElement
  return editor.value
}

describe('<ModuleWrapper> YAML mode', () => {
  beforeEach(() => {
    useConfigStore.getState().reset()
  })

  it('extracts YAML for the active module on first switch', async () => {
    const user = userEvent.setup()
    useConfigStore
      .getState()
      .setAppOption('com.apple.Terminal', true)

    renderWrapper('ascii-mode')
    await clickYamlTab(user)

    const value = await readYamlEditor()
    expect(value).toContain('com.apple.Terminal')
  })

  it('reflects form-side edits in YAML mode without manual tab toggling', async () => {
    const user = userEvent.setup()
    renderWrapper('ascii-mode')
    await clickYamlTab(user)
    const before = await readYamlEditor()
    expect(before).not.toContain('com.apple.Terminal')

    act(() => {
      useConfigStore.getState().setAppOption('com.apple.Terminal', true)
    })

    const after = await readYamlEditor()
    expect(after).toContain('com.apple.Terminal')
  })

  it('does not leak YAML state from one module into another (key={module} remount)', async () => {
    const user = userEvent.setup()
    useConfigStore
      .getState()
      .setAppOption('com.apple.Terminal', true)

    // First module: ascii-mode has content. Visit YAML tab.
    const { unmount } = renderWrapper('ascii-mode')
    await clickYamlTab(user)
    expect(await readYamlEditor()).toContain('com.apple.Terminal')
    unmount()

    // Second module: switches has nothing in default project. Should NOT
    // inherit ascii-mode's YAML even when YAML tab is opened.
    renderWrapper('switches')
    await clickYamlTab(user)
    const value = await readYamlEditor()
    expect(value).not.toContain('com.apple.Terminal')
  })

  it('shows a module scaffold when the project has no patch content yet', async () => {
    const user = userEvent.setup()
    renderWrapper('fuzzy-pinyin')
    await clickYamlTab(user)
    const value = await readYamlEditor()
    expect(value).toMatch(/^speller:/)
  })
})
