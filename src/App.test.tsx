import { useEffect } from 'react'
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
    useShareUrl.mockImplementation(() => {})
    window.history.replaceState({}, '', '/')
  })

  it('restores the persisted workspace once on a normal startup', () => {
    render(<App />)

    expect(useShareUrl).toHaveBeenCalledTimes(1)
    expect(restorePersistedWorkspace).toHaveBeenCalledTimes(1)
  })

  it('restores the persisted workspace before the share import effect runs at startup', () => {
    const startupOrder: string[] = []
    const sharePayload = compressConfig({
      module: 'schema-manager',
      yaml: 'patch:\n  menu/page_size: 9',
    })

    restorePersistedWorkspace.mockImplementation(() => {
      startupOrder.push('restore')
    })
    useShareUrl.mockImplementation(() => {
      useEffect(() => {
        startupOrder.push('share')
      }, [])
    })
    window.history.replaceState({}, '', `/?share=${sharePayload}`)

    render(<App />)

    expect(useShareUrl).toHaveBeenCalledTimes(1)
    expect(restorePersistedWorkspace).toHaveBeenCalledTimes(1)
    expect(startupOrder).toEqual(['restore', 'share'])
  })
})
