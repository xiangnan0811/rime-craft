import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { AsciiMode } from './AsciiMode'
import { useConfigStore } from '@/stores/config-store'

function renderWithRouter() {
  return render(
    <MemoryRouter>
      <AsciiMode />
    </MemoryRouter>,
  )
}

describe('<AsciiMode>', () => {
  beforeEach(() => {
    useConfigStore.getState().reset()
  })

  it('renders the section heading and description', () => {
    renderWithRouter()
    expect(screen.getByText('中英文切换与应用设置')).toBeInTheDocument()
    expect(screen.getByText(/为特定应用设置默认输入模式/)).toBeInTheDocument()
  })

  it('renders the add app button', () => {
    renderWithRouter()
    expect(screen.getByText('+ 添加应用')).toBeInTheDocument()
  })

  it('renders quick-add buttons for common apps', () => {
    renderWithRouter()
    // Default platform is macos, so quick-add buttons should be present.
    // Quick-add buttons have the format "+ AppName".
    expect(screen.getByText('+ Terminal')).toBeInTheDocument()
  })

  it('displays configured apps from the store', () => {
    useConfigStore.getState().setAppOption('com.apple.Terminal', true)
    renderWithRouter()

    // The app name should be resolved from APP_DATABASE
    expect(screen.getByText('Terminal')).toBeInTheDocument()
    // The identifier should also be shown
    expect(screen.getByText('com.apple.Terminal')).toBeInTheDocument()
  })

  it('removing an app updates the store', async () => {
    const user = userEvent.setup()
    useConfigStore.getState().setAppOption('com.apple.Terminal', true)
    renderWithRouter()

    await user.click(screen.getByText('删除'))

    const appOptions = useConfigStore.getState().project.platformConfig.appOptions
    expect(appOptions['com.apple.Terminal']).toBeUndefined()
  })

  it('clicking a quick-add button adds the app to the store', async () => {
    const user = userEvent.setup()
    renderWithRouter()

    // Find the quick-add button for VS Code (an editor available on macOS)
    const vscodeButton = screen.getByText('+ VS Code')
    await user.click(vscodeButton)

    const appOptions = useConfigStore.getState().project.platformConfig.appOptions
    expect(appOptions['com.microsoft.VSCode']).toBeDefined()
    expect(appOptions['com.microsoft.VSCode']!.asciiMode).toBe(true)
  })
})
