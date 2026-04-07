import { useConfigStore } from '@/stores/config-store'
import { SWITCH_DEFINITIONS } from '@/data/switch-definitions'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import type { SwitchItem } from '@/types/config'
import { LearnMoreLink } from '@/components/shared/LearnMoreLink'

export function Switches() {
  const schemaList = useConfigStore((s) => s.project.defaultConfig.schemaList)
  const schemaConfigs = useConfigStore((s) => s.project.schemaConfigs)
  const setSwitches = useConfigStore((s) => s.setSwitches)

  const primarySchemaId = schemaList[0]?.schema ?? ''
  const currentSwitches: SwitchItem[] =
    schemaConfigs[primarySchemaId]?.switches ??
    SWITCH_DEFINITIONS.map((def) => ({ name: def.name, reset: def.defaultReset, states: def.states }))

  function isEnabled(name: string): boolean {
    const item = currentSwitches.find((s) => s.name === name)
    return item !== undefined ? item.reset === 1 : false
  }

  function handleToggle(name: string, enabled: boolean) {
    const updated: SwitchItem[] = SWITCH_DEFINITIONS.map((def) => {
      const existing = currentSwitches.find((s) => s.name === def.name)
      if (def.name === name) {
        return { name: def.name, reset: enabled ? 1 : 0, states: def.states }
      }
      return existing ?? { name: def.name, reset: def.defaultReset, states: def.states }
    })
    setSwitches(primarySchemaId, updated)
  }

  if (!primarySchemaId) {
    return <div className="text-gray-500">请先在「输入方案管理」中添加至少一个方案。</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">开关与杂项</h3>
          <LearnMoreLink module="switches" />
        </div>
        <p className="mt-1 text-sm text-gray-500">
          控制方案的各项功能开关，当前配置应用于方案：{primarySchemaId}
        </p>
      </div>
      <Separator />
      <div className="space-y-4">
        {SWITCH_DEFINITIONS.map((def) => {
          const on = isEnabled(def.name)
          const [offLabel, onLabel] = def.states
          return (
            <div key={def.name} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{def.label}</p>
                <p className="text-sm text-gray-500">{def.description}</p>
                <p className="text-xs text-gray-400">
                  {offLabel} / {onLabel}
                </p>
              </div>
              <Switch checked={on} onCheckedChange={(checked) => handleToggle(def.name, checked)} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
