import type { LearningResource } from '@/types/schema'

export function SchemaResourcesTab({ resources }: { resources: LearningResource[] }) {
  return <ul>{resources.map((r) => <li key={r.url}><a href={r.url} target="_blank" rel="noreferrer">{r.title}</a></li>)}</ul>
}
