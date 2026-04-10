import { useConfigStore } from '@/stores/config-store'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { LearnMoreLink } from '@/components/shared/LearnMoreLink'
import { SettingHelp } from '@/components/shared/SettingHelp'
import type { DisplayConfig } from '@/types/config'

const COMMENT_MODE_OPTIONS = [
  { value: 'off', label: '关闭注释' },
  { value: 'toned', label: '有声调注释' },
  { value: 'toneless', label: '无声调注释' },
]

const ENCODING_DISPLAY_OPTIONS = [
  { value: 'raw', label: '原始编码' },
  { value: 'toned', label: '带声调拼音' },
  { value: 'toneless', label: '无声调拼音' },
]

const DEFAULT_DISPLAY: DisplayConfig = {
  horizontal: false,
  commentMode: 'off',
  encodingDisplay: 'raw',
}

export function CommentHints() {
  const schemaList = useConfigStore((s) => s.project.defaultConfig.schemaList)
  const schemaConfigs = useConfigStore((s) => s.project.schemaConfigs)
  const updateSchemaConfig = useConfigStore((s) => s.updateSchemaConfig)

  const primarySchemaId = schemaList[0]?.schema ?? ''
  const config = schemaConfigs[primarySchemaId]?.displayConfig ?? DEFAULT_DISPLAY

  function update(partial: Partial<DisplayConfig>) {
    updateSchemaConfig(primarySchemaId, { displayConfig: { ...config, ...partial } })
  }

  if (!primarySchemaId) {
    return <div className="text-gray-500">请先在「输入方案管理」中添加至少一个方案。</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">注释与提示</h3>
          <LearnMoreLink module="comment-hints" />
        </div>
        <p className="mt-1 text-sm text-gray-500">配置候选词注释和编码显示方式。</p>
      </div>
      <div className="space-y-4">
        <div>
          <div className="flex flex-wrap items-center gap-x-1.5">
            <Label>注释模式</Label>
            <SettingHelp>
              <p>控制候选词旁边显示的注释内容：</p>
              <ul>
                <li><strong>关闭注释</strong>：候选词旁不显示任何注释信息</li>
                <li><strong>有声调注释</strong>：显示带声调标记的拼音（如 nǐ hǎo），配合超级注释还会显示辅助码编码</li>
                <li><strong>无声调注释</strong>：显示不带声调的拼音（如 ni hao）</li>
              </ul>
            </SettingHelp>
          </div>
          <Select value={config.commentMode} onValueChange={(v) => update({ commentMode: v as DisplayConfig['commentMode'] })}>
            <SelectTrigger className="mt-1 w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              {COMMENT_MODE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-1 text-sm text-gray-500">候选词旁的注释内容和格式</p>
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-x-1.5">
            <Label>编码显示</Label>
            <SettingHelp>
              <p>控制候选栏上方显示的编码格式：</p>
              <ul>
                <li><strong>原始编码</strong>：显示实际按键（如双拼的 nihk）</li>
                <li><strong>带声调拼音</strong>：转换为标准带声调拼音（如 nǐ hǎo），对双拼用户特别有用</li>
                <li><strong>无声调拼音</strong>：转换为无声调拼音（如 ni hao）</li>
              </ul>
            </SettingHelp>
          </div>
          <Select value={config.encodingDisplay} onValueChange={(v) => update({ encodingDisplay: v as DisplayConfig['encodingDisplay'] })}>
            <SelectTrigger className="mt-1 w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ENCODING_DISPLAY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-1 text-sm text-gray-500">控制候选栏中显示的编码格式</p>
        </div>
      </div>
    </div>
  )
}
