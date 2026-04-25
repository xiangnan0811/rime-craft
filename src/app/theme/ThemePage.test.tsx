import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemePage } from './ThemePage'
import { useConfigStore } from '@/stores/config-store'
import { PRESET_THEMES } from '@/data/preset-themes'

vi.mock('@/components/shared/CandidatePreview', () => ({
  CandidatePreview: ({
    input,
    darkMode,
    theme,
  }: {
    input?: string
    darkMode?: boolean
    theme?: { name?: string }
  }) => <div>{`candidate preview:${input ?? ''}:${darkMode ? 'dark' : 'light'}:${theme?.name ?? ''}`}</div>,
}))

vi.mock('@/features/simulator/SimulatorPanel', () => ({
  SimulatorPanel: () => <div>simulator panel</div>,
}))

describe('ThemePage', () => {
  beforeEach(() => {
    useConfigStore.getState().reset()
  })

  it('renders a studio-style heading with preset, editor, and preview surfaces', async () => {
    const { container } = render(<ThemePage />)

    await screen.findByText('预设主题')

    const headerBand = Array.from(container.querySelectorAll('div')).find((element) =>
      typeof element.className === 'string'
      && element.className.includes('border-b border-border/80 bg-background/70 px-4 py-3 backdrop-blur md:px-6'))
    expect(headerBand).toBeTruthy()

    expect(screen.getByText('Workbench')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '主题工作室' })).toBeInTheDocument()
    expect(
      screen.getByText('统一预设入口、主题编辑区与候选窗预览区，让页面更像设计工作台而不是参数表单。'),
    ).toBeInTheDocument()
    expect(screen.getByText('主题设置')).toBeInTheDocument()
    expect(screen.getByText('候选窗预览')).toBeInTheDocument()
    expect(screen.getByText('预览控制')).toBeInTheDocument()
    expect(screen.getByText('预设主题')).toBeInTheDocument()
    expect(screen.getByText('预览文本')).toBeInTheDocument()
    expect(screen.getByText(`candidate preview:nihao:light:${PRESET_THEMES[0]!.name}`)).toBeInTheDocument()
    expect(screen.getByText('simulator panel')).toBeInTheDocument()
  })

  it('initializes the first preset theme when the store has no style yet', async () => {
    render(<ThemePage />)

    await screen.findByText('预设主题')
    expect(useConfigStore.getState().project.platformConfig.style?.name).toBe(PRESET_THEMES[0]!.name)
  })

  it('updates preview text and toggles horizontal / dark preview controls', async () => {
    const user = userEvent.setup()
    render(<ThemePage />)

    await screen.findByText('预设主题')

    const input = screen.getByLabelText('预览文本')
    await user.clear(input)
    await user.type(input, 'shurufa')
    expect(screen.getByDisplayValue('shurufa')).toBeInTheDocument()
    expect(screen.getByText(`candidate preview:shurufa:light:${PRESET_THEMES[0]!.name}`)).toBeInTheDocument()

    const previewControlsPanel = screen.getByRole('heading', { name: '预览控制' }).closest('section')
    expect(previewControlsPanel).toBeTruthy()
    if (!previewControlsPanel) {
      throw new Error('Expected preview controls panel section to exist')
    }

    const switches = within(previewControlsPanel).getAllByRole('switch')
    expect(switches).toHaveLength(2)

    const horizontalSwitch = switches[0]
    const darkModeSwitch = switches[1]
    if (!horizontalSwitch || !darkModeSwitch) {
      throw new Error('Expected both preview control switches to exist')
    }

    await user.click(horizontalSwitch)
    expect(useConfigStore.getState().project.platformConfig.style?.horizontal).toBe(true)
    expect(within(previewControlsPanel).getByText('横排')).toBeInTheDocument()

    await user.click(darkModeSwitch)
    expect(within(previewControlsPanel).getByText('暗色背景')).toBeInTheDocument()
    expect(screen.getByText(`candidate preview:shurufa:dark:${PRESET_THEMES[0]!.name}`)).toBeInTheDocument()
  })
})
