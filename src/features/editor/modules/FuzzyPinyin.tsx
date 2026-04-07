import { useConfigStore } from '@/stores/config-store'
import { FUZZY_RULE_DEFINITIONS } from '@/data/fuzzy-rules'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import type { FuzzyRuleState } from '@/types/config'
import { LearnMoreLink } from '@/components/shared/LearnMoreLink'

export function FuzzyPinyin() {
  const schemaList = useConfigStore((s) => s.project.defaultConfig.schemaList)
  const schemaConfigs = useConfigStore((s) => s.project.schemaConfigs)
  const setFuzzyRules = useConfigStore((s) => s.setFuzzyRules)

  const primarySchemaId = schemaList[0]?.schema ?? ''
  const currentRules = schemaConfigs[primarySchemaId]?.fuzzyRules ?? []

  function isEnabled(ruleId: string): boolean {
    return currentRules.some((r) => r.ruleId === ruleId && r.enabled)
  }

  function handleToggle(ruleId: string, enabled: boolean) {
    const existing = currentRules.filter((r) => r.ruleId !== ruleId)
    const updated: FuzzyRuleState[] = [...existing, { ruleId, enabled }]
    setFuzzyRules(primarySchemaId, updated)
  }

  const initials = FUZZY_RULE_DEFINITIONS.filter((r) => r.category === 'initial')
  const finals = FUZZY_RULE_DEFINITIONS.filter((r) => r.category === 'final')

  if (!primarySchemaId) {
    return <div className="text-gray-500">请先在「输入方案管理」中添加至少一个方案。</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">模糊音规则</h3>
          <LearnMoreLink module="fuzzy-pinyin" />
        </div>
        <p className="mt-1 text-sm text-gray-500">
          启用模糊音后，发音相近的声母或韵母会被视为相同，可以减少输入错误。当前配置应用于方案：{primarySchemaId}
        </p>
      </div>
      <div>
        <h4 className="mb-3 font-medium">声母模糊</h4>
        <div className="space-y-3">
          {initials.map((rule) => (
            <div key={rule.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{rule.label}</p>
                <p className="text-sm text-gray-500">{rule.description}</p>
              </div>
              <Switch checked={isEnabled(rule.id)} onCheckedChange={(checked) => handleToggle(rule.id, checked)} />
            </div>
          ))}
        </div>
      </div>
      <Separator />
      <div>
        <h4 className="mb-3 font-medium">韵母模糊</h4>
        <div className="space-y-3">
          {finals.map((rule) => (
            <div key={rule.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{rule.label}</p>
                <p className="text-sm text-gray-500">{rule.description}</p>
              </div>
              <Switch checked={isEnabled(rule.id)} onCheckedChange={(checked) => handleToggle(rule.id, checked)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
