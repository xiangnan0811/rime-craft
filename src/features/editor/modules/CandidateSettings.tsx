import { useState } from 'react'
import { useConfigStore } from '@/stores/config-store'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { LearnMoreLink } from '@/components/shared/LearnMoreLink'
import { SettingHelp } from '@/components/shared/SettingHelp'
import { ModifiedBadge } from '@/components/shared/ModifiedBadge'
import { getModifiedFields } from '@/lib/config/diff'
import type { TranslatorConfig } from '@/types/config'

const PAGE_SIZE_OPTIONS = [3, 4, 5, 6, 7, 8, 9]

function getSelectKeyPresets(pageSize: number) {
  const digits = '1234567890'
  const sized = digits.slice(0, pageSize)
  const presets: { label: string; value: string }[] = []

  presets.push({ label: `数字键 1-${sized.slice(-1)}`, value: sized })

  if (pageSize !== 9) presets.push({ label: '数字键 1-9', value: '123456789' })
  if (pageSize !== 10) presets.push({ label: '数字键 1-0', value: '1234567890' })

  presets.push({ label: '字母键 ASDFGHJKL', value: 'ASDFGHJKL' })
  return presets
}

export function CandidateSettings() {
  const pageSize = useConfigStore((s) => s.project.defaultConfig.pageSize)
  const selectKeys = useConfigStore((s) => s.project.defaultConfig.selectKeys)
  const updateDefaultConfig = useConfigStore((s) => s.updateDefaultConfig)
  const defaultConfig = useConfigStore((s) => s.project.defaultConfig)
  const modified = getModifiedFields(defaultConfig)

  const [customMode, setCustomMode] = useState(false)
  const presets = getSelectKeyPresets(pageSize)
  const isPreset = presets.some((p) => p.value === selectKeys)
  const showCustomInput = customMode || !isPreset

  const schemaList = useConfigStore((s) => s.project.defaultConfig.schemaList)
  const schemaConfigs = useConfigStore((s) => s.project.schemaConfigs)
  const updateSchemaConfig = useConfigStore((s) => s.updateSchemaConfig)
  const primarySchemaId = schemaList[0]?.schema ?? ''

  const DEFAULT_TRANSLATOR: TranslatorConfig = {
    enableCompletion: true,
    enableSentence: true,
    enableUserDict: true,
    initialQuality: 1.2,
    coreWordLength: 4,
    maxWordLength: 7,
    maxHomophones: 8,
    maxHomographs: 8,
    spellingHints: 30,
    alwaysShowComments: true,
  }

  const translator = schemaConfigs[primarySchemaId]?.translator ?? DEFAULT_TRANSLATOR

  function updateTranslator(partial: Partial<TranslatorConfig>) {
    updateSchemaConfig(primarySchemaId, {
      translator: { ...translator, ...partial },
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">候选词设置</h3>
          <LearnMoreLink module="candidate-settings" />
        </div>
        <p className="mt-1 text-sm text-gray-500">设置候选词每页显示数量和选词按键。</p>
      </div>
      <div className="space-y-4">
        <div>
          <div className="flex flex-wrap items-center gap-x-1.5">
            <Label>每页候选词数量</Label>
            <ModifiedBadge show={modified.has('pageSize')} />
          </div>
          <Select value={String(pageSize)} onValueChange={(v) => updateDefaultConfig({ pageSize: Number(v) })}>
            <SelectTrigger className="mt-1 w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>{n} 个</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-1 text-sm text-gray-500">建议 5-9 个，数量越多翻页越少，但候选框越大。</p>
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-x-1.5">
            <Label>选词按键</Label>
            <ModifiedBadge show={modified.has('selectKeys')} />
          </div>
          <Select
            value={showCustomInput ? 'custom' : selectKeys}
            onValueChange={(v) => {
              if (v === 'custom') {
                setCustomMode(true)
              } else {
                setCustomMode(false)
                updateDefaultConfig({ selectKeys: v })
              }
            }}
          >
            <SelectTrigger className="mt-1 w-64"><SelectValue /></SelectTrigger>
            <SelectContent>
              {presets.map((p) => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
              <SelectItem value="custom">自定义...</SelectItem>
            </SelectContent>
          </Select>
          {showCustomInput && (
            <Input className="mt-2 w-64" value={selectKeys}
              onChange={(e) => updateDefaultConfig({ selectKeys: e.target.value })}
              placeholder={`输入 ${pageSize} 个选词按键`} />
          )}
        </div>
      </div>
      <Separator className="my-4" />
      <details className="group">
        <summary className="cursor-pointer font-medium text-gray-700">
          高级设置
          <span className="ml-1 text-xs text-gray-400">（翻译器参数）</span>
        </summary>
        <div className="mt-3 space-y-4">
          {/* 输入补全 */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-x-1.5">
                <Label>输入补全</Label>
                <SettingHelp>
                  <p>开启后，输入不完整的拼音也会显示候选词。例如只输入 <code>n</code> 就能看到「你、那、能……」。关闭后必须输入完整音节（如 <code>ni</code>）才会出现候选。</p>
                  <p>建议：大多数用户应保持开启。仅在使用辅助码且希望减少干扰时才考虑关闭。</p>
                </SettingHelp>
              </div>
              <p className="text-sm text-gray-500">打部分拼音时是否显示完整词</p>
            </div>
            <Switch
              checked={translator.enableCompletion}
              onCheckedChange={(v) => updateTranslator({ enableCompletion: v })}
            />
          </div>

          {/* 整句模式 (新增) */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-x-1.5">
                <Label>整句模式</Label>
                <SettingHelp>
                  <p>开启后，Rime 会尝试将你输入的多个音节自动组合成一个完整的句子作为候选。例如输入 <code>jintiandianqihenhao</code> 可能直接出现「今天天气很好」。</p>
                  <p>关闭后，每次只匹配单个词组，需要逐词选择。</p>
                  <ul>
                    <li>习惯整句输入的用户建议开启</li>
                    <li>习惯逐词输入、搭配辅助码精准选词的用户可以关闭</li>
                  </ul>
                </SettingHelp>
              </div>
              <p className="text-sm text-gray-500">尝试将多个音节组合成完整句子候选</p>
            </div>
            <Switch
              checked={translator.enableSentence}
              onCheckedChange={(v) => updateTranslator({ enableSentence: v })}
            />
          </div>

          {/* 用户词典 */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-x-1.5">
                <Label>用户词典</Label>
                <SettingHelp>
                  <p>开启后，Rime 会根据你的使用习惯自动调整候选词排序（常用词排前面），并记住你选过的自造词组。</p>
                  <p>关闭后，候选词排序完全由词典决定，不会学习你的使用习惯。适合不希望输入法「记住」自己输入内容的用户。</p>
                </SettingHelp>
              </div>
              <p className="text-sm text-gray-500">启用自动调频和用户词典记忆</p>
            </div>
            <Switch
              checked={translator.enableUserDict}
              onCheckedChange={(v) => updateTranslator({ enableUserDict: v })}
            />
          </div>

          {/* 核心词最大长度 */}
          <div>
            <div className="flex flex-wrap items-center gap-x-1.5">
              <Label>核心词最大长度</Label>
              <SettingHelp>
                <p>控制 Rime 造句引擎在组合候选句子时，最多使用多长的词组。</p>
                <ul>
                  <li><strong>推荐值</strong>：4（平衡速度和质量）</li>
                  <li>较小值 (2-3)：造句速度更快，但可能把长词拆开</li>
                  <li>较大值 (5-7)：更多长词组参与造句，但计算量增加</li>
                </ul>
                <p>对于单字输入为主的用户，这个值影响不大。</p>
              </SettingHelp>
            </div>
            <Input
              type="number" min={1} max={10} className="mt-1 w-24"
              value={translator.coreWordLength}
              onChange={(e) => updateTranslator({ coreWordLength: Number(e.target.value) })}
            />
            <p className="mt-1 text-sm text-gray-500">参与造句的最长词组长度，默认 4</p>
          </div>

          {/* 候选词最大长度 */}
          <div>
            <div className="flex flex-wrap items-center gap-x-1.5">
              <Label>候选词最大长度</Label>
              <SettingHelp>
                <p>限制候选列表中显示的最长词组。超过此长度的词组不会出现在候选中。</p>
                <ul>
                  <li>较小值 (3-4)：候选列表更紧凑，适合偏好短词的用户</li>
                  <li>较大值 (10-20)：允许显示长成语、诗句等，适合整句输入</li>
                  <li>默认值 7 能覆盖绝大多数常用词组</li>
                </ul>
              </SettingHelp>
            </div>
            <Input
              type="number" min={1} max={20} className="mt-1 w-24"
              value={translator.maxWordLength}
              onChange={(e) => updateTranslator({ maxWordLength: Number(e.target.value) })}
            />
            <p className="mt-1 text-sm text-gray-500">候选列表中词组的最大字数，默认 7</p>
          </div>

          {/* 同音词上限 */}
          <div>
            <div className="flex flex-wrap items-center gap-x-1.5">
              <Label>同音词上限</Label>
              <SettingHelp>
                <p>限制同一个拼音下显示的候选词数量。例如拼音 <code>shi</code> 对应的汉字非常多（是、时、十、事……），此值控制最多列出多少个。</p>
                <ul>
                  <li>较小值 (3-5)：候选更精简，翻页更少，但可能漏掉需要的字</li>
                  <li>较大值 (10-20)：候选更全面，但需要更多翻页</li>
                  <li>默认值 8 适合大多数场景</li>
                </ul>
              </SettingHelp>
            </div>
            <Input
              type="number" min={1} max={20} className="mt-1 w-24"
              value={translator.maxHomophones}
              onChange={(e) => updateTranslator({ maxHomophones: Number(e.target.value) })}
            />
            <p className="mt-1 text-sm text-gray-500">相同拼音的候选词最多显示几个</p>
          </div>

          {/* 同形词上限 */}
          <div>
            <div className="flex flex-wrap items-center gap-x-1.5">
              <Label>同形词上限</Label>
              <SettingHelp>
                <p>限制同一个字形但不同读音的变体数量。例如「行」有 háng 和 xíng 两个读音，此值控制这类多音字变体的显示上限。</p>
                <ul>
                  <li>通常不需要调整，默认值 8 足够</li>
                  <li>如果候选中出现太多生僻读音的变体，可以适当调小</li>
                </ul>
              </SettingHelp>
            </div>
            <Input
              type="number" min={1} max={20} className="mt-1 w-24"
              value={translator.maxHomographs}
              onChange={(e) => updateTranslator({ maxHomographs: Number(e.target.value) })}
            />
            <p className="mt-1 text-sm text-gray-500">相同字形不同读音的候选词最多显示几个</p>
          </div>

          {/* 翻译器优先级 (新增) */}
          <div>
            <div className="flex flex-wrap items-center gap-x-1.5">
              <Label>翻译器优先级</Label>
              <SettingHelp>
                <p>控制此翻译器生成的候选词在排序中的初始权重。数值越高，排名越靠前。</p>
                <ul>
                  <li>默认值 1.2，通常不需要修改</li>
                  <li>当你同时使用多个翻译器（如拼音 + 英文）时，可以通过调整此值来控制哪个翻译器的候选词优先显示</li>
                  <li>对于只使用单个输入方案的用户，此设置没有影响</li>
                </ul>
              </SettingHelp>
            </div>
            <Input
              type="number" min={0} max={10} step={0.1} className="mt-1 w-24"
              value={translator.initialQuality}
              onChange={(e) => updateTranslator({ initialQuality: Number(e.target.value) })}
            />
            <p className="mt-1 text-sm text-gray-500">候选词的初始排序权重，默认 1.2</p>
          </div>
        </div>
      </details>
    </div>
  )
}
