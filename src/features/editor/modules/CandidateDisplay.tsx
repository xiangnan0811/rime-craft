import { useConfigStore } from '@/stores/config-store'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { LearnMoreLink } from '@/components/shared/LearnMoreLink'

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
    enableUserDict: true,
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
          <div>
            <Label>横排显示</Label>
            <p className="text-sm text-gray-500">候选词横向排列（默认竖排）</p>
          </div>
          <Switch checked={defaultHorizontal ?? false}
            onCheckedChange={(v) => updateDefaultConfig({ horizontal: v })} />
        </div>
        <div>
          <Label>拼音提示长度</Label>
          <Input type="number" min={0} max={100} className="mt-1 w-24"
            value={translator?.spellingHints ?? 30}
            onChange={(e) => updateSchemaConfig(primarySchemaId, {
              translator: { ...(translator ?? DEFAULT_TRANSLATOR), spellingHints: Number(e.target.value) },
            })} />
          <p className="mt-1 text-sm text-gray-500">显示拼音提示的候选词最大长度，0 为关闭</p>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label>始终显示注释</Label>
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
