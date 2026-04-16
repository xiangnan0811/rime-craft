import { useConfigStore } from '@/stores/config-store'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { SettingHelp } from '@/components/shared/SettingHelp'
import { SPECIAL_TRIGGER_DEFINITIONS, TRIGGER_CATEGORIES } from '@/data/special-trigger-definitions'
import type { SpecialInputConfig, SpecialTrigger } from '@/types/config'
import { CustomTriggerList } from './CustomTriggerList'

export function SpecialInputTab() {
  const schemaList = useConfigStore((s) => s.project.defaultConfig.schemaList)
  const schemaConfigs = useConfigStore((s) => s.project.schemaConfigs)
  const updateSchemaConfig = useConfigStore((s) => s.updateSchemaConfig)

  const primarySchemaId = schemaList[0]?.schema ?? ''
  const config: SpecialInputConfig = schemaConfigs[primarySchemaId]?.specialInput ?? {
    enabledTriggers: SPECIAL_TRIGGER_DEFINITIONS.map((d) => ({
      id: d.id, enabled: true, triggerCode: d.defaultCode,
    })),
    customTriggers: [],
  }

  function getTrigger(id: string): SpecialTrigger {
    const def = SPECIAL_TRIGGER_DEFINITIONS.find((d) => d.id === id)!
    return config.enabledTriggers.find((t) => t.id === id)
      ?? { id, enabled: true, triggerCode: def.defaultCode }
  }

  function updateTrigger(id: string, partial: Partial<SpecialTrigger>) {
    const triggers = config.enabledTriggers.map((t) => t.id === id ? { ...t, ...partial } : t)
    if (!triggers.find((t) => t.id === id)) {
      const def = SPECIAL_TRIGGER_DEFINITIONS.find((d) => d.id === id)!
      triggers.push({ id, enabled: true, triggerCode: def.defaultCode, ...partial })
    }
    updateSchemaConfig(primarySchemaId, {
      specialInput: {
        enabledTriggers: triggers,
        customTriggers: config.customTriggers,
      },
    })
  }

  if (!primarySchemaId) {
    return <div className="text-muted-foreground">请先在「输入方案管理」中添加至少一个方案。</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-2 text-sm text-muted-foreground">
        <p>管理日期、时间、计算器等预设触发器，以及你自定义的 Lua 触发器。</p>
        <SettingHelp>
          <p>预设触发器是万象拼音内置的特殊输入功能，由 Lua 脚本实现。</p>
          <p>自定义触发器需要你在「自定义脚本」Tab 先创建 Lua 脚本，然后在此添加触发码与脚本的关联。</p>
        </SettingHelp>
      </div>

      {TRIGGER_CATEGORIES.map((cat) => {
        const defs = SPECIAL_TRIGGER_DEFINITIONS.filter((d) => d.category === cat.id)
        return (
          <div key={cat.id}>
            <h4 className="mb-2 flex items-center gap-2 font-medium text-gray-700 dark:text-slate-300">
              {cat.label}
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">内置</Badge>
            </h4>
            <div className="space-y-2">
              {defs.map((def) => {
                const trigger = getTrigger(def.id)
                return (
                  <div key={def.id} className="flex items-center gap-3">
                    <Switch
                      checked={trigger.enabled}
                      onCheckedChange={(v) => updateTrigger(def.id, { enabled: v })}
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium">{def.label}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{def.description}</span>
                    </div>
                    <Input
                      className="w-20 text-center text-sm"
                      value={trigger.triggerCode}
                      onChange={(e) => updateTrigger(def.id, { triggerCode: e.target.value })}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      <div>
        <h4 className="mb-2 flex items-center gap-2 font-medium text-gray-700 dark:text-slate-300">
          自定义触发器
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">用户</Badge>
        </h4>
        <CustomTriggerList schemaId={primarySchemaId} />
      </div>
    </div>
  )
}
