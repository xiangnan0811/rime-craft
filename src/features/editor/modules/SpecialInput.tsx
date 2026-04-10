import { useConfigStore } from '@/stores/config-store'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { LearnMoreLink } from '@/components/shared/LearnMoreLink'
import { SettingHelp } from '@/components/shared/SettingHelp'
import { SPECIAL_TRIGGER_DEFINITIONS, TRIGGER_CATEGORIES } from '@/data/special-trigger-definitions'
import type { SpecialInputConfig, SpecialTrigger } from '@/types/config'

export function SpecialInput() {
  const schemaList = useConfigStore((s) => s.project.defaultConfig.schemaList)
  const schemaConfigs = useConfigStore((s) => s.project.schemaConfigs)
  const updateSchemaConfig = useConfigStore((s) => s.updateSchemaConfig)

  const primarySchemaId = schemaList[0]?.schema ?? ''
  const config: SpecialInputConfig = schemaConfigs[primarySchemaId]?.specialInput ?? {
    enabledTriggers: SPECIAL_TRIGGER_DEFINITIONS.map((d) => ({
      id: d.id, enabled: true, triggerCode: d.defaultCode,
    })),
  }

  function getTrigger(id: string): SpecialTrigger {
    const def = SPECIAL_TRIGGER_DEFINITIONS.find((d) => d.id === id)!
    return config.enabledTriggers.find((t) => t.id === id) ?? { id, enabled: true, triggerCode: def.defaultCode }
  }

  function updateTrigger(id: string, partial: Partial<SpecialTrigger>) {
    const triggers = config.enabledTriggers.map((t) => t.id === id ? { ...t, ...partial } : t)
    if (!triggers.find((t) => t.id === id)) {
      const def = SPECIAL_TRIGGER_DEFINITIONS.find((d) => d.id === id)!
      triggers.push({ id, enabled: true, triggerCode: def.defaultCode, ...partial })
    }
    updateSchemaConfig(primarySchemaId, { specialInput: { enabledTriggers: triggers } })
  }

  if (!primarySchemaId) {
    return <div className="text-gray-500">请先在「输入方案管理」中添加至少一个方案。</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">特殊输入</h3>
          <LearnMoreLink module="special-input" />
        </div>
        <div className="mt-1 flex flex-wrap items-start gap-x-1.5">
          <p className="text-sm text-gray-500">管理日期、时间、计算器等特殊输入触发器。</p>
          <SettingHelp>
            <p>触发码是在输入过程中输入特定字符序列来启动特殊功能。例如输入 /rq 可以插入当前日期。</p>
            <p>每个触发器可以单独开关，也可以自定义触发码。触发码在拼音编码之外独立工作，不会干扰正常输入。</p>
          </SettingHelp>
        </div>
      </div>
      {TRIGGER_CATEGORIES.map((cat) => {
        const defs = SPECIAL_TRIGGER_DEFINITIONS.filter((d) => d.category === cat.id)
        return (
          <div key={cat.id}>
            <h4 className="mb-2 font-medium text-gray-700">{cat.label}</h4>
            <div className="space-y-2">
              {defs.map((def) => {
                const trigger = getTrigger(def.id)
                return (
                  <div key={def.id} className="flex items-center gap-3">
                    <Switch checked={trigger.enabled} onCheckedChange={(v) => updateTrigger(def.id, { enabled: v })} />
                    <div className="flex-1">
                      <span className="text-sm font-medium">{def.label}</span>
                      <span className="ml-2 text-xs text-gray-400">{def.description}</span>
                    </div>
                    <Input className="w-20 text-center text-sm" value={trigger.triggerCode}
                      onChange={(e) => updateTrigger(def.id, { triggerCode: e.target.value })} />
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
