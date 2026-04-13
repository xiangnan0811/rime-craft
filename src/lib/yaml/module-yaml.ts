import { stringify, parse, parseDocument } from 'yaml'
import type {
  CustomTrigger,
  DefaultConfig,
  EditorModule,
  LuaExtensionsConfig,
  LuaScript,
  PlatformConfig,
  ReverseLookupConfig,
  RimeProject,
  SchemaConfig,
  TranslatorConfig,
} from '@/types/config'
import {
  expandPatchPaths,
  mapToDefaultConfig,
  mapToPlatformConfig,
  mapToSchemaConfig,
} from '@/lib/yaml/parser'
import {
  buildCustomYaml,
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
import {
  DEFAULT_CONFIG,
  DEFAULT_PLATFORM_CONFIG,
  DEFAULT_THEME_STYLE,
} from '@/lib/config/defaults'
import { DEFAULT_SUPER_COMMENT_CONFIG } from '@/types/config'

interface ModuleKeyMapping {
  file: 'default' | 'platform' | 'schema' | 'custom_phrase';
  keys: string[];
  exactPaths?: string[];
  excludePaths?: string[];
}

const MODULE_KEY_MAP: Record<EditorModule, ModuleKeyMapping[]> = {
  'schema-manager': [{ file: 'default', keys: ['schema_list'] }],
  'candidate-settings': [
    { file: 'default', keys: ['menu'] },
    {
      file: 'schema',
      keys: ['translator'],
      excludePaths: ['translator/spelling_hints', 'translator/always_show_comments'],
    },
  ],
  'key-bindings': [{ file: 'default', keys: ['ascii_composer', 'key_binder'] }],
  'fuzzy-pinyin': [{ file: 'schema', keys: ['speller'] }],
  'ascii-mode': [{ file: 'platform', keys: ['app_options'] }],
  'punctuation': [{ file: 'schema', keys: ['punctuator'] }],
  'dictionary': [{ file: 'custom_phrase', keys: [] }],
  'switches': [{ file: 'schema', keys: ['switches'] }],
  'spelling-scheme': [{ file: 'schema', keys: ['speller'] }],
  'auxiliary-code': [{ file: 'schema', keys: ['speller'] }],
  'reverse-lookup': [{
    file: 'schema',
    keys: ['reverse_lookup'],
    exactPaths: ['recognizer/patterns/reverse_lookup'],
  }],
  'lua-extensions': [{
    file: 'schema',
    keys: [
      'recognizer',
      'super_processor',
      'user_predict',
      'super_replacer',
      'input_statistics',
    ],
    excludePaths: ['recognizer/patterns/reverse_lookup'],
  }],
  'candidate-display': [{
    file: 'platform',
    keys: [],
    exactPaths: ['style/horizontal'],
  }],
  'comment-hints': [{
    file: 'schema',
    keys: ['super_comment'],
    exactPaths: ['translator/spelling_hints', 'translator/always_show_comments'],
  }],
}

const CANDIDATE_SETTINGS_TRANSLATOR_FIELDS: Array<keyof TranslatorConfig> = [
  'enableCompletion',
  'enableSentence',
  'enableUserDict',
  'initialQuality',
  'coreWordLength',
  'maxWordLength',
  'maxHomophones',
  'maxHomographs',
]

const COMMENT_HINT_TRANSLATOR_FIELDS: Array<keyof TranslatorConfig> = [
  'spellingHints',
  'alwaysShowComments',
]

const LUA_EXTENSION_FIELDS: Array<keyof NonNullable<SchemaConfig['luaExtensions']>> = [
  'superProcessor',
  'userPredict',
  'superReplacer',
  'inputStatistics',
]

const REVERSE_LOOKUP_FIELDS: Array<keyof ReverseLookupConfig> = [
  'prefix',
  'dictionary',
  'tips',
  'enableCompletion',
  'prism',
  'preeditFormat',
  'recognizerPattern',
]

const DEFAULT_TRANSLATOR_CONFIG: TranslatorConfig = {
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
}

const DEFAULT_REVERSE_LOOKUP_CONFIG: ReverseLookupConfig = {
  prefix: '`',
  dictionary: 'stroke',
  tips: '〔笔画〕',
  enableCompletion: false,
  preeditFormat: [],
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

function getModuleMappings(module: EditorModule): ModuleKeyMapping[] {
  return MODULE_KEY_MAP[module] ?? []
}

function getModuleSourceFileName(
  mapping: ModuleKeyMapping,
  project: RimeProject,
): string | undefined {
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

function mappingMatchesSourceFile(
  mapping: ModuleKeyMapping,
  sourceFile: PersistedSourceFile,
): boolean {
  if (mapping.file !== sourceFile.kind) {
    return false
  }

  if (mapping.file === 'platform') {
    return !sourceFile.platform || isFormalEditorPlatform(sourceFile.platform)
  }

  return true
}

function createEmptySourceFile(
  mapping: ModuleKeyMapping,
  project: RimeProject,
): PersistedSourceFile | undefined {
  const fileName = getModuleSourceFileName(mapping, project)
  if (!fileName) {
    return undefined
  }

  const updatedAt = new Date().toISOString()
  return {
    id: fileName,
    fileName,
    kind: mapping.file,
    content: mapping.file === 'custom_phrase' ? '' : buildCustomYaml({}),
    updatedAt,
    ...(mapping.file === 'platform' && isFormalEditorPlatform(project.targetPlatform)
      ? { platform: project.targetPlatform }
      : {}),
    ...(mapping.file === 'schema'
      ? { schemaId: project.defaultConfig.schemaList[0]?.schema }
      : {}),
  }
}

export function resolveModuleSourceFile(
  module: EditorModule,
  project: RimeProject,
  sourceFiles: Record<string, PersistedSourceFile>,
): PersistedSourceFile | undefined {
  const mapping = getModuleMappings(module)[0]
  if (!mapping) {
    return undefined
  }
  const fileName = getModuleSourceFileName(mapping, project)
  return fileName ? sourceFiles[fileName] : undefined
}

function extractModuleYamlFromMappingSourceFile(
  mapping: ModuleKeyMapping,
  sourceFile: PersistedSourceFile,
): string {
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

function applyParsedModulePatchToSourceFile(
  mapping: ModuleKeyMapping,
  parsedPatch: Record<string, unknown>,
  sourceFile: PersistedSourceFile,
): { sourceFile: PersistedSourceFile; error?: string } {
  if (mapping.file === 'custom_phrase') {
    return {
      sourceFile: {
        ...sourceFile,
        content: sourceFile.content,
        updatedAt: new Date().toISOString(),
      },
    }
  }

  const doc = parseDocument(sourceFile.content)
  if (doc.errors.length > 0) {
    return { sourceFile, error: `YAML 语法错误: ${doc.errors[0]}` }
  }

  if (doc.get('patch') === undefined) {
    doc.set('patch', {})
  }

  const currentModuleYaml = extractModuleYamlFromMappingSourceFile(mapping, sourceFile)
  const currentModuleParsed = parseModuleYamlString(currentModuleYaml).parsed
  const currentEntries = flattenPatchEntries(currentModuleParsed)
  const nextEntries = flattenPatchEntries(parsedPatch)
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

export function extractModuleYamlFromSourceFile(
  module: EditorModule,
  sourceFile: PersistedSourceFile,
): string {
  const slices = getModuleMappings(module)
    .filter((mapping) => mappingMatchesSourceFile(mapping, sourceFile))
    .map((mapping) => extractModuleYamlFromMappingSourceFile(mapping, sourceFile).trim())
    .filter(Boolean)

  if (slices.length === 0) {
    return ''
  }

  return `${slices.join('\n')}\n`
}

export function applyModuleYamlToSourceFile(
  module: EditorModule,
  yamlString: string,
  sourceFile: PersistedSourceFile,
): { sourceFile: PersistedSourceFile; error?: string } {
  const mapping = getModuleMappings(module).find((entry) =>
    mappingMatchesSourceFile(entry, sourceFile),
  )
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

  return applyParsedModulePatchToSourceFile(
    mapping,
    filterModulePatch(parsed, mapping),
    sourceFile,
  )
}

function joinYamlSlices(slices: string[]): string {
  const normalized = slices
    .map((slice) => slice.trim())
    .filter(Boolean)

  if (normalized.length === 0) {
    return ''
  }

  return `${normalized.join('\n')}\n`
}

function serializePatchForMapping(
  mapping: ModuleKeyMapping,
  project: RimeProject,
): Record<string, unknown> {
  if (mapping.file === 'default') {
    return filterModulePatch(serializeDefaultConfig(project.defaultConfig), mapping)
  }

  if (mapping.file === 'platform') {
    return filterModulePatch(serializePlatformConfig(project.platformConfig), mapping)
  }

  if (mapping.file === 'schema') {
    const primarySchemaId = project.defaultConfig.schemaList[0]?.schema
    if (!primarySchemaId) {
      return {}
    }

    const schemaConfig = project.schemaConfigs[primarySchemaId]
    if (!schemaConfig) {
      return {}
    }

    return filterModulePatch(serializeSchemaConfig(schemaConfig), mapping)
  }

  return {}
}

function serializeYamlSliceForMapping(
  mapping: ModuleKeyMapping,
  project: RimeProject,
): string {
  const patch = serializePatchForMapping(mapping, project)
  if (Object.keys(patch).length === 0) {
    return ''
  }

  return stringify(patch, { lineWidth: 0 })
}

function replaceOwnedObjectFields<T extends object>(
  current: T | undefined,
  nextOwned: Partial<T> | undefined,
  defaults: Partial<T>,
  ownedFields: Array<keyof T>,
): T | undefined {
  const merged: Record<string, unknown> = {
    ...((current ?? {}) as Record<string, unknown>),
  }

  for (const field of ownedFields) {
    merged[String(field)] = nextOwned?.[field] ?? defaults[field]
  }

  return Object.keys(merged).length > 0 ? (merged as T) : undefined
}

function replaceDefaultConfigFields(
  current: DefaultConfig,
  nextOwned: Partial<DefaultConfig>,
  ownedFields: Array<keyof DefaultConfig>,
): DefaultConfig {
  const next = { ...current } as DefaultConfig & Record<string, unknown>

  for (const field of ownedFields) {
    next[field as string] = nextOwned[field] ?? DEFAULT_CONFIG[field]
  }

  return next as DefaultConfig
}

function getPrimarySchemaContext(project: RimeProject):
  | { schemaId: string; schemaConfig: SchemaConfig }
  | { error: string } {
  const schemaId = project.defaultConfig.schemaList[0]?.schema
  if (!schemaId) {
    return { error: '没有选择输入方案' }
  }

  return {
    schemaId,
    schemaConfig: project.schemaConfigs[schemaId] ?? {
      schemaId,
      fuzzyRules: [],
    },
  }
}

function replacePrimarySchemaConfig(
  project: RimeProject,
  nextSchemaConfig: SchemaConfig,
): RimeProject {
  return {
    ...project,
    schemaConfigs: {
      ...project.schemaConfigs,
      [nextSchemaConfig.schemaId]: nextSchemaConfig,
    },
  }
}

function mergeCustomTriggersByPatternId(
  currentTriggers: CustomTrigger[],
  luaScripts: LuaScript[],
  nextTriggers: CustomTrigger[],
): CustomTrigger[] {
  const currentByPatternId = new Map<string, CustomTrigger>()

  for (const trigger of currentTriggers) {
    const script = luaScripts.find((item) => item.id === trigger.scriptId)
    const patternId = script
      ? script.fileName.replace(/\.lua$/, '')
      : trigger.id
    currentByPatternId.set(patternId, trigger)
  }

  return nextTriggers.map((trigger) => {
    const patternId = trigger.name
    const current = currentByPatternId.get(patternId)
    const linkedScript = luaScripts.find((item) =>
      item.fileName.replace(/\.lua$/, '') === patternId,
    )

    return {
      id: current?.id ?? crypto.randomUUID(),
      name: current?.name ?? patternId,
      description: current?.description ?? '',
      scriptId: current?.scriptId ?? linkedScript?.id ?? '',
      triggerCode: trigger.triggerCode,
    }
  })
}

function getPlatformDefaults(
  project: RimeProject,
): PlatformConfig {
  return {
    ...DEFAULT_PLATFORM_CONFIG,
    platform:
      isFormalEditorPlatform(project.targetPlatform)
        ? project.targetPlatform
        : DEFAULT_PLATFORM_CONFIG.platform,
  }
}

export function extractModuleYamlFromWorkspace(
  module: EditorModule,
  project: RimeProject,
  sourceFiles: Record<string, PersistedSourceFile>,
): string {
  const slices = getModuleMappings(module)
    .map((mapping) => {
      const fileName = getModuleSourceFileName(mapping, project)
      const sourceFile = fileName ? sourceFiles[fileName] : undefined
      return sourceFile
        ? extractModuleYamlFromMappingSourceFile(mapping, sourceFile)
        : serializeYamlSliceForMapping(mapping, project)
    })
    .filter(Boolean)

  return slices.length > 0 ? joinYamlSlices(slices) : extractModuleYaml(module, project)
}

/**
 * Extract YAML string for a specific module from the current project state.
 */
export function extractModuleYaml(module: EditorModule, project: RimeProject): string {
  const mappings = getModuleMappings(module)

  if (mappings.length === 0) return ''

  if (mappings[0]?.file === 'custom_phrase') {
    return serializeCustomPhrases(project.customPhrases)
  }

  const combined = mappings.reduce<Record<string, unknown>>((acc, mapping) => {
    Object.assign(acc, serializePatchForMapping(mapping, project))
    return acc
  }, {})

  if (Object.keys(combined).length === 0) return ''
  return stringify(combined, { lineWidth: 0 })
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
  const mappings = getModuleMappings(module)

  if (mappings.length === 0) return { project, error: `未知模块: ${module}` }

  if (mappings[0]?.file === 'custom_phrase') {
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

  switch (module) {
    case 'schema-manager': {
      const nextDefaults = mapToDefaultConfig(expanded, DEFAULT_CONFIG)
      return {
        project: {
          ...project,
          defaultConfig: {
            ...project.defaultConfig,
            schemaList: nextDefaults.schemaList,
          },
        },
      }
    }
    case 'candidate-settings': {
      const defaultPatch = filterModulePatch(parsed, mappings[0]!)
      const schemaPatch = filterModulePatch(parsed, mappings[1]!)
      const nextDefaults = mapToDefaultConfig(expandPatchPaths(defaultPatch), DEFAULT_CONFIG)
      const schemaContext = getPrimarySchemaContext(project)
      if ('error' in schemaContext) {
        return { project, error: schemaContext.error }
      }

      const schemaUpdates = mapToSchemaConfig(
        expandPatchPaths(schemaPatch),
        schemaContext.schemaId,
      )
      const nextSchemaConfig: SchemaConfig = {
        ...schemaContext.schemaConfig,
        translator: replaceOwnedObjectFields(
          schemaContext.schemaConfig.translator,
          schemaUpdates.translator,
          DEFAULT_TRANSLATOR_CONFIG,
          CANDIDATE_SETTINGS_TRANSLATOR_FIELDS,
        ),
      }

      return {
        project: replacePrimarySchemaConfig(
          {
            ...project,
            defaultConfig: replaceDefaultConfigFields(
              project.defaultConfig,
              {
                pageSize: nextDefaults.pageSize,
                selectKeys: nextDefaults.selectKeys,
              },
              ['pageSize', 'selectKeys'],
            ),
          },
          nextSchemaConfig,
        ),
      }
    }
    case 'key-bindings': {
      const nextDefaults = mapToDefaultConfig(expanded, DEFAULT_CONFIG)
      return {
        project: {
          ...project,
          defaultConfig: replaceDefaultConfigFields(
            project.defaultConfig,
            {
              asciiComposer: nextDefaults.asciiComposer,
              keyBinder: nextDefaults.keyBinder,
            },
            ['asciiComposer', 'keyBinder'],
          ),
        },
      }
    }
    case 'ascii-mode': {
      const nextPlatform = mapToPlatformConfig(expanded, getPlatformDefaults(project))
      return {
        project: {
          ...project,
          platformConfig: {
            ...project.platformConfig,
            appOptions: nextPlatform.appOptions,
          },
        },
      }
    }
    case 'candidate-display': {
      const nextHorizontal = expanded.style &&
        typeof (expanded.style as Record<string, unknown>).horizontal === 'boolean'
        ? ((expanded.style as Record<string, unknown>).horizontal as boolean)
        : typeof expanded['style/horizontal'] === 'boolean'
          ? (expanded['style/horizontal'] as boolean)
          : DEFAULT_THEME_STYLE.horizontal

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
    case 'fuzzy-pinyin':
    case 'punctuation':
    case 'switches':
    case 'spelling-scheme':
    case 'auxiliary-code':
    case 'reverse-lookup':
    case 'comment-hints':
    case 'lua-extensions': {
      const schemaContext = getPrimarySchemaContext(project)
      if ('error' in schemaContext) {
        return { project, error: schemaContext.error }
      }

      const schemaUpdates = mapToSchemaConfig(expanded, schemaContext.schemaId)
      const currentSchema = schemaContext.schemaConfig
      let nextSchemaConfig: SchemaConfig = currentSchema

      if (module === 'fuzzy-pinyin') {
        nextSchemaConfig = {
          ...currentSchema,
          fuzzyRules: schemaUpdates.fuzzyRules ?? [],
        }
      }

      if (module === 'punctuation') {
        nextSchemaConfig = {
          ...currentSchema,
          punctuator: schemaUpdates.punctuator,
        }
      }

      if (module === 'switches') {
        nextSchemaConfig = {
          ...currentSchema,
          switches: schemaUpdates.switches,
        }
      }

      if (module === 'spelling-scheme') {
        nextSchemaConfig = {
          ...currentSchema,
          spellingScheme: schemaUpdates.spellingScheme,
        }
      }

      if (module === 'auxiliary-code') {
        nextSchemaConfig = {
          ...currentSchema,
          auxiliaryCode: schemaUpdates.auxiliaryCode,
        }
      }

      if (module === 'reverse-lookup') {
        nextSchemaConfig = {
          ...currentSchema,
          reverseLookup: replaceOwnedObjectFields(
            currentSchema.reverseLookup,
            schemaUpdates.reverseLookup,
            DEFAULT_REVERSE_LOOKUP_CONFIG,
            REVERSE_LOOKUP_FIELDS,
          ) as ReverseLookupConfig | undefined,
        }
      }

      if (module === 'comment-hints') {
        nextSchemaConfig = {
          ...currentSchema,
          translator: replaceOwnedObjectFields(
            currentSchema.translator,
            schemaUpdates.translator,
            DEFAULT_TRANSLATOR_CONFIG,
            COMMENT_HINT_TRANSLATOR_FIELDS,
          ),
          luaExtensions: replaceOwnedObjectFields(
            currentSchema.luaExtensions,
            schemaUpdates.luaExtensions,
            { superComment: DEFAULT_SUPER_COMMENT_CONFIG },
            ['superComment'],
          ),
        }
      }

      if (module === 'lua-extensions') {
        const enabledTriggers = currentSchema.specialInput?.enabledTriggers ?? []
        const currentCustomTriggers = currentSchema.specialInput?.customTriggers ?? []
        const nextCustomTriggers = mergeCustomTriggersByPatternId(
          currentCustomTriggers,
          currentSchema.luaScripts ?? [],
          schemaUpdates.specialInput?.customTriggers ?? [],
        )

        nextSchemaConfig = {
          ...currentSchema,
          luaExtensions: replaceOwnedObjectFields(
            currentSchema.luaExtensions as LuaExtensionsConfig | undefined,
            schemaUpdates.luaExtensions,
            {},
            LUA_EXTENSION_FIELDS,
          ),
          specialInput:
            enabledTriggers.length > 0 || nextCustomTriggers.length > 0
              ? {
                  enabledTriggers,
                  customTriggers: nextCustomTriggers,
                }
              : undefined,
        }
      }

      return {
        project: replacePrimarySchemaConfig(project, nextSchemaConfig),
      }
    }
    default:
      return { project }
  }
}

export function applyModuleYamlToWorkspace(
  module: EditorModule,
  yamlString: string,
  project: RimeProject,
  sourceFiles: Record<string, PersistedSourceFile>,
): { project: RimeProject; sourceFiles: Record<string, PersistedSourceFile>; error?: string } {
  const projectResult = applyModuleYaml(module, yamlString, project)
  if (projectResult.error) {
    return {
      project,
      sourceFiles,
      error: projectResult.error,
    }
  }

  const mappings = getModuleMappings(module)
  if (mappings.length === 0) {
    return {
      project,
      sourceFiles,
      error: `未知模块: ${module}`,
    }
  }

  if (mappings[0]?.file === 'custom_phrase') {
    const sourceFile = sourceFiles['custom_phrase.txt'] ?? createEmptySourceFile(mappings[0], projectResult.project)
    if (!sourceFile) {
      return {
        project: projectResult.project,
        sourceFiles,
        error: '无法定位自定义短语文件',
      }
    }

    return {
      project: projectResult.project,
      sourceFiles: {
        ...sourceFiles,
        [sourceFile.fileName]: {
          ...sourceFile,
          content: yamlString,
          updatedAt: new Date().toISOString(),
        },
      },
    }
  }

  const { parsed, error } = parseModuleYamlString(yamlString)
  if (error) {
    return { project, sourceFiles, error }
  }

  const nextSourceFiles = { ...sourceFiles }

  for (const mapping of mappings) {
    const filteredPatch = filterModulePatch(parsed, mapping)
    const currentSourceFile =
      (() => {
        const fileName = getModuleSourceFileName(mapping, projectResult.project)
        if (!fileName) {
          return undefined
        }

        return nextSourceFiles[fileName] ?? createEmptySourceFile(mapping, projectResult.project)
      })()

    if (!currentSourceFile) {
      continue
    }

    const artifactResult = applyParsedModulePatchToSourceFile(
      mapping,
      filteredPatch,
      currentSourceFile,
    )
    if (artifactResult.error) {
      return {
        project,
        sourceFiles,
        error: artifactResult.error,
      }
    }

    nextSourceFiles[currentSourceFile.fileName] = artifactResult.sourceFile
  }

  return {
    project: projectResult.project,
    sourceFiles: nextSourceFiles,
  }
}
