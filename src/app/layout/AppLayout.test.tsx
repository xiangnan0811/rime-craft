import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppLayout } from './AppLayout'

describe('AppLayout', () => {
  it('separates product identity, primary navigation, and utility actions', () => {
    render(
      <MemoryRouter initialEntries={['/editor']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/editor" element={<div>editor page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: 'Rime Craft' })).toBeInTheDocument()
    expect(screen.getByText('Rime 配置工作台')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: '主导航' })).toBeInTheDocument()
    expect(screen.getByText('配置编辑器')).toBeInTheDocument()
    expect(screen.getByText('搜索教程')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Switch to dark mode' }).length).toBeGreaterThan(0)
    expect(screen.getByText('editor page')).toBeInTheDocument()
  })

  it('applies the active nav styling to the current route button', () => {
    render(
      <MemoryRouter initialEntries={['/editor']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/editor" element={<div>editor page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    const activeButton = screen.getByRole('button', { name: '配置编辑器' })
    expect(activeButton.className).toContain('bg-accent')
    expect(activeButton.className).toContain('text-accent-foreground')
  })

  it('keeps navigation buttons on the restrained transition system', () => {
    render(
      <MemoryRouter initialEntries={['/editor']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/editor" element={<div>editor page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    const activeButton = screen.getByRole('button', { name: '配置编辑器' })
    expect(activeButton.className).toContain('transition-[border-color,background-color,box-shadow,color]')
    expect(activeButton.className).toContain('duration-200')
  })

  it('restores mobile quick actions for search and dark mode instead of hiding them globally', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/editor']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/editor" element={<div>editor page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    const quickActions = screen.getByRole('group', { name: '快捷操作' })
    expect(quickActions).toBeInTheDocument()

    const searchButtons = screen.getAllByRole('button', { name: /搜索教程/i })
    expect(searchButtons.length).toBeGreaterThan(0)

    const visibleMobileSearch = searchButtons.find((button) => !button.className.includes('hidden'))

    if (!visibleMobileSearch) {
      throw new Error('Expected a visible mobile search trigger')
    }

    await user.click(visibleMobileSearch)

    expect(await screen.findByRole('textbox', { name: '搜索教程' })).toBeInTheDocument()
    expect(within(quickActions).getByRole('button', { name: 'Switch to dark mode' })).toBeInTheDocument()
  })
})
