import { describe, it, expect } from 'vitest'
import { createEmptyProject } from './defaults'

describe('createEmptyProject', () => {
  it('returns a valid project with default values', () => {
    const project = createEmptyProject()
    expect(project.targetPlatform).toBe('macos')
    expect(project.defaultConfig.pageSize).toBe(5)
    expect(project.defaultConfig.schemaList).toHaveLength(1)
    expect(project.customPhrases).toEqual([])
  })

  it('returns a fresh copy each time (no shared references)', () => {
    const a = createEmptyProject()
    const b = createEmptyProject()
    a.defaultConfig.pageSize = 9
    expect(b.defaultConfig.pageSize).toBe(5)
  })
})
