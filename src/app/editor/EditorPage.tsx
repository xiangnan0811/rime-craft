import { useState } from 'react'
import { Menu } from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

export function EditorPage() {
  const replaceWorkspace = useConfigStore((s) => s.replaceWorkspace)
  const editorUI = useConfigStore((s) => s.editorUI)
  const setViewMode = useConfigStore((s) => s.setViewMode)
  const setTutorialCollapsed = useConfigStore((s) => s.setTutorialCollapsed)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

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
      <div className="flex flex-wrap items-center justify-between gap-y-2 border-b px-4 py-2 md:px-6">
        <div className="flex items-center gap-2 md:gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:hidden"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="打开模块导航"
          >
            <Menu className="h-4 w-4" />
          </Button>
          <span className="hidden text-sm text-muted-foreground sm:inline">配置编辑器</span>
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
        <div className="flex flex-wrap gap-2">
          <ShareDialog />
          <ImportDialog />
          <ExportButton />
          <GistDialog />
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <EditorSidebar
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />
        {editorUI.viewMode === 'immersive' ? (
          <ImmersiveView onExitImmersive={() => setViewMode('panel')} />
        ) : (
          <EditorContext.Provider value={{ isImmersive: false }}>
            <EditorContent />
            <div className="hidden md:contents">
              <TutorialPanel
                collapsed={editorUI.tutorialCollapsed}
                onToggleCollapse={() => setTutorialCollapsed(!editorUI.tutorialCollapsed)}
                onEnterImmersive={() => setViewMode('immersive')}
              />
            </div>
          </EditorContext.Provider>
        )}
      </div>
    </div>
  )
}
