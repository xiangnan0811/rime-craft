import { useConfigStore } from '@/stores/config-store'
import { PRESET_THEMES } from '@/data/preset-themes'
import { cn } from '@/lib/utils'

export function ThemePresetSelector() {
  const currentName = useConfigStore((s) => s.project.platformConfig.style?.name)
  const setThemeStyle = useConfigStore((s) => s.setThemeStyle)

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h4 className="font-medium">预设主题</h4>
        <p className="text-sm text-muted-foreground">先选择接近的预设，再继续微调颜色与布局参数。</p>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {PRESET_THEMES.map((preset) => (
          <button
            key={preset.name}
            onClick={() => setThemeStyle(structuredClone(preset))}
            className={cn(
              'flex-shrink-0 rounded-xl border p-2.5 transition-colors duration-200 transition-[border-color,background-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              currentName === preset.name
                ? 'border-accent bg-accent/60 shadow-sm'
                : 'border-border/70 bg-background hover:border-accent/70 hover:bg-accent/30 hover:shadow-sm',
            )}
          >
            {/* Mini color swatch */}
            <div className="mb-1 flex gap-0.5">
              <div className="h-4 w-4 rounded-sm" style={{ backgroundColor: preset.colors.backgroundColor, border: '1px solid #ddd' }} />
              <div className="h-4 w-4 rounded-sm" style={{ backgroundColor: preset.colors.hilitedCandidateBackColor }} />
              <div className="h-4 w-4 rounded-sm" style={{ backgroundColor: preset.colors.candidateTextColor }} />
            </div>
            <p className="whitespace-nowrap text-xs font-medium text-foreground/90">{preset.name}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
