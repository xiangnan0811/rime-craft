import { useConfigStore } from '@/stores/config-store'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { LearnMoreLink } from '@/components/shared/LearnMoreLink'
import type { LuaExtensionsConfig } from '@/types/config'

const DEFAULT_CONFIG: LuaExtensionsConfig = {
  superComment: { candidateLength: 2, correctorType: '〔纠错〕' },
  superProcessor: { backspaceLimit: true, segLoop: true, toneFallback: true, limitRepeated: '8,40' },
  userPredict: { maxCandidates: 10, expiryDays: 90, activationDays: 7 },
  superReplacer: { chain: true, delimiter: '|' },
  inputStatistics: { enabled: true },
}

export function LuaExtensions() {
  const schemaList = useConfigStore((s) => s.project.defaultConfig.schemaList)
  const schemaConfigs = useConfigStore((s) => s.project.schemaConfigs)
  const updateSchemaConfig = useConfigStore((s) => s.updateSchemaConfig)

  const primarySchemaId = schemaList[0]?.schema ?? ''
  const config = schemaConfigs[primarySchemaId]?.luaExtensions ?? DEFAULT_CONFIG

  function update(partial: Partial<LuaExtensionsConfig>) {
    updateSchemaConfig(primarySchemaId, { luaExtensions: { ...config, ...partial } })
  }

  if (!primarySchemaId) {
    return <div className="text-gray-500">请先在「输入方案管理」中添加至少一个方案。</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Lua 扩展</h3>
          <LearnMoreLink module="lua-extensions" />
        </div>
        <p className="mt-1 text-sm text-gray-500">配置万象拼音内置的 Lua 功能扩展。</p>
      </div>

      <details>
        <summary className="cursor-pointer font-medium">超级注释</summary>
        <div className="mt-2 space-y-3 pl-4">
          <div>
            <Label>注释候选长度</Label>
            <Input type="number" min={1} max={10} className="mt-1 w-24"
              value={config.superComment?.candidateLength ?? 2}
              onChange={(e) => update({ superComment: { ...config.superComment!, candidateLength: Number(e.target.value) } })} />
          </div>
          <div>
            <Label>纠错提示格式</Label>
            <Input className="mt-1 w-48" value={config.superComment?.correctorType ?? '〔纠错〕'}
              onChange={(e) => update({ superComment: { ...config.superComment!, correctorType: e.target.value } })} />
          </div>
        </div>
      </details>
      <Separator />

      <details>
        <summary className="cursor-pointer font-medium">超级处理器</summary>
        <div className="mt-2 space-y-3 pl-4">
          <div className="flex items-center justify-between">
            <Label>退格限制</Label>
            <Switch checked={config.superProcessor?.backspaceLimit ?? true}
              onCheckedChange={(v) => update({ superProcessor: { ...config.superProcessor!, backspaceLimit: v } })} />
          </div>
          <div className="flex items-center justify-between">
            <Label>音节循环</Label>
            <Switch checked={config.superProcessor?.segLoop ?? true}
              onCheckedChange={(v) => update({ superProcessor: { ...config.superProcessor!, segLoop: v } })} />
          </div>
          <div className="flex items-center justify-between">
            <Label>声调回落</Label>
            <Switch checked={config.superProcessor?.toneFallback ?? true}
              onCheckedChange={(v) => update({ superProcessor: { ...config.superProcessor!, toneFallback: v } })} />
          </div>
        </div>
      </details>
      <Separator />

      <details>
        <summary className="cursor-pointer font-medium">用户预测</summary>
        <div className="mt-2 space-y-3 pl-4">
          <div>
            <Label>最大候选数</Label>
            <Input type="number" min={1} max={50} className="mt-1 w-24"
              value={config.userPredict?.maxCandidates ?? 10}
              onChange={(e) => update({ userPredict: { ...config.userPredict!, maxCandidates: Number(e.target.value) } })} />
          </div>
          <div>
            <Label>过期天数</Label>
            <Input type="number" min={1} max={365} className="mt-1 w-24"
              value={config.userPredict?.expiryDays ?? 90}
              onChange={(e) => update({ userPredict: { ...config.userPredict!, expiryDays: Number(e.target.value) } })} />
          </div>
          <div>
            <Label>激活天数</Label>
            <Input type="number" min={1} max={30} className="mt-1 w-24"
              value={config.userPredict?.activationDays ?? 7}
              onChange={(e) => update({ userPredict: { ...config.userPredict!, activationDays: Number(e.target.value) } })} />
          </div>
        </div>
      </details>
      <Separator />

      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">输入统计</p>
          <p className="text-sm text-gray-500">记录输入统计数据</p>
        </div>
        <Switch checked={config.inputStatistics?.enabled ?? true}
          onCheckedChange={(v) => update({ inputStatistics: { enabled: v } })} />
      </div>
    </div>
  )
}
