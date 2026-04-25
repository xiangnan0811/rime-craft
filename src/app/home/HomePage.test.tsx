import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { HomePage } from './HomePage'

describe('<HomePage>', () => {
  it('keeps the support-boundary copy while exposing stronger primary actions', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    expect(screen.getByText('Workbench')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Rime Craft' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '开始配置' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '新手向导' })).toBeInTheDocument()
    expect(screen.queryByText('全平台支持')).not.toBeInTheDocument()
    expect(screen.getByText('正式支持 macOS / Windows 导入导出')).toBeInTheDocument()
    expect(screen.queryByText('教程覆盖更广的 Rime 平台生态')).not.toBeInTheDocument()
    expect(screen.getByText('教程覆盖更广的 Rime 生态可用平台')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '浏览社区配置画廊' })).toBeInTheDocument()
  })
})
