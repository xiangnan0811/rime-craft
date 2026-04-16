import { PRESET_THEMES } from '@/data/preset-themes'
import { CandidatePreview } from '@/components/shared/CandidatePreview'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface ThemeStepProps {
  value: string
  onChange: (themeName: string) => void
}

export function ThemeStep({ value, onChange }: ThemeStepProps) {
  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold">选择主题</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        选择一个预设主题作为候选窗口的外观，后续可在主题编辑器中自定义。
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {PRESET_THEMES.map((theme) => {
          const isDark =
            theme.colors.backgroundColor.toLowerCase() < '#888888'
          return (
            <Card
              key={theme.name}
              onClick={() => onChange(theme.name)}
              className={cn(
                'cursor-pointer overflow-hidden p-0 transition-colors',
                value === theme.name
                  ? 'ring-2 ring-blue-500'
                  : 'hover:border-muted-foreground/40',
              )}
            >
              <div className="flex items-center justify-center p-3">
                <CandidatePreview
                  theme={theme}
                  darkMode={isDark}
                  candidates={['你好', '你', '尼']}
                  labels={['1', '2', '3']}
                  input="ni"
                  className="scale-75"
                />
              </div>
              <div className="border-t px-4 py-2">
                <p className="text-center text-sm font-medium">{theme.name}</p>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
