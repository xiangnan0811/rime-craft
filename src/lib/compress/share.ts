import LZString from 'lz-string'
import type { RimeProject, EditorModule } from '@/types/config'
import { extractModuleYaml } from '@/lib/yaml/module-yaml'

export interface ConfigSnapshot {
  version: 1
  createdAt: string
  project: RimeProject
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
): { url: string; warning?: string } {
  const yamlContent = extractModuleYaml(module, project)
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

export function createConfigSnapshot(project: RimeProject): ConfigSnapshot {
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    project: structuredClone(project),
  }
}

export function parseConfigSnapshot(
  json: string,
): { snapshot: ConfigSnapshot; error?: string } | { snapshot?: never; error: string } {
  try {
    const parsed = JSON.parse(json) as Record<string, unknown>
    if (parsed.version !== 1) {
      return { error: `不支持的版本: ${String(parsed.version)}` }
    }
    if (!parsed.project || typeof parsed.project !== 'object') {
      return { error: '无效的配置快照：缺少 project 字段' }
    }
    return { snapshot: parsed as unknown as ConfigSnapshot }
  } catch {
    return { error: '无效的 JSON 格式' }
  }
}
