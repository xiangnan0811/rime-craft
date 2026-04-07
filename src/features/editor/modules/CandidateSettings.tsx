import { useConfigStore } from '@/stores/config-store'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { LearnMoreLink } from '@/components/shared/LearnMoreLink'

const PAGE_SIZE_OPTIONS = [3, 4, 5, 6, 7, 8, 9]
const SELECT_KEY_PRESETS: { label: string; value: string }[] = [
  { label: '数字键 1-9', value: '123456789' },
  { label: '数字键 1-0', value: '1234567890' },
  { label: '字母键 ASDFGHJKL', value: 'ASDFGHJKL' },
]

export function CandidateSettings() {
  const pageSize = useConfigStore((s) => s.project.defaultConfig.pageSize)
  const selectKeys = useConfigStore((s) => s.project.defaultConfig.selectKeys)
  const updateDefaultConfig = useConfigStore((s) => s.updateDefaultConfig)

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
          <Label>每页候选词数量</Label>
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
          <Label>选词按键</Label>
          <Select
            value={SELECT_KEY_PRESETS.find((p) => p.value === selectKeys) ? selectKeys : 'custom'}
            onValueChange={(v) => { if (v !== 'custom') updateDefaultConfig({ selectKeys: v }) }}
          >
            <SelectTrigger className="mt-1 w-64"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SELECT_KEY_PRESETS.map((p) => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
              <SelectItem value="custom">自定义...</SelectItem>
            </SelectContent>
          </Select>
          {!SELECT_KEY_PRESETS.find((p) => p.value === selectKeys) && (
            <Input className="mt-2 w-64" value={selectKeys}
              onChange={(e) => updateDefaultConfig({ selectKeys: e.target.value })}
              placeholder="输入选词按键序列" />
          )}
        </div>
      </div>
    </div>
  )
}
