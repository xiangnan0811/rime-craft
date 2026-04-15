import LZString from 'lz-string'
import type { RimeProject, EditorModule } from '@/types/config'
import { createSourceFilesFromProject } from '@/lib/workspace/source-files'
import type { PersistedSourceFile } from '@/lib/workspace/types'
import { isRecord, isValidSourceFile, isValidProject } from '@/lib/workspace/validators'
import {
  extractModuleYaml,
  extractModuleYamlFromWorkspace,
} from '@/lib/yaml/module-yaml'

const VALID_MODULES: Set<string> = new Set<EditorModule>([
  'schema-manager', 'candidate-settings', 'key-bindings', 'switches',
  'fuzzy-pinyin', 'spelling-scheme', 'auxiliary-code', 'reverse-lookup',
  'punctuation', 'dictionary', 'lua-extensions', 'ascii-mode',
  'candidate-display', 'comment-hints',
])

export interface ConfigSnapshot {
  version: 1
  createdAt: string
  project: RimeProject
  sourceFiles?: Record<string, PersistedSourceFile>
}

export type ParsedConfigSnapshot = ConfigSnapshot & {
  sourceFiles: Record<string, PersistedSourceFile>
}

function normalizeSnapshotSourceFiles(
  project: RimeProject,
  sourceFiles: unknown,
): Record<string, PersistedSourceFile> {
  if (
    isRecord(sourceFiles) &&
    Object.values(sourceFiles).every(isValidSourceFile)
  ) {
    return structuredClone(sourceFiles) as Record<string, PersistedSourceFile>
  }

  return createSourceFilesFromProject(project)
}

// ─── URL sharing (single module config) ──────────────────

export function compressConfig(data: Record<string, unknown>): string {
  return LZString.compressToEncodedURIComponent(JSON.stringify(data))
}

const MAX_COMPRESSED_LENGTH = 50_000
const MAX_DECOMPRESSED_LENGTH = 500_000

export function decompressConfig(compressed: string): Record<string, unknown> | null {
  if (compressed.length > MAX_COMPRESSED_LENGTH) return null
  try {
    const json = LZString.decompressFromEncodedURIComponent(compressed)
    if (!json || json.length > MAX_DECOMPRESSED_LENGTH) return null
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

  if (!VALID_MODULES.has(data.module)) return null

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
    if (!isValidProject(parsed.project)) {
      return { error: '无效的配置快照：project 结构不完整' }
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
