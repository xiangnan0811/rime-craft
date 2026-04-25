import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LuaCodeEditor } from './LuaCodeEditor'

const codeMirrorPropsMock = vi.fn()

vi.mock('@uiw/react-codemirror', () => ({
  default: (props: Record<string, unknown>) => {
    codeMirrorPropsMock(props)
    return <div data-testid="lua-code-mirror" />
  },
}))

vi.mock('@codemirror/language', () => ({
  StreamLanguage: {
    define: () => 'lua-support',
  },
}))

vi.mock('@codemirror/legacy-modes/mode/lua', () => ({
  lua: {},
}))

describe('<LuaCodeEditor>', () => {
  it('uses a tokenized fallback while the editor is loading', () => {
    const { container } = render(
      <LuaCodeEditor value="return 1" onChange={() => {}} height="240px" />,
    )

    expect(screen.getByText('加载代码编辑器...')).toBeInTheDocument()
    const fallback = container.firstElementChild
    expect(fallback).toHaveClass('border-border')
    expect(fallback).toHaveClass('bg-card/80')
    expect(fallback).not.toHaveClass('border-slate-700')
    expect(fallback).not.toHaveClass('bg-slate-900')
  })

  it('follows app dark mode when configuring CodeMirror theme', async () => {
    document.documentElement.classList.add('dark')

    render(<LuaCodeEditor value="return 1" onChange={() => {}} />)

    await screen.findByTestId('lua-code-mirror')
    expect(codeMirrorPropsMock).toHaveBeenCalled()

    const lastCall = codeMirrorPropsMock.mock.calls[codeMirrorPropsMock.mock.calls.length - 1]
    expect(lastCall?.[0]).toMatchObject({
      theme: 'dark',
    })

    document.documentElement.classList.remove('dark')
  })
})
