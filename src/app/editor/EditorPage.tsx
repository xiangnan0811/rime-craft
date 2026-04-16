import { EditorSidebar } from '@/features/editor/EditorSidebar'
import { EditorContent } from '@/features/editor/EditorContent'
import { TutorialPanel } from '@/features/editor/TutorialPanel'
import { ImmersiveView } from '@/features/editor/ImmersiveView'
import { EditorContext } from '@/features/editor/EditorContext'
import { ImportDialog } from '@/features/share/ImportDialog'
import { ExportButton } from '@/features/share/ExportButton'
import { ShareDialog } from '@/features/share/ShareDialog'
import { GistDialog } from '@/features/share/GistDialog'
import { PRESETS } from '@/data/presets'
import { useConfigStore } from '@/stores/config-store'
import { createSourceFilesFromProject } from '@/lib/workspace/source-files'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

export function EditorPage() {
  const replaceWorkspace = useConfigStore((s) => s.replaceWorkspace)
  const editorUI = useConfigStore((s) => s.editorUI)
  const setViewMode = useConfigStore((s) => s.setViewMode)
  const setTutorialCollapsed = useConfigStore((s) => s.setTutorialCollapsed)

  function handlePresetChange(presetId: string) {
    const preset = PRESETS.find((p) => p.id === presetId)
    if (!preset) {
      return
    }

    const project = preset.createProject()
    replaceWorkspace(project, createSourceFilesFromProject(project))
  }

  return (
    <div className="flex h-[calc(100vh-57px)] flex-col">
      <div className="flex items-center justify-between border-b px-6 py-2">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">配置编辑器</span>
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
        {editorUI.viewMode === 'immersive' ? (
          <ImmersiveView onExitImmersive={() => setViewMode('panel')} />
        ) : (
          <EditorContext.Provider value={{ isImmersive: false }}>
            <EditorContent />
            <TutorialPanel
              collapsed={editorUI.tutorialCollapsed}
              onToggleCollapse={() => setTutorialCollapsed(!editorUI.tutorialCollapsed)}
              onEnterImmersive={() => setViewMode('immersive')}
            />
          </EditorContext.Provider>
        )}
      </div>
    </div>
  )
}
