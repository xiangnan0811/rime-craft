import { describe, it, expect } from 'vitest'
import { renderLuaTemplate, LUA_SCRIPT_TEMPLATES } from './lua-script-templates'

describe('renderLuaTemplate', () => {
  it('replaces {name} placeholder in translator template', () => {
    const out = renderLuaTemplate('translator', 'my_script')
    expect(out).toContain('local function my_script(input, seg, env)')
    expect(out).toContain('return my_script')
    expect(out).not.toContain('{name}')
  })

  it('replaces all occurrences of {name}', () => {
    const out = renderLuaTemplate('filter', 'foo')
    expect(out.match(/foo/g)?.length).toBeGreaterThanOrEqual(2)
  })

  it('supports all three script types', () => {
    expect(LUA_SCRIPT_TEMPLATES.translator).toBeTruthy()
    expect(LUA_SCRIPT_TEMPLATES.filter).toBeTruthy()
    expect(LUA_SCRIPT_TEMPLATES.processor).toBeTruthy()
  })

  it('throws for invalid Lua identifiers', () => {
    expect(() => renderLuaTemplate('translator', '123bad')).toThrow(
      /Invalid Lua identifier/,
    )
    expect(() => renderLuaTemplate('translator', 'bad-name')).toThrow(
      /Invalid Lua identifier/,
    )
  })
})
