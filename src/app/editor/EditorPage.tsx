import { EditorSidebar } from '@/features/editor/EditorSidebar'
import { EditorContent } from '@/features/editor/EditorContent'
import { ImportDialog } from '@/features/share/ImportDialog'
import { ExportButton } from '@/features/share/ExportButton'
import { ShareDialog } from '@/features/share/ShareDialog'
import { GistDialog } from '@/features/share/GistDialog'
import { PRESETS } from '@/data/presets'
import { useConfigStore } from '@/stores/config-store'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

export function EditorPage() {
  const loadProject = useConfigStore((s) => s.loadProject)

  function handlePresetChange(presetId: string) {
    const preset = PRESETS.find((p) => p.id === presetId)
    if (preset) loadProject(preset.createProject())
  }

  return (
    <div className="flex h-[calc(100vh-57px)] flex-col">
      <div className="flex items-center justify-between border-b px-6 py-2">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">配置编辑器</span>
          <Select onValueChange={handlePresetChange}>
            <SelectTrigger className="h-8 w-40 text-sm">
              <SelectValue placeholder="加载预设..." />
            </SelectTrigger>
            <SelectContent>
              {PRESETS.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <ShareDialog />
          <ImportDialog />
          <ExportButton />
          <GistDialog />
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <EditorSidebar />
        <EditorContent />
      </div>
    </div>
  )
}
