import { describe, expect, it } from 'vitest'
import { parseDocument } from 'yaml'
import { applyModuleYamlToSourceFile } from './module-yaml'
import type { PersistedSourceFile } from '@/lib/workspace/types'

describe('artifact round-trip editing', () => {
  it('retains comments when parseDocument patches a raw custom artifact', () => {
    const raw = `patch:
  # keep menu comment
  "menu/page_size": 5

  ascii_composer:
    # keep caps lock comment
    good_old_caps_lock: false
`

    const doc = parseDocument(raw)
    doc.setIn(['patch', 'menu/page_size'], 9)

    const output = doc.toString()
    expect(output).toContain('# keep menu comment')
    expect(output).toContain('# keep caps lock comment')
    expect(output).toContain('"menu/page_size": 9')
  })

  it('patches the default artifact without stripping surrounding comments', () => {
    const sourceFile: PersistedSourceFile = {
      id: 'default.custom.yaml',
      fileName: 'default.custom.yaml',
      kind: 'default',
      updatedAt: '2026-04-12T00:00:00.000Z',
      content: `patch:
  # keep menu comment
  "menu/page_size": 5

  ascii_composer:
    # keep caps lock comment
    good_old_caps_lock: false
`,
    }

    const result = applyModuleYamlToSourceFile(
      'candidate-settings',
      `"menu/page_size": 9
`,
      sourceFile,
    )

    expect(result.error).toBeUndefined()
    expect(result.sourceFile.content).toContain('# keep menu comment')
    expect(result.sourceFile.content).toContain('# keep caps lock comment')
    expect(result.sourceFile.content).toContain('"menu/page_size": 9')
    expect(result.sourceFile.content).toContain('good_old_caps_lock: false')
  })
})
