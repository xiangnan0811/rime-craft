import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('./DocsMobileSidebar', () => ({
  DocsMobileSidebar: () => <button type="button">打开教程导航</button>,
}))

vi.mock('./DocsToc', () => ({
  DocsToc: ({ slug }: { slug?: string }) => <div data-testid="docs-toc">toc:{slug ?? 'none'}</div>,
}))

import { DocsLayout } from './DocsLayout'

describe('DocsLayout', () => {
  it('renders mobile header, tutorial navigation, active link state, and toc integration in one shell', () => {
    render(
      <MemoryRouter initialEntries={['/docs/what-is-rime']}>
        <Routes>
          <Route path="/docs/:slug" element={<DocsLayout />}>
            <Route path="/docs/:slug" element={<div>docs body</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('docs body')).toBeInTheDocument()
    expect(screen.getByText('Knowledge')).toBeInTheDocument()
    expect(screen.getByText('教程导航')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '打开教程导航' })).toBeInTheDocument()

    const nav = screen.getByRole('navigation', { name: '教程导航' })
    expect(nav).toBeInTheDocument()

    const activeLink = screen.getByRole('link', { name: 'Rime 是什么' })
    expect(activeLink.className).toContain('ring-1')
    expect(activeLink.className).toContain('ring-border')

    expect(screen.getByTestId('docs-toc')).toHaveTextContent('toc:what-is-rime')
  })
})
