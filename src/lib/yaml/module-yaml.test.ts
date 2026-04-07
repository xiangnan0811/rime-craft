import { describe, it, expect } from 'vitest'
import { extractModuleYaml, applyModuleYaml } from './module-yaml'
import { createEmptyProject } from '@/lib/config/defaults'

describe('extractModuleYaml', () => {
  it('extracts candidate settings as YAML', () => {
    const project = createEmptyProject()
    project.defaultConfig.pageSize = 9
    const yaml = extractModuleYaml('candidate-settings', project)
    expect(yaml).toContain('page_size')
    expect(yaml).toContain('9')
  })

  it('extracts custom phrases as TSV', () => {
    const project = createEmptyProject()
    project.customPhrases = [{ text: '你好', code: 'nihao', weight: 1 }]
    const result = extractModuleYaml('dictionary', project)
    expect(result).toContain('你好\tnihao\t1')
  })

  it('returns empty string for module with no data', () => {
    const project = createEmptyProject()
    const yaml = extractModuleYaml('switches', project)
    expect(yaml).toBe('')
  })
})

describe('applyModuleYaml', () => {
  it('applies candidate settings from YAML', () => {
    const project = createEmptyProject()
    const yaml = 'menu/page_size: 7\nmenu/alternative_select_keys: ASDFGHJKL'
    const result = applyModuleYaml('candidate-settings', yaml, project)
    expect(result.error).toBeUndefined()
    expect(result.project.defaultConfig.pageSize).toBe(7)
    expect(result.project.defaultConfig.selectKeys).toBe('ASDFGHJKL')
  })

  it('applies custom phrases from TSV', () => {
    const project = createEmptyProject()
    const tsv = '你好\tnihao\t1\n世界\tshijie\t2'
    const result = applyModuleYaml('dictionary', tsv, project)
    expect(result.project.customPhrases).toHaveLength(2)
  })

  it('returns error for invalid YAML', () => {
    const project = createEmptyProject()
    const result = applyModuleYaml('candidate-settings', '{{invalid', project)
    expect(result.error).toBeDefined()
  })
})
