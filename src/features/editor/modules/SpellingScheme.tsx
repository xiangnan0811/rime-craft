import { useConfigStore } from '@/stores/config-store'
import { SCHEMA_REGISTRY } from '@/data/schema-registry'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { LearnMoreLink } from '@/components/shared/LearnMoreLink'
import type { SpellingScheme as SpellingSchemeType } from '@/types/config'

const SPELLING_SCHEME_LABELS: Record<SpellingSchemeType, string> = {
  full_pinyin: '全拼',
  flypy: '小鹤双拼',
  zrm: '自然码双拼',
  mspy: '微软双拼',
  sogou: '搜狗双拼',
  abc: '智能ABC双拼',
  ziguang: '紫光双拼',
}

export function SpellingScheme() {
  const schemaList = useConfigStore((s) => s.project.defaultConfig.schemaList)
  const schemaConfigs = useConfigStore((s) => s.project.schemaConfigs)
  const updateSchemaConfig = useConfigStore((s) => s.updateSchemaConfig)

  const primarySchemaId = schemaList[0]?.schema ?? ''
  const schemaInfo = SCHEMA_REGISTRY.find((s) => s.id === primarySchemaId)
  const current = schemaConfigs[primarySchemaId]?.spellingScheme ?? 'full_pinyin'
  const available = schemaInfo?.availableSpellingSchemes ?? ['full_pinyin']

  if (!primarySchemaId) {
    return <div className="text-gray-500">请先在「输入方案管理」中添加至少一个方案。</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">拼写方案</h3>
          <LearnMoreLink module="spelling-scheme" />
        </div>
        <p className="mt-1 text-sm text-gray-500">
          选择当前输入方案使用的拼写规则。当前方案：{primarySchemaId}
        </p>
      </div>
      <div>
        <Label>拼写方案</Label>
        <Select
          value={current}
          onValueChange={(v) => updateSchemaConfig(primarySchemaId, { spellingScheme: v as SpellingSchemeType })}
        >
          <SelectTrigger className="mt-1 w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            {available.map((s) => (
              <SelectItem key={s} value={s}>{SPELLING_SCHEME_LABELS[s] ?? s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="mt-2 text-sm text-gray-500">
          万象拼音支持在方案内切换全拼和多种双拼，无需安装额外方案文件。
        </p>
      </div>
    </div>
  )
}
