import { useState, useCallback } from 'react'
import { useConfigStore } from '@/stores/config-store'
import { importFromYamlString, importFromFiles } from './importer'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

export function ImportDialog() {
  const loadProject = useConfigStore((s) => s.loadProject)
  const [open, setOpen] = useState(false)
  const [yamlText, setYamlText] = useState('')
  const [feedback, setFeedback] = useState('')

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = e.target.files
      if (!fileList?.length) return
      const files: { name: string; content: string }[] = []
      for (const file of Array.from(fileList)) {
        const content = await file.text()
        files.push({ name: file.name, content })
      }
      const result = importFromFiles(files)
      loadProject(result.project)
      const msg = `已导入 ${result.summary.filesProcessed} 个文件，识别到 ${result.summary.customSettings} 项自定义配置。`
      setFeedback(result.summary.errors.length > 0 ? `${msg}\n错误：${result.summary.errors.join('; ')}` : msg)
    },
    [loadProject],
  )

  function handlePasteImport() {
    if (!yamlText.trim()) return
    const result = importFromYamlString(yamlText, 'default.custom.yaml')
    loadProject(result.project)
    setFeedback(`已导入 ${result.summary.customSettings} 项自定义配置。`)
    setYamlText('')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">导入配置</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>导入 Rime 配置</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="file">
          <TabsList className="mb-4">
            <TabsTrigger value="file">上传文件</TabsTrigger>
            <TabsTrigger value="paste">粘贴 YAML</TabsTrigger>
          </TabsList>
          <TabsContent value="file">
            <input type="file" accept=".yaml,.yml,.txt" multiple onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-medium hover:file:bg-gray-200" />
            <p className="mt-2 text-sm text-gray-500">支持 .custom.yaml 和 custom_phrase.txt 文件，可多选。</p>
          </TabsContent>
          <TabsContent value="paste">
            <Textarea value={yamlText} onChange={(e) => setYamlText(e.target.value)}
              placeholder="粘贴 .custom.yaml 文件内容..." rows={10} className="font-mono text-sm" />
            <Button onClick={handlePasteImport} className="mt-3" disabled={!yamlText.trim()}>导入</Button>
          </TabsContent>
        </Tabs>
        {feedback && <p className="mt-3 rounded-md bg-green-50 p-3 text-sm text-green-700">{feedback}</p>}
      </DialogContent>
    </Dialog>
  )
}
