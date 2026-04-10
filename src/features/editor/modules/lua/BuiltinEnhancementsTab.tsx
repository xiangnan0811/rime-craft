import { useConfigStore } from '@/stores/config-store'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { SettingHelp } from '@/components/shared/SettingHelp'
import type { LuaExtensionsConfig } from '@/types/config'

const DEFAULT_CONFIG: LuaExtensionsConfig = {
  superComment: { candidateLength: 2, correctorType: '〔纠错〕' },
  superProcessor: { backspaceLimit: true, segLoop: true, toneFallback: true, limitRepeated: '8,40' },
  userPredict: { maxCandidates: 10, expiryDays: 90, activationDays: 7 },
  superReplacer: { chain: true, delimiter: '|' },
  inputStatistics: { enabled: true },
}

export function BuiltinEnhancementsTab() {
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
      {/* 超级注释 */}
      <div className="rounded-lg border p-5 space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">超级注释</h4>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Filter</Badge>
          </div>
          <p className="mt-1 text-sm text-gray-500">为候选词添加辅助码编码、纠错提示、拼音标注等注释信息，是辅助码学习阶段最有价值的功能。</p>
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-x-1.5">
            <Label>注释候选长度</Label>
            <SettingHelp>
              <p>设为 1 仅单字显示注释，设为 2 则两字词也会显示。值越大，显示注释的候选词范围越广。</p>
              <p>超级注释的显示/隐藏由「开关」中的注释模式控制，这里配置的是注释的内容范围。</p>
            </SettingHelp>
          </div>
          <Input type="number" min={1} max={10} className="mt-1 w-24"
            value={config.superComment?.candidateLength ?? 2}
            onChange={(e) => update({ superComment: { ...config.superComment!, candidateLength: Number(e.target.value) } })} />
          <p className="mt-1 text-sm text-gray-500">显示注释的候选词最大字数</p>
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-x-1.5">
            <Label>纠错提示格式</Label>
            <SettingHelp>
              <p>当输入的拼音有误时，超级注释会在候选词旁显示纠错提示。此项控制纠错提示的包裹格式，例如默认的〔纠错〕。</p>
            </SettingHelp>
          </div>
          <Input className="mt-1 w-48" value={config.superComment?.correctorType ?? '〔纠错〕'}
            onChange={(e) => update({ superComment: { ...config.superComment!, correctorType: e.target.value } })} />
          <p className="mt-1 text-sm text-gray-500">纠错提示的显示格式</p>
        </div>
      </div>

      {/* 超级处理器 */}
      <div className="rounded-lg border p-5 space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">超级处理器</h4>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Processor</Badge>
          </div>
          <p className="mt-1 text-sm text-gray-500">增强键盘处理逻辑，提供退格保护、音节导航、声调智能回落等实用功能。</p>
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-x-1.5">
              <Label>退格限制</Label>
              <SettingHelp>
                <p>防止在输入过程中误按退格键删除过多字符。当输入串较长时，退格键只删除最后一个字符而不会清空整个输入。</p>
              </SettingHelp>
            </div>
            <p className="text-sm text-gray-500">防止退格键误删过多输入内容</p>
          </div>
          <Switch checked={config.superProcessor?.backspaceLimit ?? true}
            onCheckedChange={(v) => update({ superProcessor: { ...config.superProcessor!, backspaceLimit: v } })} />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-x-1.5">
              <Label>音节循环</Label>
              <SettingHelp>
                <p>输入 nihao 时按 Tab 可在 ni 和 hao 之间切换焦点，方便修改特定音节。</p>
              </SettingHelp>
            </div>
            <p className="text-sm text-gray-500">Tab 键在音节之间循环跳转</p>
          </div>
          <Switch checked={config.superProcessor?.segLoop ?? true}
            onCheckedChange={(v) => update({ superProcessor: { ...config.superProcessor!, segLoop: v } })} />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-x-1.5">
              <Label>声调回落</Label>
              <SettingHelp>
                <p>输入声调符号时，如果当前编码不支持声调输入，自动将声调字符回落为普通数字，避免卡住。</p>
              </SettingHelp>
            </div>
            <p className="text-sm text-gray-500">不支持声调时自动回落为数字</p>
          </div>
          <Switch checked={config.superProcessor?.toneFallback ?? true}
            onCheckedChange={(v) => update({ superProcessor: { ...config.superProcessor!, toneFallback: v } })} />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-x-1.5">
            <Label>重复上屏限制</Label>
            <SettingHelp>
              <p>限制连续重复上屏相同候选词的次数。格式为「最小长度,最大次数」，例如默认值 <code>8,40</code> 表示当输入编码长度达到 8 时，同一候选最多连续上屏 40 次。</p>
              <p>用于防止误操作导致大量重复字符。如不需要限制可留空。</p>
            </SettingHelp>
          </div>
          <Input className="mt-1 w-32" value={config.superProcessor?.limitRepeated ?? '8,40'}
            placeholder="8,40"
            onChange={(e) => update({ superProcessor: { ...config.superProcessor!, limitRepeated: e.target.value } })} />
          <p className="mt-1 text-sm text-gray-500">格式：最小长度,最大次数</p>
        </div>
      </div>

      {/* 超级替换 */}
      <div className="rounded-lg border p-5 space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">超级替换</h4>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Filter</Badge>
          </div>
          <p className="mt-1 text-sm text-gray-500">对候选词文本进行自动替换处理，支持链式多轮替换，可自定义分隔符。</p>
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-x-1.5">
              <Label>链式替换</Label>
              <SettingHelp>
                <p>启用后，多条替换规则会按顺序依次执行，前一条规则的输出作为下一条的输入，实现多轮替换。</p>
                <p>关闭后，所有替换规则独立执行，互不影响。</p>
              </SettingHelp>
            </div>
            <p className="text-sm text-gray-500">多条替换规则按顺序依次执行</p>
          </div>
          <Switch checked={config.superReplacer?.chain ?? true}
            onCheckedChange={(v) => update({ superReplacer: { ...config.superReplacer!, chain: v } })} />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-x-1.5">
            <Label>分隔符</Label>
            <SettingHelp>
              <p>替换规则中用于分隔「匹配文本」和「替换文本」的符号。默认使用 <code>|</code>，例如 <code>旧文本|新文本</code>。</p>
            </SettingHelp>
          </div>
          <Input className="mt-1 w-24" value={config.superReplacer?.delimiter ?? '|'}
            onChange={(e) => update({ superReplacer: { ...config.superReplacer!, delimiter: e.target.value } })} />
          <p className="mt-1 text-sm text-gray-500">替换规则中的分隔字符</p>
        </div>
      </div>

      {/* 用户预测 */}
      <div className="rounded-lg border p-5 space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">用户预测</h4>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Filter</Badge>
          </div>
          <p className="mt-1 text-sm text-gray-500">基于输入历史智能预测下一个词，在候选列表末尾显示灰色预测词。</p>
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-x-1.5">
            <Label>最大候选数</Label>
            <SettingHelp>
              <p>基于你的输入历史，在候选词列表末尾显示灰色的预测词。数量越多提示越全面，但可能干扰正常选词。</p>
            </SettingHelp>
          </div>
          <Input type="number" min={1} max={50} className="mt-1 w-24"
            value={config.userPredict?.maxCandidates ?? 10}
            onChange={(e) => update({ userPredict: { ...config.userPredict!, maxCandidates: Number(e.target.value) } })} />
          <p className="mt-1 text-sm text-gray-500">预测词最多显示几个</p>
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-x-1.5">
            <Label>过期天数</Label>
            <SettingHelp>
              <p>较短的过期时间让预测更贴近近期用词习惯，较长则记忆更持久。</p>
            </SettingHelp>
          </div>
          <Input type="number" min={1} max={365} className="mt-1 w-24"
            value={config.userPredict?.expiryDays ?? 90}
            onChange={(e) => update({ userPredict: { ...config.userPredict!, expiryDays: Number(e.target.value) } })} />
          <p className="mt-1 text-sm text-gray-500">超过此天数的历史不参与预测</p>
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-x-1.5">
            <Label>激活天数</Label>
            <SettingHelp>
              <p>新安装后需使用满此天数才会开始预测，避免数据不足时给出低质量预测。如果从其他设备迁移了用户词典，可设为 0 立即启用。</p>
            </SettingHelp>
          </div>
          <Input type="number" min={0} max={30} className="mt-1 w-24"
            value={config.userPredict?.activationDays ?? 7}
            onChange={(e) => update({ userPredict: { ...config.userPredict!, activationDays: Number(e.target.value) } })} />
          <p className="mt-1 text-sm text-gray-500">使用多少天后开始激活预测，设为 0 立即启用</p>
        </div>
      </div>

      {/* 输入统计 */}
      <div className="rounded-lg border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold">输入统计</h4>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Lua</Badge>
            </div>
            <p className="mt-1 text-sm text-gray-500">记录输入字数、词数等统计数据，可通过 /tj 和 /rtj 触发码查看。</p>
          </div>
          <Switch checked={config.inputStatistics?.enabled ?? true}
            onCheckedChange={(v) => update({ inputStatistics: { enabled: v } })} />
        </div>
      </div>
    </div>
  )
}
