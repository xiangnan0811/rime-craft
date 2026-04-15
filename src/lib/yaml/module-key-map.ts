import type {
  EditorModule,
  ReverseLookupConfig,
  RimeProject,
  SchemaConfig,
  TranslatorConfig,
} from '@/types/config'
import { buildCustomYaml } from '@/lib/yaml/serializer'
import {
  getFormalPlatformFileName,
  isFormalEditorPlatform,
} from '@/lib/product/support-contract'
import type { PersistedSourceFile } from '@/lib/workspace/types'
import { flattenPatchEntries } from './patch-utils'

export interface ModuleKeyMapping {
  file: 'default' | 'platform' | 'schema' | 'custom_phrase';
  keys: string[];
  exactPaths?: string[];
  excludePaths?: string[];
}

export const MODULE_KEY_MAP: Record<EditorModule, ModuleKeyMapping[]> = {
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

export const CANDIDATE_SETTINGS_TRANSLATOR_FIELDS: Array<keyof TranslatorConfig> = [
  'enableCompletion',
  'enableSentence',
  'enableUserDict',
  'initialQuality',
  'coreWordLength',
  'maxWordLength',
  'maxHomophones',
  'maxHomographs',
]

export const COMMENT_HINT_TRANSLATOR_FIELDS: Array<keyof TranslatorConfig> = [
  'spellingHints',
  'alwaysShowComments',
]

export const LUA_EXTENSION_FIELDS: Array<keyof NonNullable<SchemaConfig['luaExtensions']>> = [
  'superProcessor',
  'userPredict',
  'superReplacer',
  'inputStatistics',
]

export const REVERSE_LOOKUP_FIELDS: Array<keyof ReverseLookupConfig> = [
  'prefix',
  'dictionary',
  'tips',
  'enableCompletion',
  'prism',
  'preeditFormat',
  'recognizerPattern',
]

export const DEFAULT_TRANSLATOR_CONFIG: TranslatorConfig = {
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

export const DEFAULT_REVERSE_LOOKUP_CONFIG: ReverseLookupConfig = {
  prefix: '`',
  dictionary: 'stroke',
  tips: '\u3014\u7B14\u753B\u3015',
  enableCompletion: false,
  preeditFormat: [],
}

export function getBasePatchKey(key: string): string {
  return key.replace(/^['"]|['"]$/g, '').split('/')[0]!
}

export function normalizePatchKey(key: string): string {
  return key.replace(/^['"]|['"]$/g, '')
}

export function moduleOwnsPatchKey(key: string, mapping: ModuleKeyMapping): boolean {
  const normalizedKey = normalizePatchKey(key)
  if (mapping.excludePaths?.includes(normalizedKey)) {
    return false
  }

  if (mapping.exactPaths?.includes(normalizedKey)) {
    return true
  }

  return mapping.keys.includes(getBasePatchKey(normalizedKey))
}

export function filterModulePatch(
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

export function getModuleMappings(module: EditorModule): ModuleKeyMapping[] {
  return MODULE_KEY_MAP[module] ?? []
}

export function getModuleSourceFileName(
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

export function mappingMatchesSourceFile(
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

export function createEmptySourceFile(
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
