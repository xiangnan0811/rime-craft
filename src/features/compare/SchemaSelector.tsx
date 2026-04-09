import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import type { SchemaCompareData } from '@/data/schema-compare-data'

interface SchemaSelectorProps {
  schemas: SchemaCompareData[];
  selected: string[];
  onToggle: (id: string) => void;
  maxSelections?: number;
}

export function SchemaSelector({ schemas, selected, onToggle, maxSelections = 4 }: SchemaSelectorProps) {
  return (
    <div>
      <p className="mb-3 text-sm text-gray-500">
        选择 2-{maxSelections} 个方案进行对比（已选 {selected.length} 个）
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {schemas.map((schema) => {
          const isSelected = selected.includes(schema.id)
          const isDisabled = !isSelected && selected.length >= maxSelections
          return (
            <div
              key={schema.id}
              role="checkbox"
              aria-checked={isSelected}
              aria-disabled={isDisabled}
              tabIndex={isDisabled ? -1 : 0}
              onClick={() => !isDisabled && onToggle(schema.id)}
              onKeyDown={(e) => {
                if ((e.key === ' ' || e.key === 'Enter') && !isDisabled) {
                  e.preventDefault()
                  onToggle(schema.id)
                }
              }}
              className={cn(
                'flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-left transition-colors',
                isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300',
                isDisabled && 'cursor-not-allowed opacity-50',
              )}
            >
              <Checkbox checked={isSelected} className="mt-0.5" tabIndex={-1} />
              <div>
                <p className="text-sm font-medium">{schema.name}</p>
                <p className="text-xs text-gray-500">{schema.inputMethod}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
