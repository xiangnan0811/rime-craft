import { useConfigStore } from '@/stores/config-store'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import type { SwitchKeyAction } from '@/types/config'
import { LearnMoreLink } from '@/components/shared/LearnMoreLink'
import { ModifiedBadge } from '@/components/shared/ModifiedBadge'
import { getModifiedFields } from '@/lib/config/diff'
import { FUNCTION_KEY_DEFINITIONS, FUNCTION_KEY_CATEGORIES } from '@/data/key-binding-definitions'

const SWITCH_KEY_OPTIONS: { value: SwitchKeyAction; label: string }[] = [
  { value: 'inline_ascii', label: '行内切换英文' },
  { value: 'commit_code', label: '提交编码并切换英文' },
  { value: 'commit_text', label: '提交文本并切换英文' },
  { value: 'clear', label: '清除编码并切换英文' },
  { value: 'noop', label: '无操作' },
]

type SwitchKeyName = 'shiftL' | 'shiftR' | 'controlL' | 'controlR' | 'capsLock'

const KEY_NAMES: { key: SwitchKeyName; label: string; description: string }[] = [
  { key: 'shiftL', label: '左 Shift', description: '按下左 Shift 键时的行为' },
  { key: 'shiftR', label: '右 Shift', description: '按下右 Shift 键时的行为' },
  { key: 'controlL', label: '左 Control', description: '按下左 Control 键时的行为' },
  { key: 'controlR', label: '右 Control', description: '按下右 Control 键时的行为' },
  { key: 'capsLock', label: 'Caps Lock', description: '按下 Caps Lock 键时的行为' },
]

export function KeyBindings() {
  const asciiComposer = useConfigStore((s) => s.project.defaultConfig.asciiComposer)
  const updateDefaultConfig = useConfigStore((s) => s.updateDefaultConfig)
  const defaultConfig = useConfigStore((s) => s.project.defaultConfig)
  const modified = getModifiedFields(defaultConfig)
  const keyBindings = useConfigStore((s) => s.project.defaultConfig.keyBinder.bindings)

  function handleSwitchKeyChange(key: SwitchKeyName, value: SwitchKeyAction) {
    updateDefaultConfig({
      asciiComposer: {
        ...asciiComposer,
        switchKey: { ...asciiComposer.switchKey, [key]: value },
      },
    })
  }

  function isFunctionKeyEnabled(defId: string): boolean {
    const def = FUNCTION_KEY_DEFINITIONS.find((d) => d.id === defId)
    if (!def) return false
    return keyBindings.some((b) => b.accept === def.defaultAccept)
  }

  function toggleFunctionKey(defId: string, enabled: boolean) {
    const def = FUNCTION_KEY_DEFINITIONS.find((d) => d.id === defId)
    if (!def) return
    let newBindings = keyBindings.filter((b) => b.accept !== def.defaultAccept)
    if (enabled) {
      const binding: { when: string; accept: string; send: string; toggle?: string } = {
        when: def.when,
        accept: def.defaultAccept,
        send: def.defaultSend ?? '',
      }
      if (def.defaultToggle) {
        binding.toggle = def.defaultToggle
        binding.send = ''
      }
      newBindings = [...newBindings, binding]
    }
    updateDefaultConfig({ keyBinder: { bindings: newBindings } })
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">按键绑定</h3>
          <LearnMoreLink module="key-bindings" />
        </div>
        <p className="mt-1 text-sm text-gray-500">配置修饰键的中英文切换行为。</p>
      </div>
      <div className="space-y-4">
        {KEY_NAMES.map(({ key, label, description }) => (
          <div key={key}>
            <div className="flex items-center gap-1.5">
              <Label>{label}</Label>
              <ModifiedBadge show={modified.has(`asciiComposer.switchKey.${key}`)} />
            </div>
            <Select value={asciiComposer.switchKey[key]} onValueChange={(v) => handleSwitchKeyChange(key, v as SwitchKeyAction)}>
              <SelectTrigger className="mt-1 w-72"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SWITCH_KEY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          </div>
        ))}
        <div className="flex items-center gap-3 pt-2">
          <Switch checked={asciiComposer.goodOldCapsLock}
            onCheckedChange={(checked) => updateDefaultConfig({ asciiComposer: { ...asciiComposer, goodOldCapsLock: checked } })} />
          <div>
            <Label>传统 Caps Lock 行为</Label>
            <p className="text-sm text-gray-500">启用后 Caps Lock 切换大写锁定而非中英切换</p>
          </div>
        </div>
      </div>
      <Separator className="my-6" />
      <div>
        <h4 className="mb-1 text-lg font-semibold">功能快捷键</h4>
        <p className="mb-4 text-sm text-gray-500">配置万象拼音等方案的功能快捷键。启用后将添加到按键绑定列表中。</p>
        {FUNCTION_KEY_CATEGORIES.map((cat) => {
          const defs = FUNCTION_KEY_DEFINITIONS.filter((d) => d.category === cat.id)
          if (defs.length === 0) return null
          return (
            <div key={cat.id} className="mb-4">
              <h5 className="mb-2 text-sm font-medium text-gray-600">{cat.label}</h5>
              <div className="space-y-3">
                {defs.map((def) => (
                  <div key={def.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{def.label}</p>
                      <p className="text-sm text-gray-500">{def.description}</p>
                    </div>
                    <Switch
                      checked={isFunctionKeyEnabled(def.id)}
                      onCheckedChange={(checked) => toggleFunctionKey(def.id, checked)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
