import { Link } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { ALL_SCHEMAS } from '@/data/schema-data'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const TYPE_LABELS: Record<string, string> = {
  full_pinyin: '全拼',
  double_pinyin: '双拼',
  shape: '形码',
  mixed: '混合',
}

const DIFFICULTY_COLORS: Record<string, string> = {
  '简单': 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
  '中等': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200',
  '困难': 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
}

interface SchemaStepProps {
  value: string
  onChange: (schemaId: string) => void
}

export function SchemaStep({ value, onChange }: SchemaStepProps) {
  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold">选择输入方案</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        选择一个输入方案作为默认方案，后续可在编辑器中添加更多方案。
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ALL_SCHEMAS.map((schema) => {
          const topFeatures = schema.compare.features.slice(0, 3).join(' · ')
          return (
            <Card
              key={schema.id}
              onClick={() => onChange(schema.id)}
              className={cn(
                'relative cursor-pointer p-4 transition-colors',
                value === schema.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                  : 'hover:border-muted-foreground/40',
              )}
            >
              <Link
                to={`/schema/${schema.id}`}
                target="_blank"
                onClick={(e) => e.stopPropagation()}
                className="absolute right-3 top-3 text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400"
                title="了解更多"
              >
                <ExternalLink className="h-4 w-4" />
              </Link>
              <div className="flex items-center gap-2">
                <p className="font-semibold">{schema.name}</p>
                <Badge variant="secondary" className="text-xs">
                  {TYPE_LABELS[schema.type] ?? schema.type}
                </Badge>
                <Badge className={cn('text-xs', DIFFICULTY_COLORS[schema.compare.difficulty])}>
                  {schema.compare.difficulty}
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">by {schema.author}</p>
              <p className="mt-1 text-sm text-muted-foreground">{schema.description}</p>
              {topFeatures && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {schema.compare.dictSize} 词库 · {topFeatures}
                </p>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
