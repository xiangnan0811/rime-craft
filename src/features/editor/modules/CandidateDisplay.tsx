import { useConfigStore } from '@/stores/config-store'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { LearnMoreLink } from '@/components/shared/LearnMoreLink'
import { SettingHelp } from '@/components/shared/SettingHelp'
import { DEFAULT_THEME_STYLE } from '@/lib/config/defaults'

export function CandidateDisplay() {
  const schemaList = useConfigStore((s) => s.project.defaultConfig.schemaList)
  const themeStyle = useConfigStore((s) => s.project.platformConfig.style)
  const setThemeStyle = useConfigStore((s) => s.setThemeStyle)
  const updateThemeLayout = useConfigStore((s) => s.updateThemeLayout)

  const primarySchemaId = schemaList[0]?.schema ?? ''
  const horizontal = themeStyle?.horizontal ?? false

  if (!primarySchemaId) {
    return <div className="text-gray-500">请先在「输入方案管理」中添加至少一个方案。</div>
  }

  function updateHorizontal(nextHorizontal: boolean) {
    if (themeStyle) {
      updateThemeLayout({ horizontal: nextHorizontal })
      return
    }

    if (nextHorizontal) {
      setThemeStyle({ ...DEFAULT_THEME_STYLE, horizontal: true })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">候选词显示</h3>
          <LearnMoreLink module="candidate-display" />
        </div>
        <p className="mt-1 text-sm text-gray-500">控制候选窗口的排列方向。注释与拼音提示已移动到「注释与提示」模块。</p>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-x-1.5">
              <Label>横排显示</Label>
              <SettingHelp>
                <p>竖排（默认）：候选词从上到下排列，适合窄屏、候选词较多时。</p>
                <p>横排：候选词从左到右排列，节省纵向空间，适合宽屏和现代 UI 风格。</p>
                <p>横排用户建议将每页候选词数调小到 5-6 个，避免面板过宽。</p>
              </SettingHelp>
            </div>
            <p className="text-sm text-gray-500">候选词横向排列（默认竖排）</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {horizontal ? '横排' : '竖排'}
            </span>
            <Switch checked={horizontal}
              onCheckedChange={updateHorizontal} />
          </div>
        </div>
        <div className="rounded-md border border-dashed p-4 text-sm text-gray-500">
          <div className="flex flex-wrap items-center gap-x-1.5">
            <Label>注释与拼音提示</Label>
            <SettingHelp>
              <p>这两个选项会写入 schema 的 <code>translator</code> 与 <code>super_comment</code>，现在统一在「注释与提示」模块中维护。</p>
            </SettingHelp>
          </div>
          <p className="mt-1">如果你要调整拼音提示长度、注释显示策略或纠错提示格式，请切换到「注释与提示」。</p>
        </div>
      </div>
    </div>
  )
}
