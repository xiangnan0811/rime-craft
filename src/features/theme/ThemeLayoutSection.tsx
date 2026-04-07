import { useConfigStore } from '@/stores/config-store'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const FONTS = [
  { value: 'PingFang SC', label: 'PingFang SC (macOS)' },
  { value: 'Microsoft YaHei', label: '微软雅黑 (Windows)' },
  { value: 'Noto Sans CJK SC', label: 'Noto Sans CJK SC' },
  { value: 'Source Han Sans SC', label: '思源黑体' },
  { value: 'Hiragino Sans GB', label: '冬青黑体 (macOS)' },
  { value: 'WenQuanYi Micro Hei', label: '文泉驿微米黑 (Linux)' },
  { value: 'sans-serif', label: '系统默认' },
]

interface SliderFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}

function SliderField({ label, value, min, max, step = 1, onChange }: SliderFieldProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className="text-sm">{label}</Label>
        <span className="text-sm text-gray-500">{value}</span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => { if (v !== undefined) onChange(v) }}
      />
    </div>
  )
}

export function ThemeLayoutSection() {
  const style = useConfigStore((s) => s.project.platformConfig.style)
  const updateThemeLayout = useConfigStore((s) => s.updateThemeLayout)

  if (!style) return null

  return (
    <div className="space-y-4">
      <h4 className="font-medium">布局</h4>

      <div className="flex items-center gap-3">
        <Switch checked={style.horizontal} onCheckedChange={(h) => updateThemeLayout({ horizontal: h })} />
        <Label>{style.horizontal ? '横排' : '竖排'}</Label>
      </div>

      <div>
        <Label className="mb-1 block text-sm">字体</Label>
        <Select value={style.fontFace} onValueChange={(f) => updateThemeLayout({ fontFace: f })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {FONTS.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                <span style={{ fontFamily: f.value }}>{f.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <SliderField label="字号" value={style.fontSize} min={12} max={28} onChange={(v) => updateThemeLayout({ fontSize: v })} />
      <SliderField label="标签字号" value={style.labelFontSize} min={10} max={24} onChange={(v) => updateThemeLayout({ labelFontSize: v })} />
      <SliderField label="圆角" value={style.cornerRadius} min={0} max={20} onChange={(v) => updateThemeLayout({ cornerRadius: v })} />
      <SliderField label="边框宽度" value={style.borderWidth} min={0} max={5} onChange={(v) => updateThemeLayout({ borderWidth: v })} />
      <SliderField label="候选间距" value={style.spacing} min={0} max={20} onChange={(v) => updateThemeLayout({ spacing: v })} />
      <SliderField label="行间距" value={style.lineSpacing} min={0} max={15} onChange={(v) => updateThemeLayout({ lineSpacing: v })} />
    </div>
  )
}
