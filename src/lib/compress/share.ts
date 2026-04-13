import LZString from 'lz-string'
import type { RimeProject, EditorModule } from '@/types/config'
import { createSourceFilesFromProject } from '@/lib/workspace/source-files'
import type { PersistedSourceFile } from '@/lib/workspace/types'
import {
  extractModuleYaml,
  extractModuleYamlFromWorkspace,
} from '@/lib/yaml/module-yaml'

export interface ConfigSnapshot {
  version: 1
  createdAt: string
  project: RimeProject
  sourceFiles?: Record<string, PersistedSourceFile>
}

export type ParsedConfigSnapshot = ConfigSnapshot & {
  sourceFiles: Record<string, PersistedSourceFile>
}

const SOURCE_FILE_KINDS = new Set<string>([
  'default',
  'platform',
  'schema',
  'custom_phrase',
])

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isPersistedSourceFile = (value: unknown): value is PersistedSourceFile => {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.id === 'string' &&
    typeof value.fileName === 'string' &&
    typeof value.kind === 'string' &&
    SOURCE_FILE_KINDS.has(value.kind) &&
    typeof value.content === 'string' &&
    typeof value.updatedAt === 'string' &&
    (value.platform === undefined ||
      value.platform === 'macos' ||
      value.platform === 'windows') &&
    (value.schemaId === undefined || typeof value.schemaId === 'string')
  )
}

function normalizeSnapshotSourceFiles(
  project: RimeProject,
  sourceFiles: unknown,
): Record<string, PersistedSourceFile> {
  if (
    isRecord(sourceFiles) &&
    Object.values(sourceFiles).every(isPersistedSourceFile)
  ) {
    return structuredClone(sourceFiles) as Record<string, PersistedSourceFile>
  }

  return createSourceFilesFromProject(project)
}

// ─── URL sharing (single module config) ──────────────────

export function compressConfig(data: Record<string, unknown>): string {
  return LZString.compressToEncodedURIComponent(JSON.stringify(data))
}

export function decompressConfig(compressed: string): Record<string, unknown> | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(compressed)
    if (!json) return null
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return null
  }
}

export function generateShareUrl(
  module: EditorModule,
  project: RimeProject,
  sourceFiles?: Record<string, PersistedSourceFile>,
): { url: string; warning?: string } {
  const yamlContent = sourceFiles
    ? extractModuleYamlFromWorkspace(module, project, sourceFiles)
    : extractModuleYaml(module, project)
  const payload = { module, yaml: yamlContent }
  const compressed = compressConfig(payload)
  const url = `${window.location.origin}${window.location.pathname}?share=${compressed}`

  return {
    url,
    warning:
      url.length > 2000
        ? 'URL 超过 2000 字符，部分平台可能无法正确传递。建议使用文件分享。'
        : undefined,
  }
}

export function parseShareUrl(
  search: string,
): { module: EditorModule; yaml: string } | null {
  const params = new URLSearchParams(search)
  const shareParam = params.get('share')
  if (!shareParam) return null

  const data = decompressConfig(shareParam)
  if (!data || typeof data.module !== 'string' || typeof data.yaml !== 'string')
    return null

  return { module: data.module as EditorModule, yaml: data.yaml }
}

// ─── JSON file sharing (full project) ────────────────────

export function createConfigSnapshot(
  project: RimeProject,
  sourceFiles?: Record<string, PersistedSourceFile>,
): ConfigSnapshot {
  const snapshot: ConfigSnapshot = {
    version: 1,
    createdAt: new Date().toISOString(),
    project: structuredClone(project),
  }

  if (sourceFiles) {
    snapshot.sourceFiles = structuredClone(sourceFiles)
  }

  return snapshot
}

export function parseConfigSnapshot(
  json: string,
):
  | { snapshot: ParsedConfigSnapshot; error?: string }
  | { snapshot?: never; error: string } {
  try {
    const parsed = JSON.parse(json) as Record<string, unknown>
    if (parsed.version !== 1) {
      return { error: `不支持的版本: ${String(parsed.version)}` }
    }
    if (!parsed.project || typeof parsed.project !== 'object') {
      return { error: '无效的配置快照：缺少 project 字段' }
    }

    const project = structuredClone(parsed.project as RimeProject)
    return {
      snapshot: {
        version: 1,
        createdAt:
          typeof parsed.createdAt === 'string'
            ? parsed.createdAt
            : new Date().toISOString(),
        project,
        sourceFiles: normalizeSnapshotSourceFiles(project, parsed.sourceFiles),
      },
    }
  } catch {
    return { error: '无效的 JSON 格式' }
  }
}
