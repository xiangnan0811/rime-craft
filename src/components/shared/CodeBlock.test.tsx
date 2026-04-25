import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Pre } from './CodeBlock'

describe('<CodeBlock.Pre>', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    })
  })

  it('uses Chinese copy affordances for titled code blocks', async () => {
    render(
      <Pre data-language="yaml">
        <code>schema: luna_pinyin</code>
      </Pre>,
    )

    expect(screen.getByText('yaml')).toBeInTheDocument()
    const copyButton = screen.getByRole('button', { name: '复制代码' })
    expect(copyButton).toHaveTextContent('复制')

    fireEvent.click(copyButton)

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('schema: luna_pinyin')
    expect(await screen.findByText('已复制')).toBeInTheDocument()
  })

  it('keeps the inner pre transparent so wrapper chrome owns the background', () => {
    const { container } = render(
      <Pre>
        <code>key: value</code>
      </Pre>,
    )

    const pre = container.querySelector('pre')
    expect(pre).not.toBeNull()
    expect(pre?.className).toContain('bg-transparent')
  })

  it('merges incoming pre classes instead of dropping the wrapper-safety classes', () => {
    const { container } = render(
      <Pre className="shiki github-light" data-theme="github-light one-dark-pro">
        <code>key: value</code>
      </Pre>,
    )

    const pre = container.querySelector('pre')
    expect(pre).not.toBeNull()
    expect(pre?.className).toContain('bg-transparent')
    expect(pre?.className).toContain('shiki')
    expect(pre?.getAttribute('data-theme')).toBe('github-light one-dark-pro')
  })
})
