import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StepGuide, Step } from './StepGuide'

describe('<StepGuide>', () => {
  it('renders all step titles', () => {
    render(
      <StepGuide>
        <Step title="First step">First body</Step>
        <Step title="Second step">Second body</Step>
        <Step title="Third step">Third body</Step>
      </StepGuide>
    )
    expect(screen.getByText('First step')).toBeInTheDocument()
    expect(screen.getByText('Second step')).toBeInTheDocument()
    expect(screen.getByText('Third step')).toBeInTheDocument()
  })

  it('renders step bodies', () => {
    render(
      <StepGuide>
        <Step title="Step 1">Body content 1</Step>
      </StepGuide>
    )
    expect(screen.getByText('Body content 1')).toBeInTheDocument()
  })

  it('renders auto-numbered indicators 1, 2, 3', () => {
    render(
      <StepGuide>
        <Step title="A">a</Step>
        <Step title="B">b</Step>
        <Step title="C">c</Step>
      </StepGuide>
    )
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })
})
