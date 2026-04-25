import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Callout } from './Callout'

describe('Callout', () => {
  it('renders a token-based tip callout without emoji markers', () => {
    const { container } = render(<Callout calloutType="tip">测试内容</Callout>)

    expect(screen.getByText('Tip')).toBeInTheDocument()
    expect(screen.getByText('测试内容')).toBeInTheDocument()
    expect(screen.queryByText(/💡|⚠️|✅|🚨/)).not.toBeInTheDocument()

    const shell = container.firstElementChild
    expect(shell).toHaveClass('rounded-2xl')
    expect(shell).toHaveClass('border-border/80')
    expect(shell).toHaveClass('bg-card/80')
  })

  it.each([
    ['warning', 'Warning', '注意'],
    ['note', 'Note', '备注'],
    ['caution', 'Caution', '谨慎操作'],
  ] as const)('renders the %s variant with the expected semantic label', (calloutType, label, body) => {
    render(<Callout calloutType={calloutType}>{body}</Callout>)

    expect(screen.getByText(label)).toBeInTheDocument()
    expect(screen.getByText(body)).toBeInTheDocument()
  })

  it('supports directive-driven rendering when calloutType is omitted', () => {
    render(
      <Callout data-directive="warning">
        指令内容
      </Callout>,
    )

    expect(screen.getByText('Warning')).toBeInTheDocument()
    expect(screen.getByText('指令内容')).toBeInTheDocument()
  })
})
