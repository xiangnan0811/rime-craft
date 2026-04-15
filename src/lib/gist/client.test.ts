import { describe, it, expect, vi, afterEach } from 'vitest'
import { loadPublicGist } from './client'

describe('loadPublicGist', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('rejects invalid Gist ID format', async () => {
    await expect(loadPublicGist('../malicious')).rejects.toThrow('无效的 Gist ID 格式')
  })

  it('rejects Gist ID with path traversal', async () => {
    await expect(loadPublicGist('abc123/../other')).rejects.toThrow('无效的 Gist ID 格式')
  })

  it('accepts a valid hex Gist ID and returns parsed snapshot', async () => {
    const validProject = {
      targetPlatform: 'macos',
      defaultConfig: { schemaList: [], pageSize: 5, selectKeys: '', asciiComposer: { goodOldCapsLock: false, switchKey: {} }, keyBinder: { bindings: [] } },
      platformConfig: { platform: 'macos', appOptions: {} },
      schemaConfigs: {},
      customPhrases: [],
      preserved: {},
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        files: {
          'rime-craft-config.json': {
            content: JSON.stringify({ version: 1, project: validProject }),
          },
        },
      }),
    }))
    const result = await loadPublicGist('abc123def456')
    expect(result.project.targetPlatform).toBe('macos')
  })

  it('throws on 404', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }))
    await expect(loadPublicGist('abc123')).rejects.toThrow('不存在或不是公开的')
  })

  it('extracts ID from full Gist URL', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 404 })
    vi.stubGlobal('fetch', mockFetch)
    await loadPublicGist('https://gist.github.com/user/abc123').catch(() => {})
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/gists/abc123'),
      expect.any(Object),
    )
  })
})
