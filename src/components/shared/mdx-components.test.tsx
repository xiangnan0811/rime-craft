import { createElement } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { useConfigStore } from '@/stores/config-store'
import { mdxComponents } from './mdx-components'

const warningDirectiveProps: Record<string, unknown> = {
  'data-directive': 'warning',
}

const themedPreProps: Record<string, unknown> = {
  className: 'shiki github-light',
  'data-theme': 'github-light one-dark-pro',
}

function LocationDisplay() {
  const location = useLocation()

  return <div data-testid="location-display">{location.pathname}</div>
}

function renderWithRouter(pathname: string, element: React.ReactElement) {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <Routes>
        <Route
          path="*"
          element={
            <>
              <LocationDisplay />
              {element}
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('mdxComponents', () => {
  beforeEach(() => {
    useConfigStore.getState().reset()
  })

  it('switches to the matching editor module when a tutorial relative link is clicked inside /editor', () => {
    renderWithRouter(
      '/editor',
      createElement(mdxComponents.a, { href: './candidate-settings' }, '候选词设置'),
    )

    fireEvent.click(screen.getByRole('button', { name: '候选词设置' }))

    expect(useConfigStore.getState().activeModule).toBe('candidate-settings')
    expect(screen.getByTestId('location-display')).toHaveTextContent('/editor')
  })

  it('routes unresolved tutorial relative links to the docs page', () => {
    renderWithRouter(
      '/editor',
      createElement(mdxComponents.a, { href: './what-is-rime' }, '什么是 Rime'),
    )

    const link = screen.getByRole('link', { name: '什么是 Rime' })
    expect(link).toHaveAttribute('href', '/docs/what-is-rime')

    fireEvent.click(link)

    expect(screen.getByTestId('location-display')).toHaveTextContent('/docs/what-is-rime')
  })

  it('dispatches supported directive divs to Callout shells', () => {
    render(createElement(mdxComponents.div, warningDirectiveProps, '注意事项'))

    expect(screen.getByText('Warning')).toBeInTheDocument()
    expect(screen.getByText('注意事项')).toBeInTheDocument()
  })

  it('wraps tables in a horizontal scroll container', () => {
    const { container } = render(
      createElement(
        mdxComponents.table,
        null,
        <tbody>
          <tr>
            <td>单元格</td>
          </tr>
        </tbody>,
      ),
    )

    const wrapper = container.firstElementChild

    expect(wrapper).toHaveClass('overflow-x-auto')
    expect(wrapper?.querySelector('table')).toHaveClass('w-full')
    expect(screen.getByText('单元格')).toBeInTheDocument()
  })

  it('routes fenced code blocks through CodeBlock.Pre without losing wrapper-safety classes', () => {
    const { container } = render(
      createElement(
        mdxComponents.pre,
        themedPreProps,
        createElement(mdxComponents.code, null, 'schema: luna_pinyin'),
      ),
    )

    const pre = container.querySelector('pre')
    expect(pre).not.toBeNull()
    expect(pre?.className).toContain('bg-transparent')
    expect(pre?.className).toContain('shiki')
    expect(pre?.getAttribute('data-theme')).toBe('github-light one-dark-pro')
  })
})
