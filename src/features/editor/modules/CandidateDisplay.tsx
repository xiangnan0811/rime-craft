import { useConfigStore } from '@/stores/config-store'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { LearnMoreLink } from '@/components/shared/LearnMoreLink'
import { SettingHelp } from '@/components/shared/SettingHelp'

export function CandidateDisplay() {
  const schemaList = useConfigStore((s) => s.project.defaultConfig.schemaList)
  const schemaConfigs = useConfigStore((s) => s.project.schemaConfigs)
  const updateSchemaConfig = useConfigStore((s) => s.updateSchemaConfig)
  const defaultHorizontal = useConfigStore((s) => s.project.defaultConfig.horizontal)
  const updateDefaultConfig = useConfigStore((s) => s.updateDefaultConfig)

  const primarySchemaId = schemaList[0]?.schema ?? ''
  const translator = schemaConfigs[primarySchemaId]?.translator

  if (!primarySchemaId) {
    return <div className="text-gray-500">请先在「输入方案管理」中添加至少一个方案。</div>
  }

  const DEFAULT_TRANSLATOR = {
    enableCompletion: true,
    enableSentence: true,
    enableUserDict: true,
    initialQuality: 1.2,
    coreWordLength: 4,
    maxWordLength: 7,
    maxHomophones: 8,
    maxHomographs: 8,
    spellingHints: 30,
    alwaysShowComments: true,
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">候选词显示</h3>
          <LearnMoreLink module="candidate-display" />
        </div>
        <p className="mt-1 text-sm text-gray-500">控制候选词的排列方向和显示选项。</p>
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
              {defaultHorizontal ? '横排' : '竖排'}
            </span>
            <Switch checked={defaultHorizontal ?? false}
              onCheckedChange={(v) => updateDefaultConfig({ horizontal: v })} />
          </div>
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-x-1.5">
            <Label>拼音提示长度</Label>
            <SettingHelp>
              <p>控制在候选词旁显示拼音提示的范围：</p>
              <ul>
                <li><strong>0</strong>：关闭拼音提示</li>
                <li><strong>1</strong>：仅单字显示拼音</li>
                <li><strong>10</strong>：10 字以内的候选词都显示拼音</li>
                <li><strong>30</strong>：几乎所有候选词都显示拼音（学习阶段推荐）</li>
              </ul>
              <p>值较大时候选面板会变得拥挤，可根据需要适当调小。</p>
            </SettingHelp>
          </div>
          <Input type="number" min={0} max={100} className="mt-1 w-24"
            value={translator?.spellingHints ?? 30}
            onChange={(e) => updateSchemaConfig(primarySchemaId, {
              translator: { ...(translator ?? DEFAULT_TRANSLATOR), spellingHints: Number(e.target.value) },
            })} />
          <p className="mt-1 text-sm text-gray-500">显示拼音提示的候选词最大长度，0 为关闭</p>
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-x-1.5">
              <Label>始终显示注释</Label>
              <SettingHelp>
                <p>开启（true）：始终显示注释信息（前提是注释模式不是「关闭」）。</p>
                <p>关闭（false）：仅在你输入了辅助码进行筛选时才显示注释。这对已熟练辅助码的用户可以减少视觉干扰——平时不显示，需要精确筛选时才出现。</p>
              </SettingHelp>
            </div>
            <p className="text-sm text-gray-500">即使没有辅助码也显示注释信息</p>
          </div>
          <Switch checked={translator?.alwaysShowComments ?? true}
            onCheckedChange={(v) => updateSchemaConfig(primarySchemaId, {
              translator: { ...(translator ?? DEFAULT_TRANSLATOR), alwaysShowComments: v },
            })} />
        </div>
      </div>
    </div>
  )
}
