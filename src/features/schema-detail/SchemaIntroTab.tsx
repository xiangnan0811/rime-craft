import type { SchemaDetail } from '@/types/schema'

export function SchemaIntroTab({ schema }: { schema: SchemaDetail }) {
  return <div>{schema.introduction}</div>
}
