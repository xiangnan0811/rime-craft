import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WorkbenchPanel } from './WorkbenchPanel'

describe('<WorkbenchPanel>', () => {
  it('renders title, subtitle, and panel content in one framed region', () => {
    render(
      <WorkbenchPanel title="教程" subtitle="当前模块关联说明">
        <div>面板内容</div>
      </WorkbenchPanel>,
    )

    expect(screen.getByText('教程')).toBeInTheDocument()
    expect(screen.getByText('当前模块关联说明')).toBeInTheDocument()
    expect(screen.getByText('面板内容')).toBeInTheDocument()
  })

  it('renders action content and forwards className to the root section', () => {
    const { container } = render(
      <WorkbenchPanel
        title="主题设置"
        actions={<button type="button">刷新</button>}
        className="min-h-0"
      >
        <div>主题表单</div>
      </WorkbenchPanel>,
    )

    expect(screen.getByRole('button', { name: '刷新' })).toBeInTheDocument()
    expect(screen.getByText('主题表单')).toBeInTheDocument()

    const root = container.firstElementChild
    expect(root).not.toBeNull()
    expect(root?.className).toContain('min-h-0')
  })
})
