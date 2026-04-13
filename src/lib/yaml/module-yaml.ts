import { stringify, parse, parseDocument } from 'yaml'
import type { EditorModule, RimeProject } from '@/types/config'
import {
  expandPatchPaths,
  mapToDefaultConfig,
  mapToPlatformConfig,
  mapToSchemaConfig,
} from '@/lib/yaml/parser'
import {
  serializeDefaultConfig,
  serializePlatformConfig,
  serializeSchemaConfig,
} from '@/lib/yaml/serializer'
import { parseCustomPhrases, serializeCustomPhrases } from '@/lib/config/custom-phrase'
import {
  getFormalPlatformFileName,
  isFormalEditorPlatform,
} from '@/lib/product/support-contract'
import type { PersistedSourceFile } from '@/lib/workspace/types'
import { DEFAULT_THEME_STYLE } from '@/lib/config/defaults'

interface ModuleKeyMapping {
  file: 'default' | 'platform' | 'schema' | 'custom_phrase';
  keys: string[];
  exactPaths?: string[];
  excludePaths?: string[];
}

const MODULE_KEY_MAP: Record<string, ModuleKeyMapping> = {
  'schema-manager': { file: 'default', keys: ['schema_list'] },
  'candidate-settings': { file: 'default', keys: ['menu'] },
  'key-bindings': { file: 'default', keys: ['ascii_composer', 'key_binder'] },
  'fuzzy-pinyin': { file: 'schema', keys: ['speller'] },
  'ascii-mode': { file: 'platform', keys: ['app_options'] },
  'punctuation': { file: 'schema', keys: ['punctuator'] },
  'dictionary': { file: 'custom_phrase', keys: [] },
  'switches': { file: 'schema', keys: ['switches'] },
  'spelling-scheme': { file: 'schema', keys: ['speller'] },
  'auxiliary-code': { file: 'schema', keys: ['speller'] },
  'reverse-lookup': {
    file: 'schema',
    keys: ['reverse_lookup'],
    exactPaths: ['recognizer/patterns/reverse_lookup'],
  },
  'lua-extensions': {
    file: 'schema',
    keys: [
      // From original special-input
      'recognizer',
      // From original lua-extensions
      'super_processor',
      'user_predict',
      'super_replacer',
      'input_statistics',
    ],
    excludePaths: ['recognizer/patterns/reverse_lookup'],
  },
  'candidate-display': {
    file: 'platform',
    keys: [],
    exactPaths: ['style/horizontal'],
  },
  'comment-hints': {
    file: 'schema',
    keys: ['super_comment'],
    exactPaths: ['translator/spelling_hints', 'translator/always_show_comments'],
  },
}

function filterModulePatch(
  patch: Record<string, unknown>,
  mapping: ModuleKeyMapping,
): Record<string, unknown> {
  const filtered: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(patch)) {
    if (moduleOwnsPatchKey(key, mapping)) {
      filtered[key] = value
      continue
    }

    if (!mapping.exactPaths || typeof value !== 'object' || value === null || Array.isArray(value)) {
      continue
    }

    for (const entry of flattenPatchEntries({ [key]: value })) {
      const entryKey = entry.path.join('/')
      if (moduleOwnsPatchKey(entryKey, mapping)) {
        filtered[entryKey] = entry.value
      }
    }
  }

  return filtered
}

