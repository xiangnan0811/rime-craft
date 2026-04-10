import { useConfigStore } from '@/stores/config-store'
import { SCHEMA_REGISTRY } from '@/data/schema-registry'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { LearnMoreLink } from '@/components/shared/LearnMoreLink'
import { SettingHelp } from '@/components/shared/SettingHelp'
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
          <div className="flex flex-wrap items-center gap-x-1.5">
            <Label>辅助码方案</Label>
            <SettingHelp>
              <p>选择用于辅助筛选候选词的字形编码方案。不同方案的学习难度和适用场景不同：</p>
              <ul>
                <li><strong>自然码</strong>：学习成本低，适合入门</li>
                <li><strong>墨奇码</strong>：规则简洁，重码率低</li>
                <li><strong>鹤形/简单鹤</strong>：配合小鹤双拼使用</li>
                <li><strong>虎码/五笔/仓颉</strong>：适合已有相关基础的用户</li>
                <li><strong>汉心码</strong>：独特的编码体系</li>
              </ul>
              <p>切换方案后之前记忆的编码会失效，建议选定后坚持使用。</p>
            </SettingHelp>
          </div>
          <Select value={config.scheme} onValueChange={(v) => update({ scheme: v as AuxiliaryCodeScheme })}>
            <SelectTrigger className="mt-1 w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              {availableSchemes.map((s) => (
                <SelectItem key={s} value={s}>{AUXILIARY_CODE_LABELS[s] ?? s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-1 text-sm text-gray-500">选择字形拆分方案，不同方案适合不同用户</p>
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-x-1.5">
            <Label>引导方式</Label>
            <SettingHelp>
              <p>控制如何在拼音后追加辅助码：</p>
              <ul>
                <li><strong>直接辅助码</strong>：直接在拼音末尾追加辅助码（如 wjag），效率最高但需熟练</li>
                <li><strong>间接辅助码（/ 引导）</strong>：用 / 分隔拼音和辅助码（如 wj/ag），视觉更清晰</li>
                <li><strong>反引号引导</strong>：按 ` 键后输入辅助码（如 wj`ag），最容易上手</li>
              </ul>
            </SettingHelp>
          </div>
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
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-x-1.5">
              <Label>辅助码提示</Label>
              <SettingHelp>
                <p>启用后，候选词旁会显示对应的辅助码编码，方便学习和记忆。搭配注释模式使用效果更好。</p>
              </SettingHelp>
            </div>
            <p className="text-sm text-gray-500">在候选词旁显示辅助码提示</p>
          </div>
          <Switch checked={config.hintEnabled} onCheckedChange={(v) => update({ hintEnabled: v })} />
        </div>
        {config.hintEnabled && (
          <div>
            <div className="flex flex-wrap items-center gap-x-1.5">
              <Label>提示长度</Label>
              <SettingHelp>
                <p>控制为多长的候选词显示辅助码提示。设为 1 仅单字显示，设为 2 则两字词也显示。值越大，显示辅助码的候选词越多。</p>
              </SettingHelp>
            </div>
            <Input type="number" min={1} max={10} className="mt-1 w-24" value={config.hintLength}
              onChange={(e) => update({ hintLength: Number(e.target.value) })} />
            <p className="mt-1 text-sm text-gray-500">显示几个字的辅助码（默认 1 = 单字）</p>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-x-1.5">
              <Label>拆分提示</Label>
              <SettingHelp>
                <p>启用后在候选词旁显示字形拆分提示，展示字是如何被拆分成辅助码编码的。对学习阶段特别有帮助，熟练后可关闭。</p>
              </SettingHelp>
            </div>
            <p className="text-sm text-gray-500">显示字形拆分提示</p>
          </div>
          <Switch checked={config.splitHintEnabled} onCheckedChange={(v) => update({ splitHintEnabled: v })} />
        </div>
      </div>
    </div>
  )
}
