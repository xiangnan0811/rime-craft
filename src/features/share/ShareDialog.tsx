import { useState } from 'react'
import { saveAs } from 'file-saver'
import { useConfigStore } from '@/stores/config-store'
import {
  type ConfigSnapshot,
  generateShareUrl,
  createConfigSnapshot,
  parseConfigSnapshot,
} from '@/lib/compress/share'
import { createSourceFilesFromProject } from '@/lib/workspace/source-files'
import type { PersistedSourceFile } from '@/lib/workspace/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'

type SnapshotWithSourceFiles = ConfigSnapshot & {
  sourceFiles?: Record<string, PersistedSourceFile>
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

function getSnapshotSourceFiles(
  snapshot: ConfigSnapshot,
): Record<string, PersistedSourceFile> {
  const candidate = (snapshot as SnapshotWithSourceFiles).sourceFiles

  if (
    candidate &&
    isRecord(candidate) &&
    Object.values(candidate).every(isPersistedSourceFile)
  ) {
    return candidate
  }

  return createSourceFilesFromProject(snapshot.project)
}

export function ShareDialog() {
  const project = useConfigStore((s) => s.project)
  const sourceFiles = useConfigStore((s) => s.sourceFiles)
  const activeModule = useConfigStore((s) => s.activeModule)
  const replaceWorkspace = useConfigStore((s) => s.replaceWorkspace)

  const [open, setOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [urlWarning, setUrlWarning] = useState<string>()
  const [copied, setCopied] = useState(false)
  const [importFeedback, setImportFeedback] = useState('')

  function handleGenerateUrl() {
    const result = generateShareUrl(activeModule, project)
    setShareUrl(result.url)
    setUrlWarning(result.warning)
    setCopied(false)
  }

  async function handleCopyUrl() {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleJsonExport() {
    const snapshot: SnapshotWithSourceFiles = {
      ...createConfigSnapshot(project),
      sourceFiles,
    }
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
      type: 'application/json',
    })
    saveAs(
      blob,
      `rime-craft-config-${new Date().toISOString().slice(0, 10)}.json`,
    )
  }

  function handleJsonImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const result = parseConfigSnapshot(reader.result as string)
      if ('snapshot' in result && result.snapshot) {
        const importedSourceFiles = getSnapshotSourceFiles(result.snapshot)
        replaceWorkspace(result.snapshot.project, importedSourceFiles)
        setImportFeedback(
          `配置快照导入成功！已解析 ${Object.keys(importedSourceFiles).length} 个源文件工件。`,
        )
      } else {
        setImportFeedback(`导入失败：${result.error}`)
      }
    }
    reader.readAsText(file)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          分享
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>分享配置</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="url">
          <TabsList className="mb-4">
            <TabsTrigger value="url">URL 分享</TabsTrigger>
            <TabsTrigger value="export">导出 JSON</TabsTrigger>
            <TabsTrigger value="import">导入 JSON</TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="space-y-3">
            <p className="text-sm text-gray-500">
              生成包含当前模块配置的分享链接（适合分享单个模块的小配置）。
            </p>
            <Button onClick={handleGenerateUrl} size="sm">
              生成链接
            </Button>
            {shareUrl && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyUrl}
                  >
                    {copied ? '已复制' : '复制'}
                  </Button>
                </div>
                {urlWarning && (
                  <p className="rounded-md bg-yellow-50 p-2 text-sm text-yellow-700">
                    {urlWarning}
                  </p>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="export" className="space-y-3">
            <p className="text-sm text-gray-500">
              将完整配置导出为 JSON 快照文件，可以分享给他人导入。
            </p>
            <Button onClick={handleJsonExport} size="sm">
              下载 JSON 快照
            </Button>
          </TabsContent>

          <TabsContent value="import" className="space-y-3">
            <p className="text-sm text-gray-500">
              导入他人分享的 JSON 快照文件。
            </p>
            <input
              type="file"
              accept=".json"
              onChange={handleJsonImport}
              className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-medium hover:file:bg-gray-200"
            />
            {importFeedback && (
              <p
                className={`rounded-md p-2 text-sm ${
                  importFeedback.includes('失败')
                    ? 'bg-red-50 text-red-700'
                    : 'bg-green-50 text-green-700'
                }`}
              >
                {importFeedback}
              </p>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
