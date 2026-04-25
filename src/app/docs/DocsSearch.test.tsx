import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { searchDocsMock } = vi.hoisted(() => ({
  searchDocsMock: vi.fn((query: string) => {
    if (query === '安装') {
      return [
        { id: 'what-is-rime', title: '什么是 Rime', section: '基础教程', slug: 'what-is-rime' },
        { id: 'installation', title: '安装教程', section: '基础教程', slug: 'installation' },
      ]
    }

    if (query === '空结果') {
      return []
    }

    return []
  }),
}))

vi.mock('@/lib/docs/search-index', () => ({
  searchDocs: searchDocsMock,
}))

vi.mock('@/data/tutorial-nav', () => ({
  TUTORIAL_NAV: [
    {
      title: '基础教程',
      items: [
        { slug: 'what-is-rime', title: '什么是 Rime' },
        { slug: 'installation', title: '安装教程' },
      ],
    },
  ],
}))

import { DocsSearch, SearchTrigger } from './DocsSearch'

function DocsSearchHarness() {
  const location = useLocation()

  return (
    <>
      <SearchTrigger />
      <DocsSearch />
      <div data-testid="location-display">{location.pathname}</div>
    </>
  )
}

describe('DocsSearch', () => {
  beforeEach(() => {
    searchDocsMock.mockClear()
  })

  it('uses Chinese-first visible copy and shared button shell classes for the trigger', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/docs/what-is-rime']}>
        <Routes>
          <Route path="/docs/:slug" element={<DocsSearchHarness />} />
        </Routes>
      </MemoryRouter>,
    )

    const trigger = screen.getByRole('button', { name: /搜索教程/i })
    expect(trigger).toHaveTextContent('搜索教程')
    expect(trigger.className).toContain('inline-flex')
    expect(trigger.className).toContain('h-9')
    expect(trigger.className).toContain('transition-[border-color,background-color,box-shadow,color]')
    expect(trigger.className).toContain('duration-200')

    await user.click(trigger)

    expect(await screen.findByRole('textbox', { name: '搜索教程' })).toBeInTheDocument()
  })

  it('opens with Cmd+K, filters results, supports keyboard navigation, and navigates on Enter', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/docs/what-is-rime']}>
        <Routes>
          <Route path="/docs/:slug" element={<DocsSearchHarness />} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.keyDown(window, { key: 'k', metaKey: true })

    const input = await screen.findByRole('textbox', { name: '搜索教程' })
    await user.type(input, '安装')

    await waitFor(() => {
      expect(searchDocsMock).toHaveBeenCalledWith('安装')
    })

    expect(await screen.findByRole('button', { name: /安装教程/i })).toBeInTheDocument()

    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'Enter' })

    await waitFor(() => {
      expect(screen.getByTestId('location-display')).toHaveTextContent('/docs/installation')
    })

    expect(screen.queryByRole('textbox', { name: '搜索教程' })).not.toBeInTheDocument()
  })

  it('shows the empty state and closes on Escape', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/docs/what-is-rime']}>
        <Routes>
          <Route path="/docs/:slug" element={<DocsSearchHarness />} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.keyDown(window, { key: 'k', metaKey: true })

    const input = await screen.findByRole('textbox', { name: '搜索教程' })
    await user.type(input, '空结果')

    expect(await screen.findByText('未找到相关教程。')).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'Escape' })

    await waitFor(() => {
      expect(screen.queryByRole('textbox', { name: '搜索教程' })).not.toBeInTheDocument()
    })
  })
})
