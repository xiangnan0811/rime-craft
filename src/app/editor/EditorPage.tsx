import { useState } from 'react'
import { Menu } from 'lucide-react'
import { EditorSidebar } from '@/features/editor/EditorSidebar'
import { EditorContent } from '@/features/editor/EditorContent'
import { TutorialPanel } from '@/features/editor/TutorialPanel'
import { MobileTutorialDialog } from '@/features/editor/MobileTutorialDialog'
import { ImmersiveView } from '@/features/editor/ImmersiveView'
import { EditorContext } from '@/features/editor/EditorContext'
import { ImportDialog } from '@/features/share/ImportDialog'
import { ExportButton } from '@/features/share/ExportButton'
import { ShareDialog } from '@/features/share/ShareDialog'
import { GistDialog } from '@/features/share/GistDialog'
import { PRESETS } from '@/data/presets'
import { useConfigStore } from '@/stores/config-store'
import { createSourceFilesFromProject } from '@/lib/workspace/source-files'
import { PageHeader } from '@/components/shared/PageHeader'
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
    <div className="flex min-h-[calc(100vh-57px)] flex-col bg-muted/20">
      <div className="border-b border-border/80 bg-background/70 px-4 py-3 backdrop-blur md:px-6">
        <PageHeader
          eyebrow="Workbench"
          title="配置编辑器"
          description="在模块表单、教程说明和导入导出动作之间保持统一层级。"
          actions={(
            <>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 md:hidden"
                onClick={() => setMobileSidebarOpen(true)}
                aria-label="打开模块导航"
              >
                <Menu className="h-4 w-4" />
              </Button>
              <Select onValueChange={handlePresetChange}>
                <SelectTrigger className="h-9 w-44 text-sm">
                  <SelectValue placeholder="加载预设..." />
                </SelectTrigger>
                <SelectContent>
                  {PRESETS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <MobileTutorialDialog />
              <ShareDialog />
              <ImportDialog />
              <ExportButton />
              <GistDialog />
            </>
          )}
        />
      </div>

      {mobileSidebarOpen ? (
        <EditorSidebar
          mobileOpen
          onMobileClose={() => setMobileSidebarOpen(false)}
        />
      ) : null}

      {editorUI.viewMode === 'immersive' ? (
        <div className="flex flex-1 overflow-hidden p-3 md:p-4">
          <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-border bg-background/80 shadow-sm">
            <ImmersiveView onExitImmersive={() => setViewMode('panel')} />
          </div>
        </div>
      ) : (
        <EditorContext.Provider value={{ isImmersive: false }}>
          <div className="flex flex-1 gap-3 overflow-hidden p-3 md:p-4">
            <div className="hidden md:block md:w-64 md:flex-shrink-0">
              <EditorSidebar />
            </div>

            <div className="min-w-0 flex-1 overflow-hidden rounded-2xl border border-border bg-background/80 shadow-sm">
              <EditorContent />
            </div>

            <div className="hidden md:block md:w-[380px] md:flex-shrink-0">
              <TutorialPanel
                collapsed={editorUI.tutorialCollapsed}
                onToggleCollapse={() => setTutorialCollapsed(!editorUI.tutorialCollapsed)}
                onEnterImmersive={() => setViewMode('immersive')}
              />
            </div>
          </div>
        </EditorContext.Provider>
      )}
    </div>
  )
}
