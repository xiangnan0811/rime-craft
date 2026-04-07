import type { RimeProject } from '@/types/config'
import { createEmptyProject, DEFAULT_CONFIG, DEFAULT_PLATFORM_CONFIG } from '@/lib/config/defaults'
import {
  parseCustomYaml, expandPatchPaths, mapToDefaultConfig, mapToPlatformConfig,
  extractPreservedFields, KNOWN_DEFAULT_KEYS, KNOWN_PLATFORM_KEYS,
} from '@/lib/yaml/parser'

export interface ImportResult {
  project: RimeProject;
  summary: { filesProcessed: number; customSettings: number; errors: string[] };
}

export function importFromYamlString(yamlString: string, fileName: string): ImportResult {
  const project = createEmptyProject()
  const errors: string[] = []
  let customSettings = 0

  const { patch, error } = parseCustomYaml(yamlString)
  if (error) {
    errors.push(`${fileName}: ${error}`)
    return { project, summary: { filesProcessed: 1, customSettings: 0, errors } }
  }

  const expanded = expandPatchPaths(patch)
  customSettings = Object.keys(patch).length

  if (fileName.includes('default')) {
    project.defaultConfig = mapToDefaultConfig(expanded, DEFAULT_CONFIG)
    project.preserved['default.custom.yaml'] = extractPreservedFields(patch, KNOWN_DEFAULT_KEYS)
  } else if (fileName.includes('squirrel')) {
    project.targetPlatform = 'macos'
    project.platformConfig = mapToPlatformConfig(expanded, { ...DEFAULT_PLATFORM_CONFIG, platform: 'macos' })
    project.preserved['squirrel.custom.yaml'] = extractPreservedFields(patch, KNOWN_PLATFORM_KEYS)
  } else if (fileName.includes('weasel')) {
    project.targetPlatform = 'windows'
    project.platformConfig = mapToPlatformConfig(expanded, { ...DEFAULT_PLATFORM_CONFIG, platform: 'windows' })
    project.preserved['weasel.custom.yaml'] = extractPreservedFields(patch, KNOWN_PLATFORM_KEYS)
  }

  return { project, summary: { filesProcessed: 1, customSettings, errors } }
}

export function importFromFiles(files: { name: string; content: string }[]): ImportResult {
  const project = createEmptyProject()
  const errors: string[] = []
  let totalCustomSettings = 0

  for (const file of files) {
    const result = importFromYamlString(file.content, file.name)
    totalCustomSettings += result.summary.customSettings
    errors.push(...result.summary.errors)
    if (file.name.includes('default')) project.defaultConfig = result.project.defaultConfig
    if (file.name.includes('squirrel') || file.name.includes('weasel')) {
      project.targetPlatform = result.project.targetPlatform
      project.platformConfig = result.project.platformConfig
    }
    Object.assign(project.preserved, result.project.preserved)
  }

  return { project, summary: { filesProcessed: files.length, customSettings: totalCustomSettings, errors } }
}
