import { stringify } from 'yaml'
import type { DefaultConfig, PlatformConfig, SchemaConfig } from '@/types/config'

export function serializeDefaultConfig(
  config: DefaultConfig,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {}

  patch.schema_list = config.schemaList.map((s) => ({ schema: s.schema }))
  patch['menu/page_size'] = config.pageSize

  if (config.selectKeys !== '1234567890') {
    patch['menu/alternative_select_keys'] = config.selectKeys
  }

  patch.ascii_composer = {
    good_old_caps_lock: config.asciiComposer.goodOldCapsLock,
    switch_key: {
      Shift_L: config.asciiComposer.switchKey.shiftL,
      Shift_R: config.asciiComposer.switchKey.shiftR,
      Control_L: config.asciiComposer.switchKey.controlL,
      Control_R: config.asciiComposer.switchKey.controlR,
      Caps_Lock: config.asciiComposer.switchKey.capsLock,
    },
  }

  if (config.keyBinder.bindings.length > 0) {
    patch.key_binder = {
      bindings: config.keyBinder.bindings.map((b) => ({
        when: b.when,
        accept: b.accept,
        send: b.send,
      })),
    }
  }

  return patch
}

export function serializePlatformConfig(
  config: PlatformConfig,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {}

  if (Object.keys(config.appOptions).length > 0) {
    const appOptions: Record<string, Record<string, unknown>> = {}
    for (const [bundleId, opts] of Object.entries(config.appOptions)) {
      appOptions[bundleId] = { ascii_mode: opts.asciiMode }
    }
    patch.app_options = appOptions
  }

  return patch
}

export function serializeSchemaConfig(config: SchemaConfig): Record<string, unknown> {
  const patch: Record<string, unknown> = {}

  // Switches
  if (config.switches && config.switches.length > 0) {
    patch.switches = config.switches.map((s) => {
      const entry: Record<string, unknown> = { name: s.name, reset: s.reset }
      if (s.states) entry.states = s.states
      return entry
    })
  }

  // Punctuator
  if (config.punctuator) {
    patch.punctuator = { half_shape: config.punctuator.halfShape }
  }

  return patch
}

export function buildCustomYaml(
  patch: Record<string, unknown>,
  preserved?: Record<string, unknown>,
): string {
  const merged = preserved ? { ...preserved, ...patch } : patch
  return stringify({ patch: merged }, { lineWidth: 0 })
}
