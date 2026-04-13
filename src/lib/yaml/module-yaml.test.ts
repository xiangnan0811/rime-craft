import { describe, it, expect } from 'vitest'
import {
  extractModuleYaml,
  applyModuleYaml,
  extractModuleYamlFromSourceFile,
  applyModuleYamlToSourceFile,
} from './module-yaml'
import { createEmptyProject, DEFAULT_THEME_STYLE } from '@/lib/config/defaults'
import type { PersistedSourceFile } from '@/lib/workspace/types'

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

  it('extracts candidate-display from platform style instead of schema translator fields', () => {
    const project = createEmptyProject()
    project.platformConfig.style = { ...DEFAULT_THEME_STYLE, horizontal: true }
    project.schemaConfigs.luna_pinyin = {
      schemaId: 'luna_pinyin',
      fuzzyRules: [],
      translator: {
        enableCompletion: true,
        enableSentence: true,
        enableUserDict: true,
        initialQuality: 1.2,
        coreWordLength: 4,
        maxWordLength: 7,
        maxHomophones: 8,
        maxHomographs: 8,
        spellingHints: 30,
        alwaysShowComments: true,
      },
    }

    const yaml = extractModuleYaml('candidate-display', project)

    expect(yaml).toContain('style/horizontal: true')
    expect(yaml).not.toContain('translator/')
  })

  it('extracts comment-hints from translator and super_comment persisted surfaces', () => {
    const project = createEmptyProject()
    project.schemaConfigs.luna_pinyin = {
      schemaId: 'luna_pinyin',
      fuzzyRules: [],
      translator: {
        enableCompletion: true,
        enableSentence: true,
        enableUserDict: true,
        initialQuality: 1.2,
        coreWordLength: 4,
        maxWordLength: 7,
        maxHomophones: 8,
        maxHomographs: 8,
        spellingHints: 30,
        alwaysShowComments: false,
      },
      luaExtensions: {
        superComment: {
          candidateLength: 5,
          correctorType: '〔纠错〕',
        },
      },
    }

    const yaml = extractModuleYaml('comment-hints', project)

    expect(yaml).toContain('translator/spelling_hints: 30')
    expect(yaml).toContain('translator/always_show_comments: false')
    expect(yaml).toContain('super_comment/candidate_length: 5')
    expect(yaml).toContain('super_comment/corrector_type: 〔纠错〕')
  })

  it('does not include super_comment in lua-extensions YAML slice after ownership moves to comment-hints', () => {
    const project = createEmptyProject()
    project.schemaConfigs.luna_pinyin = {
      schemaId: 'luna_pinyin',
      fuzzyRules: [],
      luaExtensions: {
        superComment: {
          candidateLength: 5,
          correctorType: '〔纠错〕',
        },
        superProcessor: {
          backspaceLimit: true,
          segLoop: true,
          toneFallback: true,
          limitRepeated: '8,40',
        },
      },
    }

    const yaml = extractModuleYaml('lua-extensions', project)

    expect(yaml).toContain('super_processor/backspace_limit: true')
    expect(yaml).not.toContain('super_comment/candidate_length')
    expect(yaml).not.toContain('super_comment/corrector_type')
  })

  it('extracts reverse-lookup with only its own recognizer slice', () => {
    const sourceFile: PersistedSourceFile = {
      id: 'luna_pinyin.custom.yaml',
      fileName: 'luna_pinyin.custom.yaml',
      kind: 'schema',
      updatedAt: '2026-04-13T00:00:00.000Z',
      content: `patch:
  "recognizer/patterns/reverse_lookup": "^;[0-9]*$"
  "recognizer/patterns/custom_ip_query": "^/ip$"
  "reverse_lookup/prefix": "z"
  "reverse_lookup/dictionary": "stroke"
  "reverse_lookup/tips": "〔笔画〕"
`,
    }

    const yaml = extractModuleYamlFromSourceFile('reverse-lookup', sourceFile)

    expect(yaml).toContain('"recognizer/patterns/reverse_lookup": "^;[0-9]*$"')
    expect(yaml).toContain('"reverse_lookup/prefix": "z"')
    expect(yaml).not.toContain('custom_ip_query')
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

  it('applies candidate-display YAML to the platform style surface', () => {
    const project = createEmptyProject()
    project.platformConfig.style = {
      ...DEFAULT_THEME_STYLE,
      horizontal: false,
      fontFace: 'PingFang SC',
    }
    const yaml = 'style/horizontal: true\n'

    const result = applyModuleYaml('candidate-display', yaml, project)

    expect(result.error).toBeUndefined()
    expect(result.project.platformConfig.style?.horizontal).toBe(true)
    expect(result.project.platformConfig.style?.fontFace).toBe('PingFang SC')
  })

  it('applies comment-hints YAML to translator and super_comment together', () => {
    const project = createEmptyProject()
    project.schemaConfigs.luna_pinyin = {
      schemaId: 'luna_pinyin',
      fuzzyRules: [],
      translator: {
        enableCompletion: false,
        enableSentence: false,
        enableUserDict: false,
        initialQuality: 2.4,
        coreWordLength: 6,
        maxWordLength: 8,
        maxHomophones: 2,
        maxHomographs: 3,
        spellingHints: 9,
        alwaysShowComments: true,
      },
    }
    const yaml = `"translator/spelling_hints": 18
"translator/always_show_comments": false
"super_comment/candidate_length": 6
"super_comment/corrector_type": "〔提示〕"
`

    const result = applyModuleYaml('comment-hints', yaml, project)

    expect(result.error).toBeUndefined()
    expect(result.project.schemaConfigs.luna_pinyin?.translator?.spellingHints).toBe(18)
    expect(result.project.schemaConfigs.luna_pinyin?.translator?.alwaysShowComments).toBe(false)
    expect(result.project.schemaConfigs.luna_pinyin?.translator?.enableCompletion).toBe(false)
    expect(result.project.schemaConfigs.luna_pinyin?.translator?.initialQuality).toBe(2.4)
    expect(result.project.schemaConfigs.luna_pinyin?.luaExtensions?.superComment?.candidateLength).toBe(6)
    expect(result.project.schemaConfigs.luna_pinyin?.luaExtensions?.superComment?.correctorType).toBe('〔提示〕')
  })

  it('applies reverse-lookup YAML without touching unrelated recognizer patterns', () => {
    const sourceFile: PersistedSourceFile = {
      id: 'luna_pinyin.custom.yaml',
      fileName: 'luna_pinyin.custom.yaml',
      kind: 'schema',
      updatedAt: '2026-04-13T00:00:00.000Z',
      content: `patch:
  "recognizer/patterns/reverse_lookup": "^;[0-9]*$"
  "recognizer/patterns/custom_ip_query": "^/ip$"
  "reverse_lookup/prefix": "z"
  "reverse_lookup/dictionary": "stroke"
`,
    }

    const result = applyModuleYamlToSourceFile(
      'reverse-lookup',
      `"recognizer/patterns/reverse_lookup": "^:[a-z]*$"
"reverse_lookup/prefix": ":"
"reverse_lookup/dictionary": "stroke"
`,
      sourceFile,
    )

    expect(result.error).toBeUndefined()
    expect(result.sourceFile.content).toContain('"recognizer/patterns/reverse_lookup": "^:[a-z]*$"')
    expect(result.sourceFile.content).toContain('"recognizer/patterns/custom_ip_query": "^/ip$"')
    expect(result.sourceFile.content).toContain('"reverse_lookup/prefix": ":"')
  })
})
