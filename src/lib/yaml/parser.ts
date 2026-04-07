import { parse } from 'yaml'
import type {
  DefaultConfig,
  PlatformConfig,
  SchemaConfig,
  SwitchKeyAction,
  AppOption,
} from '@/types/config'

// ─── Parse raw YAML ──────────────────────────────────────

export function parseCustomYaml(
  yamlString: string,
): { patch: Record<string, unknown>; error?: string } {
  try {
    const doc = parse(yamlString)
    if (!doc || typeof doc !== 'object' || !('patch' in doc)) {
      return { patch: {} }
    }
    return { patch: doc.patch as Record<string, unknown> }
  } catch (e) {
    return { patch: {}, error: String(e) }
  }
}

// ─── Expand "/"-delimited patch paths ────────────────────

export function expandPatchPaths(
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(patch)) {
    if (key.includes('/')) {
      setNestedValue(result, key.split('/'), value)
    } else if (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      typeof result[key] === 'object' &&
      result[key] !== null &&
      !Array.isArray(result[key])
    ) {
      result[key] = {
        ...(result[key] as Record<string, unknown>),
        ...(value as Record<string, unknown>),
      }
    } else {
      result[key] = value
    }
  }

  return result
}

function setNestedValue(
  obj: Record<string, unknown>,
  path: string[],
  value: unknown,
): void {
  let current = obj as Record<string, unknown>
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i]!
    if (current[key] === undefined || typeof current[key] !== 'object') {
      current[key] = {}
    }
    current = current[key] as Record<string, unknown>
  }
  current[path[path.length - 1]!] = value
}

// ─── Map to DefaultConfig ────────────────────────────────

export function mapToDefaultConfig(
  expanded: Record<string, unknown>,
  defaults: DefaultConfig,
): DefaultConfig {
  const menu = expanded.menu as Record<string, unknown> | undefined
  const ac = expanded.ascii_composer as Record<string, unknown> | undefined
  const acSwitch = ac?.switch_key as Record<string, string> | undefined
  const kb = expanded.key_binder as Record<string, unknown> | undefined
  const bindings = kb?.bindings as Array<Record<string, string>> | undefined

  return {
    schemaList: Array.isArray(expanded.schema_list)
      ? (expanded.schema_list as Array<{ schema: string }>).map((s) => ({
          schema: s.schema,
        }))
      : defaults.schemaList,

    pageSize: (menu?.page_size as number) ?? defaults.pageSize,

    selectKeys:
      (menu?.alternative_select_keys as string) ?? defaults.selectKeys,

    asciiComposer: ac
      ? {
          goodOldCapsLock:
            (ac.good_old_caps_lock as boolean) ??
            defaults.asciiComposer.goodOldCapsLock,
          switchKey: {
            shiftL:
              (acSwitch?.Shift_L as SwitchKeyAction) ??
              defaults.asciiComposer.switchKey.shiftL,
            shiftR:
              (acSwitch?.Shift_R as SwitchKeyAction) ??
              defaults.asciiComposer.switchKey.shiftR,
            controlL:
              (acSwitch?.Control_L as SwitchKeyAction) ??
              defaults.asciiComposer.switchKey.controlL,
            controlR:
              (acSwitch?.Control_R as SwitchKeyAction) ??
              defaults.asciiComposer.switchKey.controlR,
            capsLock:
              (acSwitch?.Caps_Lock as SwitchKeyAction) ??
              defaults.asciiComposer.switchKey.capsLock,
          },
        }
      : defaults.asciiComposer,

    keyBinder: bindings
      ? {
          bindings: bindings.map((b) => ({
            when: b.when ?? 'always',
            accept: b.accept ?? '',
            send: b.send ?? '',
          })),
        }
      : defaults.keyBinder,
  }
}

// ─── Map to PlatformConfig ───────────────────────────────

export function mapToPlatformConfig(
  expanded: Record<string, unknown>,
  defaults: PlatformConfig,
): PlatformConfig {
  const rawAppOptions = expanded.app_options as
    | Record<string, Record<string, unknown>>
    | undefined

  const appOptions: Record<string, AppOption> = {}
  if (rawAppOptions) {
    for (const [bundleId, opts] of Object.entries(rawAppOptions)) {
      appOptions[bundleId] = {
        asciiMode: (opts.ascii_mode as boolean) ?? false,
      }
    }
  }

  return {
    platform: defaults.platform,
    appOptions:
      Object.keys(appOptions).length > 0 ? appOptions : defaults.appOptions,
  }
}

// ─── Extract preserved fields ────────────────────────────

export function extractPreservedFields(
  patch: Record<string, unknown>,
  knownBaseKeys: string[],
): Record<string, unknown> {
  const preserved: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(patch)) {
    const baseKey = key.split('/')[0]!
    if (!knownBaseKeys.includes(baseKey)) {
      preserved[key] = value
    }
  }
  return preserved
}

export const KNOWN_DEFAULT_KEYS = [
  'schema_list',
  'menu',
  'ascii_composer',
  'key_binder',
  'switcher',
]

export const KNOWN_PLATFORM_KEYS = ['style', 'app_options']

// ─── Map to SchemaConfig ────────────────────────────────

export function mapToSchemaConfig(
  expanded: Record<string, unknown>,
  schemaId: string,
): Partial<SchemaConfig> {
  const result: Partial<SchemaConfig> = { schemaId }

  // Switches
  const rawSwitches = expanded.switches as Array<Record<string, unknown>> | undefined
  if (rawSwitches) {
    result.switches = rawSwitches.map((s) => ({
      name: (s.name as string) ?? '',
      reset: (s.reset as number) ?? 0,
      states: Array.isArray(s.states) ? (s.states as [string, string]) : undefined,
    }))
  }

  // Punctuator
  const rawPunctuator = expanded.punctuator as Record<string, unknown> | undefined
  if (rawPunctuator) {
    const halfShape = rawPunctuator.half_shape as Record<string, string | string[]> | undefined
    if (halfShape) {
      result.punctuator = { halfShape }
    }
  }

  return result
}

export const KNOWN_SCHEMA_KEYS = ['speller', 'switches', 'punctuator', 'translator', 'engine']
