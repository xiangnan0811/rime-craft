import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TutorialPanel } from './TutorialPanel'
import { useConfigStore } from '@/stores/config-store'

vi.mock('@/data/tutorial-loaders', () => ({
  MDX_LOADERS: {
    'schema-manager': () => Promise.resolve({
      default: () => <div>教程内容</div>,
    }),
  },
}))

vi.mock('@/components/shared/mdx-components', () => ({
  mdxComponents: {},
}))

describe('<TutorialPanel>', () => {
  beforeEach(() => {
    useConfigStore.getState().reset()
  })

  it('renders the collapsed affordance and calls the toggle handler', async () => {
    const user = userEvent.setup()
    const onToggleCollapse = vi.fn()

    render(
      <TutorialPanel
        collapsed
        onToggleCollapse={onToggleCollapse}
        onEnterImmersive={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: '展开教程面板' }))
    expect(onToggleCollapse).toHaveBeenCalledTimes(1)
  })

  it('renders expanded tutorial content and preserves collapse / immersive actions', async () => {
    const user = userEvent.setup()
    const onToggleCollapse = vi.fn()
    const onEnterImmersive = vi.fn()

    render(
      <TutorialPanel
        collapsed={false}
        onToggleCollapse={onToggleCollapse}
        onEnterImmersive={onEnterImmersive}
      />,
    )

    expect(screen.getByText('输入方案管理 · 教程')).toBeInTheDocument()
    expect(screen.getByText('保留模块说明与沉浸式阅读入口，同时减轻面板头部的视觉压力。')).toBeInTheDocument()
    expect(await screen.findByText('教程内容')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '沉浸模式' }))
    await user.click(screen.getByRole('button', { name: '收起' }))

    expect(onEnterImmersive).toHaveBeenCalledTimes(1)
    expect(onToggleCollapse).toHaveBeenCalledTimes(1)
  })
})
