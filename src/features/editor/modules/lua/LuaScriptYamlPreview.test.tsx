import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LuaScriptYamlPreview } from './LuaScriptYamlPreview'

describe('<LuaScriptYamlPreview>', () => {
  it('uses tokenized preview chrome instead of hard-coded gray/slate shells', () => {
    const { container } = render(
      <LuaScriptYamlPreview
        script={{
          id: 'script-1',
          fileName: 'my_translator.lua',
          scriptType: 'translator',
          description: '',
          code: '',
        }}
      />,
    )

    expect(screen.getByText('自动生成的 YAML patch（保存时合并到 schema）')).toBeInTheDocument()
    expect(screen.getByText(/lua_translator@my_translator/)).toBeInTheDocument()

    const shell = container.firstElementChild
    expect(shell).toHaveClass('border-border')
    expect(shell).toHaveClass('bg-card/80')
    expect(shell).not.toHaveClass('border-gray-200')
    expect(shell).not.toHaveClass('bg-gray-50')
  })
})
