import type { SpellingScheme, AuxiliaryCodeScheme } from '@/types/config'
import { ALL_SCHEMAS } from './schema-data'

export interface SchemaInfo {
  id: string;
  name: string;
  description: string;
  type: 'full_pinyin' | 'double_pinyin' | 'shape' | 'mixed';
  capabilities: string[];
  availableSpellingSchemes?: SpellingScheme[];
  availableAuxiliaryCodes?: AuxiliaryCodeScheme[];
  customSwitchNames?: string[];
}

export const SCHEMA_REGISTRY: SchemaInfo[] = ALL_SCHEMAS.map((s) => ({
  id: s.id,
  name: s.name,
  description: s.description,
  type: s.type,
  capabilities: s.integration.capabilities,
  ...(s.integration.availableSpellingSchemes && {
    availableSpellingSchemes: s.integration.availableSpellingSchemes as SpellingScheme[],
  }),
  ...(s.integration.availableAuxiliaryCodes && {
    availableAuxiliaryCodes: s.integration.availableAuxiliaryCodes as AuxiliaryCodeScheme[],
  }),
  ...(s.integration.customSwitchNames && {
    customSwitchNames: s.integration.customSwitchNames,
  }),
}))

/** 查找方案是否具有某能力 */
export function schemaHasCapability(schemaId: string, capability: string): boolean {
  const schema = SCHEMA_REGISTRY.find((s) => s.id === schemaId)
  return schema?.capabilities.includes(capability) ?? false
}

/** 获取方案的所有能力 */
export function getSchemaCapabilities(schemaId: string): string[] {
  return SCHEMA_REGISTRY.find((s) => s.id === schemaId)?.capabilities ?? []
}
