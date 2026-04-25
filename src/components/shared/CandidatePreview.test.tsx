import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CandidatePreview } from './CandidatePreview'
import { PRESET_THEMES } from '@/data/preset-themes'

describe('<CandidatePreview>', () => {
  it('renders the fallback preview content with the converged token shell', () => {
    const { container } = render(
      <CandidatePreview input="nihao" candidates={['你好', '你']} labels={['1', '2']} />,
    )

    expect(screen.getByText('nihao')).toBeInTheDocument()
    expect(screen.getByText('你好')).toBeInTheDocument()

    const shell = container.firstElementChild
    expect(shell).toHaveClass('rounded-2xl')
    expect(shell).toHaveClass('border-border')
    expect(shell).toHaveClass('bg-card/80')
    expect(shell).toHaveClass('shadow-sm')
  })

  it('renders the themed preview inside the converged outer frame', () => {
    const { container } = render(
      <CandidatePreview
        input="nihao"
        candidates={['你好', '你']}
        labels={['1', '2']}
        theme={PRESET_THEMES[0]}
      />,
    )

    expect(screen.getByText('nihao')).toBeInTheDocument()

    const outerFrame = container.firstElementChild
    expect(outerFrame).toHaveClass('rounded-3xl')
    expect(outerFrame).toHaveClass('border-border/70')
    expect(outerFrame).toHaveClass('bg-card/50')
    expect(outerFrame).toHaveClass('shadow-sm')
  })
})
