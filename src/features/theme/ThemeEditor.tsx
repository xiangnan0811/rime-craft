import { ThemePresetSelector } from './ThemePresetSelector'
import { ThemeColorSection } from './ThemeColorSection'
import { ThemeLayoutSection } from './ThemeLayoutSection'
import { Separator } from '@/components/ui/separator'

export function ThemeEditor() {
  return (
    <div className="space-y-6">
      <ThemePresetSelector />
      <Separator />
      <div className="space-y-4">
        <ThemeColorSection />
      </div>
      <Separator />
      <div className="space-y-4">
        <ThemeLayoutSection />
      </div>
    </div>
  )
}
