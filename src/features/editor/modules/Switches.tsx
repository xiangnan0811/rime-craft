import { useConfigStore } from '@/stores/config-store'
import {
  SWITCH_DEFINITIONS, SWITCH_CATEGORIES,
  isBinarySwitch, type AnySwitchDefinition,
} from '@/data/switch-definitions'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import type { SwitchItem, SimpleSwitchItem, MultiStateSwitchItem } from '@/types/config'
import { LearnMoreLink } from '@/components/shared/LearnMoreLink'
import { SettingHelp } from '@/components/shared/SettingHelp'

export function Switches() {
  const schemaList = useConfigStore((s) => s.project.defaultConfig.schemaList)
  const schemaConfigs = useConfigStore((s) => s.project.schemaConfigs)
  const updateSchemaConfig = useConfigStore((s) => s.updateSchemaConfig)

  const primarySchemaId = schemaList[0]?.schema ?? ''
  const currentSwitches: SwitchItem[] = schemaConfigs[primarySchemaId]?.switches ?? []

  function findCurrentReset(def: AnySwitchDefinition): number {
    if (isBinarySwitch(def)) {
      const item = currentSwitches.find((s): s is SimpleSwitchItem => 'name' in s && s.name === def.name)
      return item?.reset ?? def.defaultReset
    }
    const item = currentSwitches.find(
      (s): s is MultiStateSwitchItem => 'options' in s && JSON.stringify(s.options) === JSON.stringify(def.options)
    )
    return item?.reset ?? def.defaultReset
  }

  function handleBinaryToggle(name: string, enabled: boolean) {
    const def = SWITCH_DEFINITIONS.find((d) => isBinarySwitch(d) && d.name === name)
    if (!def || !isBinarySwitch(def)) return
    const others = currentSwitches.filter((s) => !('name' in s && s.name === name))
    const updated: SwitchItem[] = [
      ...others,
      { name, reset: enabled ? 1 : 0, states: def.states } as SimpleSwitchItem,
    ]
    updateSchemaConfig(primarySchemaId, { switches: updated })
  }

  function handleMultiStateChange(options: string[], value: number, def: AnySwitchDefinition) {
    const others = currentSwitches.filter(
      (s) => !('options' in s && JSON.stringify((s as MultiStateSwitchItem).options) === JSON.stringify(options))
    )
    const updated: SwitchItem[] = [
      ...others,
      { options, reset: value, states: def.states } as MultiStateSwitchItem,
    ]
    updateSchemaConfig(primarySchemaId, { switches: updated })
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

      {SWITCH_CATEGORIES.map((cat) => {
        const defs = SWITCH_DEFINITIONS.filter((d) => d.category === cat.id)
        if (defs.length === 0) return null

        return (
          <div key={cat.id}>
            <h4 className="mb-3 font-medium text-gray-700">{cat.label}</h4>
            <div className="space-y-3">
              {defs.map((def) => {
                const reset = findCurrentReset(def)

                if (isBinarySwitch(def)) {
                  return (
                    <div key={def.name} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-x-1.5">
                          <p className="font-medium">{def.label}</p>
                          {def.help && (
                            <SettingHelp>
                              <p>{def.help}</p>
                            </SettingHelp>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{def.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                          {reset === 1 ? def.states[1] : def.states[0]}
                        </span>
                        <Switch
                          checked={reset === 1}
                          onCheckedChange={(checked) => handleBinaryToggle(def.name, checked)}
                        />
                      </div>
                    </div>
                  )
                }

                return (
                  <div key={def.options.join(',')} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-x-1.5">
                        <p className="font-medium">{def.label}</p>
                        {def.help && (
                          <SettingHelp>
                            <p>{def.help}</p>
                          </SettingHelp>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{def.description}</p>
                    </div>
                    <Select
                      value={String(reset)}
                      onValueChange={(v) => handleMultiStateChange(def.options, Number(v), def)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {def.states.map((state, idx) => (
                          <SelectItem key={idx} value={String(idx)}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )
              })}
            </div>
            <Separator className="mt-4" />
          </div>
        )
      })}
    </div>
  )
}
