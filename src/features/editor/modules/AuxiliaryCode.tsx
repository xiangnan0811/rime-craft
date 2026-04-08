import { useConfigStore } from '@/stores/config-store'
import { SCHEMA_REGISTRY } from '@/data/schema-registry'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { LearnMoreLink } from '@/components/shared/LearnMoreLink'
import type { AuxiliaryCodeConfig, AuxiliaryCodeScheme } from '@/types/config'

const AUXILIARY_CODE_LABELS: Record<AuxiliaryCodeScheme, string> = {
  moqi: '墨奇码',
  hexing: '鹤形',
  zrm: '自然码',
  tiger: '虎码',
  wubi: '五笔',
  cangjie: '仓颉',
  simple_he: '简单鹤',
  hanxin: '汉心码',
}

const TRIGGER_MODE_LABELS: Record<string, string> = {
  direct: '直接辅助码',
  indirect: '间接辅助码（/ 引导）',
  backtick: '反引号引导（` 引导）',
}

const DEFAULT_CONFIG: AuxiliaryCodeConfig = {
  scheme: 'zrm',
  triggerMode: 'direct',
  hintEnabled: true,
  hintLength: 1,
  splitHintEnabled: false,
}

export function AuxiliaryCode() {
  const schemaList = useConfigStore((s) => s.project.defaultConfig.schemaList)
  const schemaConfigs = useConfigStore((s) => s.project.schemaConfigs)
  const updateSchemaConfig = useConfigStore((s) => s.updateSchemaConfig)

  const primarySchemaId = schemaList[0]?.schema ?? ''
  const schemaInfo = SCHEMA_REGISTRY.find((s) => s.id === primarySchemaId)
  const config = schemaConfigs[primarySchemaId]?.auxiliaryCode ?? DEFAULT_CONFIG
  const availableSchemes = schemaInfo?.availableAuxiliaryCodes ?? ['zrm']

  function update(partial: Partial<AuxiliaryCodeConfig>) {
    updateSchemaConfig(primarySchemaId, { auxiliaryCode: { ...config, ...partial } })
  }

  if (!primarySchemaId) {
    return <div className="text-gray-500">请先在「输入方案管理」中添加至少一个方案。</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">辅助码配置</h3>
          <LearnMoreLink module="auxiliary-code" />
        </div>
        <p className="mt-1 text-sm text-gray-500">
          配置辅助码方案和引导方式。当前方案：{primarySchemaId}
        </p>
      </div>
      <div className="space-y-4">
        <div>
          <Label>辅助码方案</Label>
          <Select value={config.scheme} onValueChange={(v) => update({ scheme: v as AuxiliaryCodeScheme })}>
            <SelectTrigger className="mt-1 w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              {availableSchemes.map((s) => (
                <SelectItem key={s} value={s}>{AUXILIARY_CODE_LABELS[s] ?? s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>引导方式</Label>
          <Select value={config.triggerMode} onValueChange={(v) => update({ triggerMode: v as AuxiliaryCodeConfig['triggerMode'] })}>
            <SelectTrigger className="mt-1 w-64"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(TRIGGER_MODE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-1 text-sm text-gray-500">直接辅助码在编码末尾追加；间接辅助码通过 / 或 ` 分隔</p>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label>辅助码提示</Label>
            <p className="text-sm text-gray-500">在候选词旁显示辅助码提示</p>
          </div>
          <Switch checked={config.hintEnabled} onCheckedChange={(v) => update({ hintEnabled: v })} />
        </div>
        {config.hintEnabled && (
          <div>
            <Label>提示长度</Label>
            <Input type="number" min={1} max={10} className="mt-1 w-24" value={config.hintLength}
              onChange={(e) => update({ hintLength: Number(e.target.value) })} />
            <p className="mt-1 text-sm text-gray-500">显示几个字的辅助码（默认 1 = 单字）</p>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div>
            <Label>拆分提示</Label>
            <p className="text-sm text-gray-500">显示字形拆分提示</p>
          </div>
          <Switch checked={config.splitHintEnabled} onCheckedChange={(v) => update({ splitHintEnabled: v })} />
        </div>
      </div>
    </div>
  )
}
