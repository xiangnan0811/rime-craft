import { SCHEMA_REGISTRY } from '@/data/schema-registry'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const TYPE_LABELS: Record<string, string> = {
  full_pinyin: '全拼',
  double_pinyin: '双拼',
  shape: '形码',
  mixed: '混合',
}

interface SchemaStepProps {
  value: string
  onChange: (schemaId: string) => void
}

export function SchemaStep({ value, onChange }: SchemaStepProps) {
  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold">选择输入方案</h2>
      <p className="mb-4 text-sm text-gray-500">
        选择一个输入方案作为默认方案，后续可在编辑器中添加更多方案。
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SCHEMA_REGISTRY.map((schema) => (
          <Card
            key={schema.id}
            onClick={() => onChange(schema.id)}
            className={cn(
              'cursor-pointer p-4 transition-colors',
              value === schema.id
                ? 'border-blue-500 bg-blue-50'
                : 'hover:border-gray-300',
            )}
          >
            <div className="flex items-center gap-2">
              <p className="font-semibold">{schema.name}</p>
              <Badge variant="secondary" className="text-xs">
                {TYPE_LABELS[schema.type] ?? schema.type}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-gray-500">{schema.description}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
