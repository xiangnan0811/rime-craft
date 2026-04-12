import { describe, it, expect } from 'vitest'
import {
  compressConfig,
  decompressConfig,
  createConfigSnapshot,
  parseConfigSnapshot,
} from './share'
import { createEmptyProject } from '@/lib/config/defaults'
import { createSourceFilesFromProject } from '@/lib/workspace/source-files'

describe('compressConfig / decompressConfig', () => {
  it('round-trips correctly', () => {
    const data = { module: 'fuzzy-pinyin', yaml: 'test: value' }
    const compressed = compressConfig(data)
    const result = decompressConfig(compressed)
    expect(result).toEqual(data)
  })

  it('returns null for invalid compressed data', () => {
    expect(decompressConfig('invalid')).toBeNull()
  })

  it('produces URL-safe output', () => {
    const data = { key: '你好世界' }
    const compressed = compressConfig(data)
    // Should not contain characters that need URL encoding
    expect(compressed).not.toContain(' ')
    expect(compressed).not.toContain('#')
  })
})

describe('createConfigSnapshot / parseConfigSnapshot', () => {
  it('round-trips project and sourceFiles through snapshot', () => {
    const project = createEmptyProject()
    project.defaultConfig.pageSize = 9
    project.customPhrases = [
      { text: '你好', code: 'nihao', weight: 1 },
    ]
    const sourceFiles = createSourceFilesFromProject(project)
    const snapshot = createConfigSnapshot(project, sourceFiles)
    const json = JSON.stringify(snapshot)
    const result = parseConfigSnapshot(json)
    expect(result.error).toBeUndefined()
    expect(result.snapshot!.version).toBe(1)
    expect(result.snapshot!.project.defaultConfig.pageSize).toBe(9)
    expect(result.snapshot!.sourceFiles).toEqual(sourceFiles)
  })

  it('synthesizes sourceFiles for legacy snapshots without them', () => {
    const project = createEmptyProject()
    project.defaultConfig.pageSize = 7
    project.customPhrases = [
      { text: '世界', code: 'shijie', weight: 2 },
    ]

    const result = parseConfigSnapshot(
      JSON.stringify({
        version: 1,
        createdAt: '2026-04-13T00:00:00.000Z',
        project,
      }),
    )

    expect(result.error).toBeUndefined()
    const sourceFiles = result.snapshot!.sourceFiles
    const expectedSourceFiles = createSourceFilesFromProject(project)

    expect(sourceFiles).toBeDefined()
    expect(Object.keys(sourceFiles!)).toEqual(Object.keys(expectedSourceFiles))

    for (const [id, expectedFile] of Object.entries(expectedSourceFiles)) {
      const actualFile = sourceFiles![id]
      expect(actualFile).toBeDefined()
      expect(actualFile!.id).toBe(expectedFile.id)
      expect(actualFile!.fileName).toBe(expectedFile.fileName)
      expect(actualFile!.kind).toBe(expectedFile.kind)
      expect(actualFile!.content).toBe(expectedFile.content)
      expect(actualFile!.platform).toBe(expectedFile.platform)
      expect(actualFile!.schemaId).toBe(expectedFile.schemaId)
      expect(actualFile!.updatedAt).toEqual(expect.any(String))
    }
  })

  it('falls back to synthesized sourceFiles when provided sourceFiles are invalid', () => {
    const project = createEmptyProject()
    project.defaultConfig.pageSize = 11

    const result = parseConfigSnapshot(
      JSON.stringify({
        version: 1,
        createdAt: '2026-04-13T00:00:00.000Z',
        project,
        sourceFiles: {
          'default.custom.yaml': {
            id: 'default.custom.yaml',
            fileName: 'default.custom.yaml',
            kind: 'invalid-kind',
            content: 'broken',
            updatedAt: '2026-04-13T00:00:00.000Z',
          },
        },
      }),
    )

    expect(result.error).toBeUndefined()

    const expectedSourceFiles = createSourceFilesFromProject(project)
    const expectedDefaultFile = expectedSourceFiles['default.custom.yaml']
    const defaultFile = result.snapshot!.sourceFiles['default.custom.yaml']
    expect(expectedDefaultFile).toBeDefined()
    expect(defaultFile).toBeDefined()
    expect(defaultFile!).toMatchObject({
      id: expectedDefaultFile!.id,
      fileName: expectedDefaultFile!.fileName,
      kind: expectedDefaultFile!.kind,
      content: expectedDefaultFile!.content,
    })
    expect(defaultFile!.content).not.toBe(
      'broken',
    )
  })

  it('rejects invalid version', () => {
    const result = parseConfigSnapshot(
      JSON.stringify({ version: 2, project: {} }),
    )
    expect(result.error).toContain('不支持的版本')
  })

  it('rejects missing project', () => {
    const result = parseConfigSnapshot(JSON.stringify({ version: 1 }))
    expect(result.error).toContain('缺少 project')
  })

  it('rejects invalid JSON', () => {
    const result = parseConfigSnapshot('not json')
    expect(result.error).toContain('JSON')
  })
})
