import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { HomePage } from './HomePage'

describe('<HomePage>', () => {
  it('renders formal support copy instead of all-platform support copy', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    expect(screen.queryByText('全平台支持')).not.toBeInTheDocument()
    expect(screen.getByText('正式支持 macOS / Windows 导入导出')).toBeInTheDocument()
    expect(screen.getByText('教程覆盖更广的 Rime 平台生态')).toBeInTheDocument()
  })
})
