import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EditorPage } from './EditorPage'
import { useConfigStore } from '@/stores/config-store'

vi.mock('@/features/editor/EditorSidebar', () => ({
  EditorSidebar: ({ mobileOpen = false, onMobileClose }: { mobileOpen?: boolean; onMobileClose?: () => void }) => (
    <div>
      {mobileOpen ? 'mobile sidebar' : 'desktop sidebar'}
      {onMobileClose ? <button onClick={onMobileClose}>关闭模块导航</button> : null}
    </div>
  ),
}))

vi.mock('@/features/editor/EditorContent', () => ({
  EditorContent: () => <div>editor content</div>,
}))

vi.mock('@/features/editor/TutorialPanel', () => ({
  TutorialPanel: () => <div>tutorial panel</div>,
}))

vi.mock('@/features/editor/MobileTutorialDialog', () => ({
  MobileTutorialDialog: () => <button type="button">教程弹窗</button>,
}))

vi.mock('@/features/editor/ImmersiveView', () => ({
  ImmersiveView: () => <div>immersive view</div>,
}))

vi.mock('@/features/share/ShareDialog', () => ({
  ShareDialog: () => <button type="button">分享</button>,
}))

vi.mock('@/features/share/ImportDialog', () => ({
  ImportDialog: () => <button type="button">导入配置</button>,
}))

vi.mock('@/features/share/ExportButton', () => ({
  ExportButton: () => <button type="button">导出配置</button>,
}))

vi.mock('@/features/share/GistDialog', () => ({
  GistDialog: () => <button type="button">Gist</button>,
}))

describe('EditorPage', () => {
  beforeEach(() => {
    useConfigStore.getState().reset()
  })

  it('preserves core actions while exposing a clearer workbench heading and panel structure', () => {
    render(<EditorPage />)

    expect(screen.getByText('Workbench')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: '配置编辑器' })).toBeInTheDocument()
    expect(
      screen.getByText('在模块表单、教程说明和导入导出动作之间保持统一层级。'),
    ).toBeInTheDocument()
    expect(screen.getByText('加载预设...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '打开模块导航' })).toBeInTheDocument()

    expect(screen.getByRole('button', { name: '分享' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '导入配置' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '导出配置' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Gist' })).toBeInTheDocument()

    expect(screen.getByText('desktop sidebar')).toBeInTheDocument()
    expect(screen.getByText('editor content')).toBeInTheDocument()
    expect(screen.getByText('tutorial panel')).toBeInTheDocument()
  })

  it('opens and closes the mobile sidebar overlay from the shell action', async () => {
    const user = userEvent.setup()
    render(<EditorPage />)

    await user.click(screen.getByRole('button', { name: '打开模块导航' }))
    expect(screen.getByText('mobile sidebar')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '关闭模块导航' }))
    expect(screen.queryByText('mobile sidebar')).not.toBeInTheDocument()
  })

  it('switches to the immersive branch when editor view mode changes', () => {
    useConfigStore.getState().setViewMode('immersive')

    render(<EditorPage />)

    expect(screen.getByText('immersive view')).toBeInTheDocument()
    expect(screen.queryByText('tutorial panel')).not.toBeInTheDocument()
    expect(screen.queryByText('editor content')).not.toBeInTheDocument()
  })

  it('loads a preset project through the shell select control', async () => {
    const user = userEvent.setup()
    render(<EditorPage />)

    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByText('双拼快手'))

    expect(useConfigStore.getState().project.defaultConfig.schemaList[0]?.schema).toBe('double_pinyin_flypy')
  })
})
