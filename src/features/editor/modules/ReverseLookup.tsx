import { useConfigStore } from '@/stores/config-store'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { LearnMoreLink } from '@/components/shared/LearnMoreLink'
import { SettingHelp } from '@/components/shared/SettingHelp'
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

const DATA_SOURCE_INFO: Record<string, { desc: string; help: string }> = {
  aux: {
    desc: '轻量数据源，随词库更新',
    help: '从词库注释中提取反查数据。轻量且随词库自动更新，但数据可能不完整，生僻字覆盖较少。',
  },
  db: {
    desc: '独立数据库，数据更完整',
    help: '使用独立的反查数据库文件。数据更完整准确，覆盖更多生僻字和异体字，但需额外存储空间。推荐经常使用反查的用户选择。',
  },
}

const METHOD_INFO: Record<string, { desc: string; help: string }> = {
  two_part: {
    desc: '将字拆成两部分查找',
    help: '将字拆成左右或上下两部分，分别输入它们的拼音。例如「明」拆为「日」+「月」，输入 ri+yue 即可找到。',
  },
  multi_part: {
    desc: '将字拆成多个部分查找',
    help: '将字拆成多个部分分别输入拼音。适合结构复杂的字，例如「赢」可拆为「亡口月贝凡」。',
  },
  stroke: {
    desc: '用 h/s/p/n/z 代表五种笔画',
    help: '用固定字母代表笔画：h=横、s=竖、p=撇、n=捺、z=折。需按标准笔顺依次输入对应字母。',
  },
  tone: {
    desc: '通过声调信息辅助筛选',
    help: '输入拼音后附加声调信息来缩小候选范围，提高反查精度。',
  },
  auxiliary: {
    desc: '利用辅助码编码反查',
    help: '利用已知的辅助码编码进行反查。适合已经学习了辅助码方案的用户。',
  },
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
          <div className="flex flex-wrap items-center gap-x-1.5">
            <Label>反查触发键</Label>
            <SettingHelp>
              <p>按下此键后进入反查模式，可通过字形拆分、笔画等方式查找不知道读音的字。反查结果中会显示拼音和辅助码编码，帮助学习新字的输入方法。</p>
            </SettingHelp>
          </div>
          <Input className="mt-1 w-24" value={config.triggerKey}
            onChange={(e) => update({ triggerKey: e.target.value })} />
          <p className="mt-1 text-sm text-gray-500">输入此键后进入反查模式，默认为反引号 `</p>
        </div>
        <div>
          <Label className="mb-2 block">数据源</Label>
          {(Object.entries(DATA_SOURCE_LABELS) as [string, string][]).map(([key, label]) => {
            const info = DATA_SOURCE_INFO[key]
            return (
              <div key={key} className="flex items-center justify-between py-1.5">
                <div className="space-y-0.5">
                  <div className="flex flex-wrap items-center gap-x-1.5">
                    <span className="text-sm font-medium">{label}</span>
                    {info && (
                      <SettingHelp>
                        <p>{info.help}</p>
                      </SettingHelp>
                    )}
                  </div>
                  {info && <p className="text-xs text-gray-500">{info.desc}</p>}
                </div>
                <Switch
                  checked={config.dataSource.includes(key as 'aux' | 'db')}
                  onCheckedChange={(v) => toggleDataSource(key as 'aux' | 'db', v)}
                />
              </div>
            )
          })}
        </div>
        <div>
          <Label className="mb-2 block">反查方式</Label>
          {(Object.entries(METHOD_LABELS) as [ReverseLookupMethod, string][]).map(([key, label]) => {
            const info = METHOD_INFO[key]
            return (
              <div key={key} className="flex items-center justify-between py-1.5">
                <div className="space-y-0.5">
                  <div className="flex flex-wrap items-center gap-x-1.5">
                    <span className="text-sm font-medium">{label}</span>
                    {info && (
                      <SettingHelp>
                        <p>{info.help}</p>
                      </SettingHelp>
                    )}
                  </div>
                  {info && <p className="text-xs text-gray-500">{info.desc}</p>}
                </div>
                <Switch
                  checked={config.enabledMethods.includes(key)}
                  onCheckedChange={(v) => toggleMethod(key, v)}
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
