import type { SchemaDetail } from '@/types/schema'

export function SchemaHeader({ schema }: { schema: SchemaDetail }) {
  return <div>{schema.name}</div>
}
