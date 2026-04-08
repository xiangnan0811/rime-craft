import { useConfigStore } from '@/stores/config-store'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { LearnMoreLink } from '@/components/shared/LearnMoreLink'
import type { ReverseLookupConfig, ReverseLookupMethod } from '@/types/config'

const METHOD_LABELS: Record<ReverseLookupMethod, string> = {
  two_part: '两分反查',
  multi_part: '多分反查',
  stroke: '笔画反查',
  tone: '声调反查',
  auxiliary: '辅助码反查',
}

const DATA_SOURCE_LABELS: Record<string, string> = {
  aux: '从词库注释提取',
  db: '从反查数据库提取',
}

const DEFAULT_CONFIG: ReverseLookupConfig = {
  triggerKey: '`',
  dataSource: ['aux', 'db'],
  enabledMethods: ['two_part', 'stroke'],
}

export function ReverseLookup() {
  const schemaList = useConfigStore((s) => s.project.defaultConfig.schemaList)
  const schemaConfigs = useConfigStore((s) => s.project.schemaConfigs)
  const updateSchemaConfig = useConfigStore((s) => s.updateSchemaConfig)

  const primarySchemaId = schemaList[0]?.schema ?? ''
  const config = schemaConfigs[primarySchemaId]?.reverseLookup ?? DEFAULT_CONFIG

  function update(partial: Partial<ReverseLookupConfig>) {
    updateSchemaConfig(primarySchemaId, { reverseLookup: { ...config, ...partial } })
  }

  function toggleMethod(method: ReverseLookupMethod, enabled: boolean) {
    const methods = enabled
      ? [...config.enabledMethods, method]
      : config.enabledMethods.filter((m) => m !== method)
    update({ enabledMethods: methods })
  }

  function toggleDataSource(source: 'aux' | 'db', enabled: boolean) {
    const sources = enabled
      ? [...config.dataSource, source]
      : config.dataSource.filter((s) => s !== source)
    update({ dataSource: sources })
  }

  if (!primarySchemaId) {
    return <div className="text-gray-500">请先在「输入方案管理」中添加至少一个方案。</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">反查与筛选</h3>
          <LearnMoreLink module="reverse-lookup" />
        </div>
        <p className="mt-1 text-sm text-gray-500">
          配置反查触发方式和数据源。当前方案：{primarySchemaId}
        </p>
      </div>
      <div className="space-y-4">
        <div>
          <Label>反查触发键</Label>
          <Input className="mt-1 w-24" value={config.triggerKey}
            onChange={(e) => update({ triggerKey: e.target.value })} />
          <p className="mt-1 text-sm text-gray-500">输入此键后进入反查模式，默认为反引号 `</p>
        </div>
        <div>
          <Label className="mb-2 block">数据源</Label>
          {(Object.entries(DATA_SOURCE_LABELS) as [string, string][]).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between py-1">
              <span className="text-sm">{label}</span>
              <Switch
                checked={config.dataSource.includes(key as 'aux' | 'db')}
                onCheckedChange={(v) => toggleDataSource(key as 'aux' | 'db', v)}
              />
            </div>
          ))}
        </div>
        <div>
          <Label className="mb-2 block">反查方式</Label>
          {(Object.entries(METHOD_LABELS) as [ReverseLookupMethod, string][]).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between py-1">
              <span className="text-sm">{label}</span>
              <Switch
                checked={config.enabledMethods.includes(key)}
                onCheckedChange={(v) => toggleMethod(key, v)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
