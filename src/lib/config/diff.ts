import type { DefaultConfig } from '@/types/config'
import { DEFAULT_CONFIG } from './defaults'

/**
 * Returns a set of field paths that differ from the defaults.
 * Paths use dot notation: 'pageSize', 'asciiComposer.switchKey.shiftL', etc.
 */
export function getModifiedFields(current: DefaultConfig): Set<string> {
  const modified = new Set<string>()

  if (current.pageSize !== DEFAULT_CONFIG.pageSize) {
    modified.add('pageSize')
  }

  if (current.selectKeys !== DEFAULT_CONFIG.selectKeys) {
    modified.add('selectKeys')
  }

  // Schema list: compare by joining schema ids
  const currentSchemas = current.schemaList.map((s) => s.schema).join(',')
  const defaultSchemas = DEFAULT_CONFIG.schemaList.map((s) => s.schema).join(',')
  if (currentSchemas !== defaultSchemas) {
    modified.add('schemaList')
  }

  // ASCII composer switch keys
  const keys = ['shiftL', 'shiftR', 'controlL', 'controlR', 'capsLock'] as const
  for (const key of keys) {
    if (current.asciiComposer.switchKey[key] !== DEFAULT_CONFIG.asciiComposer.switchKey[key]) {
      modified.add(`asciiComposer.switchKey.${key}`)
    }
  }

  if (current.asciiComposer.goodOldCapsLock !== DEFAULT_CONFIG.asciiComposer.goodOldCapsLock) {
    modified.add('asciiComposer.goodOldCapsLock')
  }

  // Key bindings: compare length (simple heuristic)
  if (current.keyBinder.bindings.length !== DEFAULT_CONFIG.keyBinder.bindings.length) {
    modified.add('keyBinder.bindings')
  }

  return modified
}
