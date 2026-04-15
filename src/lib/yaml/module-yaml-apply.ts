import { parseDocument } from 'yaml'
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
} from '@/types/config'
import {
  expandPatchPaths,
  mapToDefaultConfig,
  mapToPlatformConfig,
  mapToSchemaConfig,
} from '@/lib/yaml/parser'
import { parseCustomPhrases } from '@/lib/config/custom-phrase'
import { isFormalEditorPlatform } from '@/lib/product/support-contract'
import type { PersistedSourceFile } from '@/lib/workspace/types'
import {
  DEFAULT_CONFIG,
  DEFAULT_PLATFORM_CONFIG,
  DEFAULT_THEME_STYLE,
} from '@/lib/config/defaults'
import { DEFAULT_SUPER_COMMENT_CONFIG } from '@/types/config'
import { flattenPatchEntries, pruneEmptyParents } from './patch-utils'
import {
  CANDIDATE_SETTINGS_TRANSLATOR_FIELDS,
  COMMENT_HINT_TRANSLATOR_FIELDS,
  DEFAULT_REVERSE_LOOKUP_CONFIG,
  DEFAULT_TRANSLATOR_CONFIG,
  LUA_EXTENSION_FIELDS,
  REVERSE_LOOKUP_FIELDS,
  createEmptySourceFile,
  filterModulePatch,
  getModuleMappings,
  getModuleSourceFileName,
  mappingMatchesSourceFile,
  type ModuleKeyMapping,
} from './module-key-map'
import {
  extractModuleYamlFromMappingSourceFile,
  parseModuleYamlString,
  pathKey,
} from './module-yaml-extract'

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

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
    return { error: '\u6CA1\u6709\u9009\u62E9\u8F93\u5165\u65B9\u6848' }
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

// ---------------------------------------------------------------------------
// Apply parsed patch to a single source file
// ---------------------------------------------------------------------------

export function applyParsedModulePatchToSourceFile(
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
    return { sourceFile, error: `YAML \u8BED\u6CD5\u9519\u8BEF: ${doc.errors[0]}` }
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

// ---------------------------------------------------------------------------
// Apply YAML string to a single source file
// ---------------------------------------------------------------------------

export function applyModuleYamlToSourceFile(
  module: EditorModule,
  yamlString: string,
  sourceFile: PersistedSourceFile,
): { sourceFile: PersistedSourceFile; error?: string } {
  const mapping = getModuleMappings(module).find((entry) =>
    mappingMatchesSourceFile(entry, sourceFile),
  )
  if (!mapping) {
    return { sourceFile, error: `\u672A\u77E5\u6A21\u5757: ${module}` }
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

// ---------------------------------------------------------------------------
// Apply YAML edits to the project model (the large switch statement)
// ---------------------------------------------------------------------------

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

  if (mappings.length === 0) return { project, error: `\u672A\u77E5\u6A21\u5757: ${module}` }

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

// ---------------------------------------------------------------------------
// Apply YAML edits to the workspace (project model + source files)
// ---------------------------------------------------------------------------

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
      error: `\u672A\u77E5\u6A21\u5757: ${module}`,
    }
  }

  if (mappings[0]?.file === 'custom_phrase') {
    const sourceFile = sourceFiles['custom_phrase.txt'] ?? createEmptySourceFile(mappings[0], projectResult.project)
    if (!sourceFile) {
      return {
        project: projectResult.project,
        sourceFiles,
        error: '\u65E0\u6CD5\u5B9A\u4F4D\u81EA\u5B9A\u4E49\u77ED\u8BED\u6587\u4EF6',
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
