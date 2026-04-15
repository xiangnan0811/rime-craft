import { stringify, parse, parseDocument } from 'yaml'
import type {
  EditorModule,
  RimeProject,
} from '@/types/config'
import {
  serializeDefaultConfig,
  serializePlatformConfig,
  serializeSchemaConfig,
} from '@/lib/yaml/serializer'
import { serializeCustomPhrases } from '@/lib/config/custom-phrase'
import type { PersistedSourceFile } from '@/lib/workspace/types'
import { flattenPatchEntries } from './patch-utils'
import {
  type ModuleKeyMapping,
  filterModulePatch,
  getModuleMappings,
  getModuleSourceFileName,
  mappingMatchesSourceFile,
  moduleOwnsPatchKey,
} from './module-key-map'

// ---------------------------------------------------------------------------
// YAML line helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Raw slice extraction
// ---------------------------------------------------------------------------

export function extractRawModuleYamlSlice(
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

// ---------------------------------------------------------------------------
// Parse YAML string
// ---------------------------------------------------------------------------

export function parseModuleYamlString(
  yamlString: string,
): { parsed: Record<string, unknown>; error?: string } {
  try {
    const parsed = parse(yamlString) as unknown
    if (parsed === null || parsed === undefined) {
      return { parsed: {} }
    }

    if (typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { parsed: {}, error: 'YAML \u6839\u8282\u70B9\u5FC5\u987B\u662F\u5BF9\u8C61' }
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
    return { parsed: {}, error: `YAML \u8BED\u6CD5\u9519\u8BEF: ${String(e)}` }
  }
}

// ---------------------------------------------------------------------------
// Exact-path extraction
// ---------------------------------------------------------------------------

export function extractMissingExactPathEntries(
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

// ---------------------------------------------------------------------------
// Internal helpers shared by extract functions
// ---------------------------------------------------------------------------

export function pathKey(path: string[]): string {
  return path.join('\u0000')
}

// ---------------------------------------------------------------------------
// Extraction from mapping + source file
// ---------------------------------------------------------------------------

export function extractModuleYamlFromMappingSourceFile(
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

// ---------------------------------------------------------------------------
// Serialization helpers (used by both extract-from-project and workspace)
// ---------------------------------------------------------------------------

function joinYamlSlices(slices: string[]): string {
  const normalized = slices
    .map((slice) => slice.trim())
    .filter(Boolean)

  if (normalized.length === 0) {
    return ''
  }

  return `${normalized.join('\n')}\n`
}

export function serializePatchForMapping(
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

// ---------------------------------------------------------------------------
// Public extraction functions
// ---------------------------------------------------------------------------

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
