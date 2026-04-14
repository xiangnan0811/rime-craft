export const SOURCE_FILE_KINDS = new Set<string>([
  'default',
  'platform',
  'schema',
  'custom_phrase',
])

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const hasRequiredKey = (
  value: Record<string, unknown>,
  key: string,
): boolean => Object.prototype.hasOwnProperty.call(value, key)

export const isValidSourceFile = (value: unknown): boolean => {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.id === 'string' &&
    typeof value.fileName === 'string' &&
    typeof value.kind === 'string' &&
    SOURCE_FILE_KINDS.has(value.kind) &&
    typeof value.content === 'string' &&
    typeof value.updatedAt === 'string' &&
    (value.platform === undefined ||
      value.platform === 'macos' ||
      value.platform === 'windows') &&
    (value.schemaId === undefined || typeof value.schemaId === 'string')
  )
}

export const isValidProject = (value: unknown): boolean => {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.targetPlatform === 'string' &&
    hasRequiredKey(value, 'defaultConfig') &&
    hasRequiredKey(value, 'platformConfig') &&
    value.defaultConfig !== null &&
    value.defaultConfig !== undefined &&
    value.platformConfig !== null &&
    value.platformConfig !== undefined &&
    isRecord(value.schemaConfigs) &&
    Array.isArray(value.customPhrases) &&
    isRecord(value.preserved)
  )
}
