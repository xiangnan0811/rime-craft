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
    enableUserDict: true,
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
          <div className="flex items-center gap-1.5">
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
          <div className="flex items-center gap-1.5">
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
          <div className="flex items-center justify-between">
            <div>
              <Label>输入补全</Label>
              <p className="text-sm text-gray-500">打部分拼音时是否显示完整词</p>
            </div>
            <Switch
              checked={translator.enableCompletion}
              onCheckedChange={(v) => updateTranslator({ enableCompletion: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>用户词典</Label>
              <p className="text-sm text-gray-500">启用自动调频和用户词典记忆</p>
            </div>
            <Switch
              checked={translator.enableUserDict}
              onCheckedChange={(v) => updateTranslator({ enableUserDict: v })}
            />
          </div>
          <div>
            <Label>核心词最大长度</Label>
            <Input
              type="number" min={1} max={10} className="mt-1 w-24"
              value={translator.coreWordLength}
              onChange={(e) => updateTranslator({ coreWordLength: Number(e.target.value) })}
            />
            <p className="mt-1 text-sm text-gray-500">影响造句质量，默认 4</p>
          </div>
          <div>
            <Label>候选词最大长度</Label>
            <Input
              type="number" min={1} max={20} className="mt-1 w-24"
              value={translator.maxWordLength}
              onChange={(e) => updateTranslator({ maxWordLength: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>同音词上限</Label>
            <Input
              type="number" min={1} max={20} className="mt-1 w-24"
              value={translator.maxHomophones}
              onChange={(e) => updateTranslator({ maxHomophones: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>同形词上限</Label>
            <Input
              type="number" min={1} max={20} className="mt-1 w-24"
              value={translator.maxHomographs}
              onChange={(e) => updateTranslator({ maxHomographs: Number(e.target.value) })}
            />
          </div>
        </div>
      </details>
    </div>
  )
}
