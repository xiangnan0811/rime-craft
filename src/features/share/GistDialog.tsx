import { useState } from 'react'
import { useConfigStore } from '@/stores/config-store'
import { createGist, loadPublicGist } from '@/lib/gist/client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function GistDialog() {
  const project = useConfigStore((s) => s.project)
  const sourceFiles = useConfigStore((s) => s.sourceFiles)
  const replaceWorkspace = useConfigStore((s) => s.replaceWorkspace)
  const [open, setOpen] = useState(false)

  // Export state
  const [token, setToken] = useState('')
  const [description, setDescription] = useState('Rime Craft 配置分享')
  const [exporting, setExporting] = useState(false)
  const [exportResult, setExportResult] = useState<{ url: string } | null>(null)
  const [exportError, setExportError] = useState('')

  // Import state
  const [gistUrl, setGistUrl] = useState('')
  const [importing, setImporting] = useState(false)
  const [importFeedback, setImportFeedback] = useState('')

  async function handleExport() {
    if (!token.trim()) return
    setExporting(true)
    setExportError('')
    setExportResult(null)

    try {
      const result = await createGist(token, project, sourceFiles, description)
      setExportResult({ url: result.htmlUrl })
    } catch (e) {
      setExportError(e instanceof Error ? e.message : '导出失败')
    } finally {
      setExporting(false)
    }
  }

  async function handleImport() {
    if (!gistUrl.trim()) return
    setImporting(true)
    setImportFeedback('')

    try {
      const snapshot = await loadPublicGist(gistUrl)
      replaceWorkspace(snapshot.project, snapshot.sourceFiles)
      setImportFeedback('配置导入成功！')
    } catch (e) {
      setImportFeedback(e instanceof Error ? e.message : '导入失败')
    } finally {
      setImporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Gist</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>GitHub Gist</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="export">
          <TabsList className="mb-4">
            <TabsTrigger value="export">导出到 Gist</TabsTrigger>
            <TabsTrigger value="import">从 Gist 导入</TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-3">
            <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
              需要 GitHub Personal Access Token（仅需 <code>gist</code> 权限）。Token 仅在当前对话框中使用，不会被存储。
            </div>
            <div>
              <Label>Personal Access Token</Label>
              <Input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxx"
                className="mt-1 font-mono text-sm"
              />
            </div>
            <div>
              <Label>描述</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button onClick={handleExport} disabled={!token.trim() || exporting} size="sm">
              {exporting ? '导出中...' : '导出到 Gist'}
            </Button>
            {exportResult && (
              <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
                导出成功！<a href={exportResult.url} target="_blank" rel="noopener noreferrer" className="underline">{exportResult.url}</a>
              </div>
            )}
            {exportError && (
              <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{exportError}</p>
            )}
          </TabsContent>

          <TabsContent value="import" className="space-y-3">
            <p className="text-sm text-gray-500">
              输入公开 Gist 的 URL 或 ID，无需登录即可导入。
            </p>
            <div>
              <Label>Gist URL 或 ID</Label>
              <Input
                value={gistUrl}
                onChange={(e) => setGistUrl(e.target.value)}
                placeholder="https://gist.github.com/user/abc123 或 abc123"
                className="mt-1 font-mono text-sm"
              />
            </div>
            <Button onClick={handleImport} disabled={!gistUrl.trim() || importing} size="sm">
              {importing ? '导入中...' : '导入'}
            </Button>
            {importFeedback && (
              <p className={`rounded-md p-3 text-sm ${importFeedback.includes('成功') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {importFeedback}
              </p>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
