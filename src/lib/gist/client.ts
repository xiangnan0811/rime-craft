import type { RimeProject } from '@/types/config'
import {
  createConfigSnapshot,
  parseConfigSnapshot,
  type ParsedConfigSnapshot,
} from '@/lib/compress/share'
import type { PersistedSourceFile } from '@/lib/workspace/types'

const GITHUB_API = 'https://api.github.com'

export interface GistResult {
  url: string;
  htmlUrl: string;
  id: string;
}

/**
 * Create a public Gist with the config as a JSON file.
 * Requires a GitHub PAT with `gist` scope.
 */
export async function createGist(
  token: string,
  project: RimeProject,
  sourceFiles: Record<string, PersistedSourceFile>,
  description: string = 'Rime Craft 配置分享',
): Promise<GistResult> {
  const snapshot = createConfigSnapshot(project, sourceFiles)

  const response = await fetch(`${GITHUB_API}/gists`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github+json',
    },
    body: JSON.stringify({
      description,
      public: true,
      files: {
        'rime-craft-config.json': {
          content: JSON.stringify(snapshot, null, 2),
        },
      },
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    if (response.status === 401) {
      throw new Error('Token 无效或已过期，请检查你的 Personal Access Token')
    }
    throw new Error(`GitHub API 错误 (${response.status}): ${error}`)
  }

  const data = await response.json() as { html_url: string; url: string; id: string }
  return {
    url: data.url,
    htmlUrl: data.html_url,
    id: data.id,
  }
}

/**
 * Load config from a public Gist. No authentication needed.
 * Accepts a Gist URL or Gist ID.
 */
export async function loadPublicGist(
  gistInput: string,
): Promise<ParsedConfigSnapshot> {
  // Extract Gist ID from URL or use as-is
  const gistId = extractGistId(gistInput)

  const response = await fetch(`${GITHUB_API}/gists/${gistId}`, {
    headers: {
      Accept: 'application/vnd.github+json',
    },
  })

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Gist 不存在或不是公开的')
    }
    throw new Error(`GitHub API 错误 (${response.status})`)
  }

  const data = await response.json() as { files: Record<string, { content: string }> }
  const configFile = data.files['rime-craft-config.json']
  if (!configFile) {
    throw new Error('此 Gist 不包含 Rime Craft 配置文件 (rime-craft-config.json)')
  }

  const parsed = parseConfigSnapshot(configFile.content)
  if (!parsed.snapshot) {
    throw new Error(parsed.error)
  }

  return parsed.snapshot
}

function extractGistId(input: string): string {
  const trimmed = input.trim()
  const urlMatch = trimmed.match(/gist\.github\.com\/[^/]+\/([a-f0-9]+)/i)
  if (urlMatch?.[1]) return urlMatch[1]
  const apiMatch = trimmed.match(/api\.github\.com\/gists\/([a-f0-9]+)/i)
  if (apiMatch?.[1]) return apiMatch[1]
  if (/^[a-f0-9]+$/i.test(trimmed)) return trimmed
  throw new Error('无效的 Gist ID 格式')
}
