import { useState, useEffect } from 'react'
import { useConfigStore } from '@/stores/config-store'
import { PRESET_THEMES } from '@/data/preset-themes'
import { ThemeEditor } from '@/features/theme/ThemeEditor'
import { CandidatePreview } from '@/components/shared/CandidatePreview'
import { PageHeader } from '@/components/shared/PageHeader'
import { WorkbenchPanel } from '@/components/shared/WorkbenchPanel'
import { SimulatorPanel } from '@/features/simulator/SimulatorPanel'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

export function ThemePage() {
  const style = useConfigStore((s) => s.project.platformConfig.style)
  const setThemeStyle = useConfigStore((s) => s.setThemeStyle)

  const [darkMode, setDarkMode] = useState(false)
  const [previewText, setPreviewText] = useState('nihao')
  const previewCandidates = ['你好', '你', '尼', '泥', '拟']

  // Initialize with first preset if no theme set
  useEffect(() => {
    if (!style && PRESET_THEMES[0]) {
      setThemeStyle(structuredClone(PRESET_THEMES[0]))
    }
  }, [style, setThemeStyle])

  if (!style) return null

  return (
    <div className="min-h-[calc(100vh-57px)] bg-muted/20">
      <div className="border-b border-border/80 bg-background/70 px-4 py-3 backdrop-blur md:px-6">
        <div className="mx-auto max-w-7xl">
          <PageHeader
            eyebrow="Workbench"
            title="主题工作室"
            description="统一预设入口、主题编辑区与候选窗预览区，让页面更像设计工作台而不是参数表单。"
          />
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:px-6">

        <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
          <WorkbenchPanel
            title="主题设置"
            subtitle="预设、颜色和布局编辑保持在同一个控制区。"
            className="overflow-hidden bg-background/80"
          >
            <ThemeEditor />
          </WorkbenchPanel>

          <div className="grid gap-4">
            <WorkbenchPanel
              title="候选窗预览"
              subtitle="让预览成为页面中心，而不是附属结果区。"
              className="bg-background/80"
            >
              <div className="flex justify-center">
                <CandidatePreview
                  candidates={previewCandidates}
                  labels={['1', '2', '3', '4', '5']}
                  comments={['nihao', '', '', '', '']}
                  input={previewText}
                  theme={style}
                  darkMode={darkMode}
                />
              </div>
            </WorkbenchPanel>

            <WorkbenchPanel
              title="预览控制"
              subtitle="保留横排/竖排、暗色背景和输入文本控制。"
              className="bg-background/80"
            >
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={style.horizontal}
                      onCheckedChange={(h) => useConfigStore.getState().updateThemeLayout({ horizontal: h })}
                    />
                    <Label className="text-sm">{style.horizontal ? '横排' : '竖排'}</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                    <Label className="text-sm">{darkMode ? '暗色背景' : '亮色背景'}</Label>
                  </div>
                </div>

                <div className="w-full max-w-sm">
                  <Label htmlFor="theme-preview-text" className="mb-1 block text-sm">预览文本</Label>
                  <Input
                    id="theme-preview-text"
                    value={previewText}
                    onChange={(e) => setPreviewText(e.target.value)}
                    placeholder="输入拼音..."
                    className="text-sm"
                  />
                </div>

                <Separator />

                <div className="w-full max-w-md">
                  <SimulatorPanel />
                </div>
              </div>
            </WorkbenchPanel>
          </div>
        </div>
      </div>
    </div>
  )
}
