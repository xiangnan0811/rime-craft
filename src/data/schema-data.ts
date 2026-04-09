import type { SchemaDetail } from '@/types/schema'
import rawData from './schemas-detail.json'

export const ALL_SCHEMAS: SchemaDetail[] = rawData.schemas as SchemaDetail[]

export function getSchemaById(id: string): SchemaDetail | undefined {
  return ALL_SCHEMAS.find((s) => s.id === id)
}

export function getAllSchemaIds(): string[] {
  return ALL_SCHEMAS.map((s) => s.id)
}
