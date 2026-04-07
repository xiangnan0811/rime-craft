import { useConfigStore } from '@/stores/config-store'
import { PRESET_THEMES } from '@/data/preset-themes'
import { cn } from '@/lib/utils'

export function ThemePresetSelector() {
  const currentName = useConfigStore((s) => s.project.platformConfig.style?.name)
  const setThemeStyle = useConfigStore((s) => s.setThemeStyle)

  return (
    <div>
      <h4 className="mb-2 font-medium">预设主题</h4>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {PRESET_THEMES.map((preset) => (
          <button
            key={preset.name}
            onClick={() => setThemeStyle(structuredClone(preset))}
            className={cn(
              'flex-shrink-0 rounded-lg border-2 p-2 transition-colors',
              currentName === preset.name ? 'border-blue-500' : 'border-transparent hover:border-gray-300',
            )}
          >
            {/* Mini color swatch */}
            <div className="mb-1 flex gap-0.5">
              <div className="h-4 w-4 rounded-sm" style={{ backgroundColor: preset.colors.backgroundColor, border: '1px solid #ddd' }} />
              <div className="h-4 w-4 rounded-sm" style={{ backgroundColor: preset.colors.hilitedCandidateBackColor }} />
              <div className="h-4 w-4 rounded-sm" style={{ backgroundColor: preset.colors.candidateTextColor }} />
            </div>
            <p className="whitespace-nowrap text-xs text-gray-600">{preset.name}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
