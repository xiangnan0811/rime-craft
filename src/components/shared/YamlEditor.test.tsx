import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { YamlEditor } from './YamlEditor'

const codeMirrorPropsMock = vi.fn()

vi.mock('@uiw/react-codemirror', () => ({
  default: (props: Record<string, unknown>) => {
    codeMirrorPropsMock(props)
    return <div data-testid="code-mirror-mock" />
  },
}))

describe('<YamlEditor>', () => {
  it('shows a visible tokenized error container when yaml parsing fails', () => {
    const { container } = render(
      <YamlEditor value="schema: luna_pinyin" onChange={() => {}} error="YAML 解析失败" />,
    )

    const error = screen.getByText('YAML 解析失败')
    expect(error).toBeInTheDocument()

    const errorShell = Array.from(container.querySelectorAll('div')).find((element) =>
      element.className.includes('border-destructive/30'),
    )

    expect(errorShell).not.toBeNull()
    expect(errorShell?.className).toContain('bg-destructive/5')
  })

  it('follows app dark mode when configuring CodeMirror theme', () => {
    document.documentElement.classList.add('dark')

    render(<YamlEditor value="schema: luna_pinyin" onChange={() => {}} />)

    expect(codeMirrorPropsMock).toHaveBeenCalled()
    const lastCall = codeMirrorPropsMock.mock.calls[codeMirrorPropsMock.mock.calls.length - 1]
    expect(lastCall?.[0]).toMatchObject({
      theme: 'dark',
      className: expect.stringContaining('rounded-lg'),
    })

    document.documentElement.classList.remove('dark')
  })
})
