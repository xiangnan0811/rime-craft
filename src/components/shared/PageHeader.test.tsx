import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PageHeader } from './PageHeader'

describe('<PageHeader>', () => {
  it('renders title, description, and action slot content', () => {
    render(
      <PageHeader
        title="主题工作室"
        description="统一预设、编辑和预览区的页面头部"
        actions={<button>保存预设</button>}
      />,
    )

    expect(screen.getByRole('heading', { name: '主题工作室' })).toBeInTheDocument()
    expect(screen.getByText('统一预设、编辑和预览区的页面头部')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '保存预设' })).toBeInTheDocument()
  })

  it('renders eyebrow text and keeps the responsive flex shell classes', () => {
    const { container } = render(
      <PageHeader
        eyebrow="Workbench"
        title="配置编辑器"
        description="保持标题区与动作区在桌面端对齐。"
      />,
    )

    expect(screen.getByText('Workbench')).toBeInTheDocument()

    const root = container.firstElementChild
    expect(root).not.toBeNull()
    expect(root?.className).toContain('flex-col')
    expect(root?.className).toContain('md:flex-row')
  })
})
