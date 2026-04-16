import { Badge } from '@/components/ui/badge'

export function SchemaFeaturesTab({ features }: { features: string[] }) {
  if (features.length === 0) {
    return <p className="py-4 text-sm text-muted-foreground">该方案暂无扩展功能信息。</p>
  }
  return (
    <div className="py-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {features.map((feature) => (
          <div key={feature} className="flex items-center gap-3 rounded-lg border p-3">
            <Badge variant="secondary" className="shrink-0">{feature}</Badge>
          </div>
        ))}
      </div>
    </div>
  )
}
