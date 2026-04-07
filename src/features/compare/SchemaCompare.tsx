import { useNavigate } from 'react-router-dom'
import { useConfigStore } from '@/stores/config-store'
import { createEmptyProject } from '@/lib/config/defaults'
import { PRESETS } from '@/data/presets'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { SchemaCompareData } from '@/data/schema-compare-data'

interface SchemaCompareProps {
  schemas: SchemaCompareData[];
}

interface CompareRow {
  label: string;
  getValue: (s: SchemaCompareData) => string | string[];
}

const COMPARE_ROWS: CompareRow[] = [
  { label: '作者', getValue: (s) => s.author },
  { label: '输入方式', getValue: (s) => s.inputMethod },
  { label: '词库规模', getValue: (s) => s.dictSize },
  { label: '智能程度', getValue: (s) => s.smartLevel },
  { label: '辅助码', getValue: (s) => s.auxiliaryCode },
  { label: '扩展功能', getValue: (s) => s.features },
  { label: '平台支持', getValue: (s) => s.platforms },
  { label: '上手难度', getValue: (s) => s.difficulty },
  { label: '推荐人群', getValue: (s) => s.recommendation },
]

export function SchemaCompare({ schemas }: SchemaCompareProps) {
  const navigate = useNavigate()
  const loadProject = useConfigStore((s) => s.loadProject)

  function handleUseSchema(schema: SchemaCompareData) {
    // Try to find a matching preset
    const preset = schema.presetId ? PRESETS.find((p) => p.id === schema.presetId) : undefined
    if (preset) {
      loadProject(preset.createProject())
    } else {
      // Create minimal project with just this schema
      const project = createEmptyProject()
      project.defaultConfig.schemaList = [{ schema: schema.id }]
      loadProject(project)
    }
    navigate('/editor')
  }

  function isDifferent(row: CompareRow): boolean {
    if (schemas.length < 2) return false
    const values = schemas.map((s) => JSON.stringify(row.getValue(s)))
    return new Set(values).size > 1
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 bg-gray-50 px-4 py-3 text-left font-medium" />
            {schemas.map((s) => (
              <th key={s.id} className="min-w-[200px] px-4 py-3 text-center font-semibold">
                {s.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COMPARE_ROWS.map((row) => {
            const diff = isDifferent(row)
            return (
              <tr key={row.label} className={cn(diff && 'bg-yellow-50')}>
                <td className="sticky left-0 bg-inherit px-4 py-2 font-medium text-gray-600">
                  {row.label}
                </td>
                {schemas.map((s) => {
                  const value = row.getValue(s)
                  return (
                    <td key={s.id} className="px-4 py-2 text-center">
                      {Array.isArray(value) ? (
                        <div className="flex flex-wrap justify-center gap-1">
                          {value.map((v) => (
                            <Badge key={v} variant="secondary" className="text-xs">
                              {v}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        value
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
          <tr>
            <td className="sticky left-0 px-4 py-3" />
            {schemas.map((s) => (
              <td key={s.id} className="px-4 py-3 text-center">
                <Button size="sm" onClick={() => handleUseSchema(s)}>
                  使用这个方案
                </Button>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}
