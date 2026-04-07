import { useState, useEffect } from 'react'
import { useConfigStore } from '@/stores/config-store'
import { PRESET_THEMES } from '@/data/preset-themes'
import { ThemeEditor } from '@/features/theme/ThemeEditor'
import { CandidatePreview } from '@/components/shared/CandidatePreview'
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
    <div className="flex h-[calc(100vh-57px)]">
      {/* Left: Editor */}
      <div className="w-80 overflow-y-auto border-r p-4">
        <h2 className="mb-4 text-lg font-semibold">主题工作室</h2>
        <ThemeEditor />
      </div>

      {/* Right: Preview */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
        <CandidatePreview
          candidates={previewCandidates}
          labels={['1', '2', '3', '4', '5']}
          comments={['nihao', '', '', '', '']}
          input={previewText}
          theme={style}
          darkMode={darkMode}
        />

        {/* Preview controls */}
        <div className="flex items-center gap-6">
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

        <div className="w-64">
          <Label className="mb-1 block text-sm">预览文本</Label>
          <Input
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
    </div>
  )
}