function getBasePatchKey(key: string): string {
  return key.replace(/^['"]|['"]$/g, '').split('/')[0]!
}

function normalizePatchKey(key: string): string {
  return key.replace(/^['"]|['"]$/g, '')
}

function moduleOwnsPatchKey(key: string, mapping: ModuleKeyMapping): boolean {
  const normalizedKey = normalizePatchKey(key)
  if (mapping.excludePaths?.includes(normalizedKey)) {
    return false
  }

  if (mapping.exactPaths?.includes(normalizedKey)) {
    return true
  }

  return mapping.keys.includes(getBasePatchKey(normalizedKey))
}

function lineIndent(line: string): number {
  return line.match(/^\s*/)![0].length
}

function isBlankLine(line: string): boolean {
  return line.trim() === ''
}

function isCommentLine(line: string): boolean {
  return line.trimStart().startsWith('#')
}

function getPatchBlockLines(source: string): { lines: string[]; childIndent?: number } {
  const lines = source.split(/\r?\n/)
  const patchIndex = lines.findIndex((line) => /^(\s*)patch:\s*(?:#.*)?$/.test(line))
  if (patchIndex < 0) {
    return { lines: [] }
  }

  const patchIndent = lineIndent(lines[patchIndex]!)
  const blockLines: string[] = []

  for (let index = patchIndex + 1; index < lines.length; index += 1) {
    const line = lines[index]!
    if (!isBlankLine(line) && lineIndent(line) <= patchIndent) {
      break
    }
    blockLines.push(line)
  }

  const childIndent = blockLines.reduce<number | undefined>((minIndent, line) => {
    if (isBlankLine(line)) {
      return minIndent
    }

    const indent = lineIndent(line)
    if (indent <= patchIndent) {
      return minIndent
    }

    if (minIndent === undefined || indent < minIndent) {
      return indent
    }

    return minIndent
  }, undefined)

  return { lines: blockLines, childIndent }
}

function getTopLevelPatchKey(line: string, childIndent: number): string | undefined {
  if (isBlankLine(line) || isCommentLine(line) || lineIndent(line) !== childIndent) {
    return undefined
  }

  const trimmed = line.trim()
  const separatorIndex = trimmed.indexOf(':')
  if (separatorIndex <= 0) {
    return undefined
  }

  return trimmed.slice(0, separatorIndex).trim()
}

function dedentExtractedLine(line: string, childIndent: number): string {
  if (isBlankLine(line)) {
    return ''
  }

  return line.startsWith(' '.repeat(childIndent))
    ? line.slice(childIndent)
    : line
}

function trimBlankEdges(lines: string[]): string[] {
  let start = 0
  let end = lines.length

  while (start < end && lines[start] === '') {
    start += 1
  }

  while (end > start && lines[end - 1] === '') {
    end -= 1
  }

  return lines.slice(start, end)
}

function extractRawModuleYamlSlice(
  source: string,
  mapping: ModuleKeyMapping,
): string | undefined {
  const { lines, childIndent } = getPatchBlockLines(source)
  if (!childIndent) {
    return undefined
  }

  const extractedBlocks: string[][] = []
  let pendingPrefix: string[] = []
  let separatorBuffer: string[] = []
  let currentBlock:
    | {
        key: string;
        lines: string[];
      }
    | undefined

  const finalizeCurrentBlock = (): void => {
    if (!currentBlock) {
      return
    }

    if (moduleOwnsPatchKey(currentBlock.key, mapping)) {
      extractedBlocks.push(currentBlock.lines.map((line) => dedentExtractedLine(line, childIndent)))
    }

    currentBlock = undefined
  }

  for (const line of lines) {
    const topLevelKey = getTopLevelPatchKey(line, childIndent)

    if (topLevelKey) {
      const prefixLines = [...pendingPrefix, ...separatorBuffer]
      finalizeCurrentBlock()
      separatorBuffer = []
      currentBlock = {
        key: topLevelKey,
        lines: [...prefixLines, line],
      }
      pendingPrefix = []
      continue
    }

    if (!currentBlock) {
      if (isBlankLine(line) || isCommentLine(line)) {
        pendingPrefix.push(line)
      }
      continue
    }

    if ((isBlankLine(line) || isCommentLine(line)) && lineIndent(line) === childIndent) {
      separatorBuffer.push(line)
      continue
    }

    if (separatorBuffer.length > 0) {
      currentBlock.lines.push(...separatorBuffer)
      separatorBuffer = []
    }

    currentBlock.lines.push(line)
  }

  finalizeCurrentBlock()

  const outputLines = trimBlankEdges(extractedBlocks.flat())
  if (outputLines.length === 0) {
    return ''
  }

  return `${outputLines.join('\n')}\n`
}

function extractMissingExactPathEntries(
  source: string,
  mapping: ModuleKeyMapping,
  currentYaml: string,
): string {
  if (!mapping.exactPaths || mapping.exactPaths.length === 0) {
    return ''
  }

  const { parsed } = parseModuleYamlString(currentYaml)
  const existingEntries = new Set(flattenPatchEntries(parsed).map((entry) => entry.path.join('/')))
  const doc = parseDocument(source)
  if (doc.errors.length > 0) {
    return ''
  }

  const extracted: Record<string, unknown> = {}
  for (const path of mapping.exactPaths) {
    if (existingEntries.has(path)) {
      continue
    }

    const value = doc.getIn(['patch', ...path.split('/')]) as
      | { toJSON?: () => unknown }
      | undefined
    if (value === undefined) {
      continue
    }

    extracted[path] = typeof value === 'object' && value !== null && 'toJSON' in value
      ? value.toJSON!()
      : value
  }

  if (Object.keys(extracted).length === 0) {
    return ''
  }

  return stringify(extracted, { lineWidth: 0 })
}

function parseModuleYamlString(
  yamlString: string,
): { parsed: Record<string, unknown>; error?: string } {
  try {
    const parsed = parse(yamlString) as unknown
    if (parsed === null || parsed === undefined) {
      return { parsed: {} }
    }

    if (typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { parsed: {}, error: 'YAML 根节点必须是对象' }
    }

    if (
      'patch' in parsed &&
      Object.keys(parsed as Record<string, unknown>).length === 1 &&
      typeof (parsed as { patch: unknown }).patch === 'object' &&
      (parsed as { patch: unknown }).patch !== null &&
      !Array.isArray((parsed as { patch: unknown }).patch)
    ) {
      return { parsed: (parsed as { patch: Record<string, unknown> }).patch }
    }

    return { parsed: parsed as Record<string, unknown> }
  } catch (e) {
    return { parsed: {}, error: `YAML 语法错误: ${String(e)}` }
  }
}

function flattenPatchEntries(
  value: Record<string, unknown>,
  path: string[] = [],
): Array<{ path: string[]; value: unknown }> {
  const entries: Array<{ path: string[]; value: unknown }> = []

  for (const [key, child] of Object.entries(value)) {
    const nextPath = [...path, key]

    if (
      child &&
      typeof child === 'object' &&
      !Array.isArray(child) &&
      Object.keys(child as Record<string, unknown>).length > 0
    ) {
      entries.push(...flattenPatchEntries(child as Record<string, unknown>, nextPath))
      continue
    }

    entries.push({ path: nextPath, value: child })
  }

  return entries
}

function pathKey(path: string[]): string {
  return path.join('\u0000')
}

function isYamlMapNodeEmpty(node: unknown): node is { items: unknown[] } {
  return (
    typeof node === 'object' &&
    node !== null &&
    'items' in node &&
    Array.isArray((node as { items: unknown[] }).items) &&
    (node as { items: unknown[] }).items.length === 0
  )
}

function pruneEmptyParents(doc: ReturnType<typeof parseDocument>, path: string[]): void {
  for (let depth = path.length - 1; depth > 0; depth -= 1) {
    const currentPath = ['patch', ...path.slice(0, depth)]
    const node = doc.getIn(currentPath, true)
    if (!isYamlMapNodeEmpty(node)) {
      break
    }
    doc.deleteIn(currentPath)
  }
}

function getModuleSourceFileName(
  module: EditorModule,
  project: RimeProject,
): string | undefined {
  const mapping = MODULE_KEY_MAP[module]

  if (!mapping) return undefined

  if (mapping.file === 'default') {
    return 'default.custom.yaml'
  }

  if (mapping.file === 'custom_phrase') {
    return 'custom_phrase.txt'
  }

  if (mapping.file === 'platform') {
    if (!isFormalEditorPlatform(project.targetPlatform)) {
      return undefined
    }
    return getFormalPlatformFileName(project.targetPlatform)
  }

  const primarySchemaId = project.defaultConfig.schemaList[0]?.schema
  return primarySchemaId ? `${primarySchemaId}.custom.yaml` : undefined
}

export function resolveModuleSourceFile(
  module: EditorModule,
  project: RimeProject,
  sourceFiles: Record<string, PersistedSourceFile>,
): PersistedSourceFile | undefined {
  const fileName = getModuleSourceFileName(module, project)
  return fileName ? sourceFiles[fileName] : undefined
}

export function extractModuleYamlFromSourceFile(
  module: EditorModule,
  sourceFile: PersistedSourceFile,
): string {
  const mapping = MODULE_KEY_MAP[module]

  if (!mapping) return ''

  if (mapping.file === 'custom_phrase') {
    return sourceFile.content
  }

  const rawSlice = extractRawModuleYamlSlice(sourceFile.content, mapping)
  if (rawSlice !== undefined) {
    const exactPathFallback = extractMissingExactPathEntries(
      sourceFile.content,
      mapping,
      rawSlice,
    )
    if (!exactPathFallback) {
      return rawSlice
    }

    if (!rawSlice) {
      return exactPathFallback
    }

    return `${rawSlice.trimEnd()}\n${exactPathFallback}`
  }

  return ''
}

export function applyModuleYamlToSourceFile(
  module: EditorModule,
  yamlString: string,
  sourceFile: PersistedSourceFile,
): { sourceFile: PersistedSourceFile; error?: string } {
  const mapping = MODULE_KEY_MAP[module]

  if (!mapping) {
    return { sourceFile, error: `未知模块: ${module}` }
  }

  if (mapping.file === 'custom_phrase') {
    return {
      sourceFile: {
        ...sourceFile,
        content: yamlString,
        updatedAt: new Date().toISOString(),
      },
    }
  }

  const { parsed, error } = parseModuleYamlString(yamlString)
  if (error) {
    return { sourceFile, error }
  }

  const doc = parseDocument(sourceFile.content)
  if (doc.errors.length > 0) {
    return { sourceFile, error: `YAML 语法错误: ${doc.errors[0]}` }
  }

  if (doc.get('patch') === undefined) {
    doc.set('patch', {})
  }

  const currentModuleYaml = extractModuleYamlFromSourceFile(module, sourceFile)
  const currentModuleParsed = parseModuleYamlString(currentModuleYaml).parsed
  const currentEntries = flattenPatchEntries(currentModuleParsed)
  const nextEntries = flattenPatchEntries(parsed)
  const nextEntryKeys = new Set(nextEntries.map((entry) => pathKey(entry.path)))

  for (const entry of currentEntries) {
    if (nextEntryKeys.has(pathKey(entry.path))) {
      continue
    }

    doc.deleteIn(['patch', ...entry.path])
    pruneEmptyParents(doc, entry.path)
  }

  for (const entry of nextEntries) {
    doc.setIn(['patch', ...entry.path], entry.value)
  }

  return {
    sourceFile: {
      ...sourceFile,
      content: doc.toString({ lineWidth: 0 }),
      updatedAt: new Date().toISOString(),
    },
  }
}

/**
 * Extract YAML string for a specific module from the current project state.
 */
export function extractModuleYaml(module: EditorModule, project: RimeProject): string {
  const mapping = MODULE_KEY_MAP[module]

  if (!mapping) return ''

  if (mapping.file === 'custom_phrase') {
    return serializeCustomPhrases(project.customPhrases)
  }

  let fullPatch: Record<string, unknown>

  if (mapping.file === 'default') {
    fullPatch = serializeDefaultConfig(project.defaultConfig)
  } else if (mapping.file === 'platform') {
    fullPatch = serializePlatformConfig(project.platformConfig)
  } else {
    // schema
    const primarySchemaId = project.defaultConfig.schemaList[0]?.schema
    if (!primarySchemaId) return ''
    const schemaConfig = project.schemaConfigs[primarySchemaId]
    if (!schemaConfig) return ''
    fullPatch = serializeSchemaConfig(schemaConfig)
  }

  const filtered = filterModulePatch(fullPatch, mapping)

  if (Object.keys(filtered).length === 0) return ''
  return stringify(filtered, { lineWidth: 0 })
}

/**
 * Apply YAML string edits for a module back to the project.
 * Returns the updated project or an error message.
 */
export function applyModuleYaml(
  module: EditorModule,
  yamlString: string,
  project: RimeProject,
): { project: RimeProject; error?: string } {
  const mapping = MODULE_KEY_MAP[module]

  if (!mapping) return { project, error: `未知模块: ${module}` }

  if (mapping.file === 'custom_phrase') {
    try {
      const phrases = parseCustomPhrases(yamlString)
      return {
        project: { ...project, customPhrases: phrases },
      }
    } catch (e) {
      return { project, error: String(e) }
    }
  }

  const { parsed, error } = parseModuleYamlString(yamlString)
  if (error) {
    return { project, error }
  }

  const expanded = expandPatchPaths(parsed)

  if (mapping.file === 'default') {
    const defaultConfig = mapToDefaultConfig(expanded, project.defaultConfig)
    return { project: { ...project, defaultConfig } }
  }

  if (mapping.file === 'platform') {
    if (module === 'candidate-display') {
      const nextHorizontal = expanded.style && typeof (expanded.style as Record<string, unknown>).horizontal === 'boolean'
        ? ((expanded.style as Record<string, unknown>).horizontal as boolean)
        : typeof expanded['style/horizontal'] === 'boolean'
          ? (expanded['style/horizontal'] as boolean)
          : project.platformConfig.style?.horizontal

      if (typeof nextHorizontal === 'boolean') {
        const currentStyle = project.platformConfig.style
        return {
          project: {
            ...project,
            platformConfig: {
              ...project.platformConfig,
              style: currentStyle
                ? { ...currentStyle, horizontal: nextHorizontal }
                : { ...DEFAULT_THEME_STYLE, horizontal: nextHorizontal },
            },
          },
        }
      }
    }

    const platformConfig = mapToPlatformConfig(expanded, project.platformConfig)
    return { project: { ...project, platformConfig } }
  }

  // schema
  const primarySchemaId = project.defaultConfig.schemaList[0]?.schema
  if (!primarySchemaId) return { project, error: '没有选择输入方案' }

  const existingConfig = project.schemaConfigs[primarySchemaId] ?? {
    schemaId: primarySchemaId,
    fuzzyRules: [],
  }
  const schemaUpdates = mapToSchemaConfig(expanded, primarySchemaId)
  const updatedSchemaConfig = {
    ...existingConfig,
    ...schemaUpdates,
    ...(schemaUpdates.auxiliaryCode
      ? {
          auxiliaryCode: {
            ...existingConfig.auxiliaryCode,
            ...schemaUpdates.auxiliaryCode,
          },
        }
      : {}),
    ...(schemaUpdates.reverseLookup
      ? {
          reverseLookup: {
            ...existingConfig.reverseLookup,
            ...schemaUpdates.reverseLookup,
          },
        }
      : {}),
    ...(schemaUpdates.translator
      ? {
          translator: {
            ...existingConfig.translator,
            ...schemaUpdates.translator,
          },
        }
      : {}),
    ...(schemaUpdates.luaExtensions
      ? {
          luaExtensions: {
            ...existingConfig.luaExtensions,
            ...schemaUpdates.luaExtensions,
            ...(schemaUpdates.luaExtensions.superComment
              ? {
                  superComment: {
                    ...existingConfig.luaExtensions?.superComment,
                    ...schemaUpdates.luaExtensions.superComment,
                  },
                }
              : {}),
          },
        }
      : {}),
  }

  return {
    project: {
      ...project,
      schemaConfigs: {
        ...project.schemaConfigs,
        [primarySchemaId]: updatedSchemaConfig,
      },
    },
  }
}
