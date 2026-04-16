import { ExternalLink } from 'lucide-react'
import type { LearningResource } from '@/types/schema'

export function SchemaResourcesTab({ resources }: { resources: LearningResource[] }) {
  if (resources.length === 0) {
    return <p className="py-4 text-sm text-muted-foreground">暂无学习资源。</p>
  }
  return (
    <div className="grid gap-3 py-4 sm:grid-cols-2">
      {resources.map((resource) => (
        <a key={resource.url} href={resource.url} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50">
          <span className="text-sm font-medium">{resource.title}</span>
          <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
        </a>
      ))}
    </div>
  )
}
