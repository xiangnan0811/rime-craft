import { describe, expect, it } from 'vitest'
import raw from './schemas-detail.json'
import { MODULE_REGISTRY } from './module-registry'

describe('schema capability contract', () => {
  it('keeps special-input-capable schemas also marked lua-extensions capable', () => {
    for (const schema of raw.schemas) {
      const caps = (schema.integration?.capabilities ?? []) as string[]
      if (caps.includes('special-input')) {
        expect(caps, schema.id).toContain('lua-extensions')
      }
    }
  })

  it('keeps special-input removed from the live module registry', () => {
    expect(MODULE_REGISTRY.some((mod) => mod.id === 'special-input')).toBe(false)
    expect(MODULE_REGISTRY.some((mod) => mod.id === 'lua-extensions')).toBe(true)
  })
})
