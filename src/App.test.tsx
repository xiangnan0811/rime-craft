import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { compressConfig } from '@/lib/compress/share'
import { App } from './App'

const { restorePersistedWorkspace, useShareUrl } = vi.hoisted(() => ({
  restorePersistedWorkspace: vi.fn(),
  useShareUrl: vi.fn(),
}))

vi.mock('@/stores/config-store', () => ({
  useConfigStore: (selector: (state: { restorePersistedWorkspace: () => void }) => unknown) =>
    selector({ restorePersistedWorkspace }),
}))

vi.mock('@/features/share/useShareUrl', () => ({
  useShareUrl,
}))

vi.mock('@/app/layout/AppLayout', () => ({
  AppLayout: () => <div data-testid="layout" />,
}))

describe('<App>', () => {
  beforeEach(() => {
    restorePersistedWorkspace.mockClear()
    useShareUrl.mockClear()
    window.history.replaceState({}, '', '/')
  })

  it('restores the persisted workspace once on a normal startup', () => {
    render(<App />)

    expect(useShareUrl).toHaveBeenCalledTimes(1)
    expect(restorePersistedWorkspace).toHaveBeenCalledTimes(1)
  })

  it('skips persisted workspace restore when the initial URL contains a valid share payload', () => {
    const sharePayload = compressConfig({
      module: 'schema-manager',
      yaml: 'patch:\n  menu/page_size: 9',
    })

    window.history.replaceState({}, '', `/?share=${sharePayload}`)

    render(<App />)

    expect(useShareUrl).toHaveBeenCalledTimes(1)
    expect(restorePersistedWorkspace).not.toHaveBeenCalled()
  })
})
