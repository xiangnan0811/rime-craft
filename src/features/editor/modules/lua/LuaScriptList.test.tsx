import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LuaScriptList } from './LuaScriptList'
import { useConfigStore } from '@/stores/config-store'

describe('LuaScriptList', () => {
  beforeEach(() => {
    useConfigStore.getState().reset()
    useConfigStore.getState().setSchemaList([{ schema: 'rime_ice' }])
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('blocks deletion when a script is still referenced', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.fn(() => true)
    const alertSpy = vi.fn()
    vi.stubGlobal('confirm', confirmSpy)
    vi.stubGlobal('alert', alertSpy)

    useConfigStore.getState().addLuaScript('rime_ice', {
      fileName: 'my_translator.lua',
      scriptType: 'translator',
      description: '',
      code: '',
    })

    const scriptId =
      useConfigStore.getState().project.schemaConfigs.rime_ice?.luaScripts?.[0]?.id
    if (!scriptId) {
      throw new Error('expected script id to exist')
    }

    useConfigStore.getState().addCustomTrigger('rime_ice', {
      name: 'IP 查询',
      triggerCode: '/ip',
      description: '',
      scriptId,
    })

    render(<LuaScriptList schemaId="rime_ice" />)
    await user.click(screen.getByRole('button', { name: /删除/i }))

    expect(confirmSpy).toHaveBeenCalled()
    expect(alertSpy).toHaveBeenCalled()
    expect(
      useConfigStore.getState().project.schemaConfigs.rime_ice?.luaScripts,
    ).toHaveLength(1)
  })
})
