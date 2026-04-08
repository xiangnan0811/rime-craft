import { stringify, parse } from 'yaml'
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

interface ModuleKeyMapping {
  file: 'default' | 'platform' | 'schema' | 'custom_phrase';
  keys: string[];
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
  'reverse-lookup': { file: 'schema', keys: ['reverse_lookup', 'wanxiang_lookup'] },
  'special-input': { file: 'schema', keys: ['recognizer'] },
  'lua-extensions': { file: 'schema', keys: ['super_comment', 'super_processor', 'user_predict', 'super_replacer'] },
  'candidate-display': { file: 'schema', keys: ['translator'] },
  'comment-hints': { file: 'schema', keys: ['super_comment'] },
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

  // Filter to only the keys relevant to this module
  const filtered: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(fullPatch)) {
    const baseKey = key.split('/')[0]!
    if (mapping.keys.includes(baseKey)) {
      filtered[key] = value
    }
  }

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

  let parsed: Record<string, unknown>
  try {
    parsed = parse(yamlString) as Record<string, unknown>
    if (parsed === null || parsed === undefined) parsed = {}
  } catch (e) {
    return { project, error: `YAML 语法错误: ${String(e)}` }
  }

  const expanded = expandPatchPaths(parsed)

  if (mapping.file === 'default') {
    const defaultConfig = mapToDefaultConfig(expanded, project.defaultConfig)
    return { project: { ...project, defaultConfig } }
  }

  if (mapping.file === 'platform') {
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
  const updatedSchemaConfig = { ...existingConfig, ...schemaUpdates }

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
