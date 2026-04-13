import { useConfigStore } from '@/stores/config-store'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { LearnMoreLink } from '@/components/shared/LearnMoreLink'
import { SettingHelp } from '@/components/shared/SettingHelp'
import type { ReverseLookupConfig } from '@/types/config'

const DEFAULT_CONFIG: ReverseLookupConfig = {
  prefix: '`',
  dictionary: 'stroke',
  tips: '〔笔画〕',
  enableCompletion: false,
  preeditFormat: [],
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
          编辑实际写入 schema 的 <code>reverse_lookup</code> 与 recognizer 配置。当前方案：{primarySchemaId}
        </p>
      </div>
      <div className="space-y-4">
        <div>
          <div className="flex flex-wrap items-center gap-x-1.5">
            <Label>触发前缀</Label>
            <SettingHelp>
              <p><code>reverse_lookup/prefix</code> 是进入反查模式的前缀字符或前缀串。</p>
              <p>保存时会自动同步生成 <code>recognizer/patterns/reverse_lookup</code>。</p>
            </SettingHelp>
          </div>
          <Input
            className="mt-1 w-32"
            value={config.prefix}
            onChange={(e) => update({ prefix: e.target.value })}
          />
          <p className="mt-1 text-sm text-gray-500">例如 <code>`</code>、<code>z</code> 或 <code>/stroke</code></p>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-x-1.5">
            <Label>反查字典</Label>
            <SettingHelp>
              <p><code>reverse_lookup/dictionary</code> 指定反查使用的字典，例如内置笔画字典 <code>stroke</code>。</p>
            </SettingHelp>
          </div>
          <Input
            className="mt-1 w-64"
            value={config.dictionary}
            onChange={(e) => update({ dictionary: e.target.value })}
          />
          <p className="mt-1 text-sm text-gray-500">部署时会按这个字典重建对应的反查索引。</p>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-x-1.5">
            <Label>提示文本</Label>
            <SettingHelp>
              <p><code>reverse_lookup/tips</code> 会显示在反查模式的提示区域，用来提醒当前输入的是哪类反查。</p>
            </SettingHelp>
          </div>
          <Input
            className="mt-1 w-64"
            value={config.tips}
            onChange={(e) => update({ tips: e.target.value })}
          />
          <p className="mt-1 text-sm text-gray-500">例如 <code>〔笔画〕</code>、<code>〔拆字〕</code></p>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-x-1.5">
            <Label>Prism 名称</Label>
            <SettingHelp>
              <p><code>reverse_lookup/prism</code> 可显式指定反查索引名；留空时使用方案默认行为。</p>
            </SettingHelp>
          </div>
          <Input
            className="mt-1 w-64"
            value={config.prism ?? ''}
            placeholder="可选"
            onChange={(e) => update({ prism: e.target.value || undefined })}
          />
          <p className="mt-1 text-sm text-gray-500">仅在需要把反查索引名与字典名分开时填写。</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-x-1.5">
              <Label>启用逐码补全</Label>
              <SettingHelp>
                <p><code>reverse_lookup/enable_completion</code> 控制反查输入过程中是否允许前缀补全候选。</p>
              </SettingHelp>
            </div>
            <p className="text-sm text-gray-500">开启后，输入不完整编码时也能提前看到反查候选。</p>
          </div>
          <Switch
            checked={config.enableCompletion}
            onCheckedChange={(checked) => update({ enableCompletion: checked })}
          />
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-x-1.5">
            <Label>预编辑格式</Label>
            <SettingHelp>
              <p><code>reverse_lookup/preedit_format</code> 是按顺序执行的显示规则，每行一条。</p>
              <p>常见写法如 <code>xlit/hspnz/横竖撇捺折/</code>，只影响显示，不改变实际反查编码。</p>
            </SettingHelp>
          </div>
          <Textarea
            className="mt-1 min-h-32"
            value={config.preeditFormat.join('\n')}
            placeholder="每行一条规则"
            onChange={(e) =>
              update({
                preeditFormat: e.target.value
                  .split('\n')
                  .map((line) => line.trim())
                  .filter((line) => line.length > 0),
              })
            }
          />
          <p className="mt-1 text-sm text-gray-500">一行一条规则，保存时会写入数组形式的 <code>preedit_format</code>。</p>
        </div>
      </div>
    </div>
  )
}
