import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { SwitchKeyAction } from '@/types/config'
import type { WizardState, WizardAction } from '../WizardPage'
import { getAppsForPlatform, getAppIdentifier } from '@/data/app-database'

const PAGE_SIZES = [5, 6, 7, 8, 9]

const SHIFT_L_OPTIONS: { value: SwitchKeyAction; label: string }[] = [
  { value: 'commit_code', label: '上屏编码' },
  { value: 'commit_text', label: '上屏候选' },
  { value: 'inline_ascii', label: '行内切换英文' },
  { value: 'clear', label: '清除编码' },
  { value: 'noop', label: '无操作' },
]

interface BasicConfigStepProps {
  state: WizardState
  dispatch: React.Dispatch<WizardAction>
}

export function BasicConfigStep({ state, dispatch }: BasicConfigStepProps) {
  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold">基础配置</h2>
      <p className="mb-6 text-sm text-gray-500">
        设置常用的输入法参数，这些选项后续都可以在编辑器中修改。
      </p>

      <div className="space-y-6">
        {/* Page size */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">候选词数量</Label>
            <p className="text-xs text-gray-500">每页显示的候选词个数</p>
          </div>
          <Select
            value={String(state.pageSize)}
            onValueChange={(v) =>
              dispatch({ type: 'SET_PAGE_SIZE', pageSize: Number(v) })
            }
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Left Shift behavior */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">左 Shift 行为</Label>
            <p className="text-xs text-gray-500">
              按下左 Shift 时的中英文切换方式
            </p>
          </div>
          <Select
            value={state.shiftLBehavior}
            onValueChange={(v) =>
              dispatch({
                type: 'SET_SHIFT_L',
                behavior: v as SwitchKeyAction,
              })
            }
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SHIFT_L_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ASCII mode apps */}
        <div>
          <Label className="text-sm font-medium">默认英文模式的应用</Label>
          <p className="mb-3 text-xs text-gray-500">
            在以下应用中自动切换为英文输入
          </p>
          <div className="space-y-3">
            {getAppsForPlatform('macos')
              .filter((app) => ['terminal', 'editor', 'ide'].includes(app.category))
              .slice(0, 5)
              .map((app) => {
                const id = getAppIdentifier(app, 'macos')!
                const checked = state.asciiModeApps.includes(id)
                return (
                  <div key={app.id} className="flex items-center justify-between">
                    <Label htmlFor={app.id} className="text-sm">
                      {app.name}
                    </Label>
                    <Switch
                      id={app.id}
                      checked={checked}
                      onCheckedChange={() =>
                        dispatch({ type: 'TOGGLE_APP', app: id })
                      }
                    />
                  </div>
                )
              })}
          </div>
        </div>
      </div>
    </div>
  )
}
