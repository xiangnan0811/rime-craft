import { useConfigStore } from '@/stores/config-store'
import { ThemeColorPicker } from './ThemeColorPicker'
import type { ThemeColors } from '@/types/config'

const COLOR_FIELDS: { key: keyof ThemeColors; label: string }[] = [
  { key: 'backgroundColor', label: '背景色' },
  { key: 'borderColor', label: '边框色' },
  { key: 'textColor', label: '输入文字色' },
  { key: 'hilitedTextColor', label: '高亮拼音色' },
  { key: 'hilitedBackColor', label: '拼音区背景' },
  { key: 'candidateTextColor', label: '候选文字色' },
  { key: 'hilitedCandidateTextColor', label: '选中候选文字' },
  { key: 'hilitedCandidateBackColor', label: '选中候选背景' },
  { key: 'commentTextColor', label: '注释色' },
  { key: 'labelColor', label: '标签色' },
]

export function ThemeColorSection() {
  const colors = useConfigStore((s) => s.project.platformConfig.style?.colors)
  const updateThemeColors = useConfigStore((s) => s.updateThemeColors)

  if (!colors) return null

  return (
    <div>
      <h4 className="mb-3 font-medium">颜色</h4>
      <div className="grid grid-cols-2 gap-3">
        {COLOR_FIELDS.map(({ key, label }) => (
          <ThemeColorPicker
            key={key}
            label={label}
            color={colors[key]}
            onChange={(value) => updateThemeColors({ [key]: value })}
          />
        ))}
      </div>
    </div>
  )
}
