import { Document, Scalar } from 'yaml'
import type { DefaultConfig, PlatformConfig, SchemaConfig, SimpleSwitchItem, MultiStateSwitchItem } from '@/types/config'
import { hexToBgrInt } from '@/lib/color/convert'
import { FUZZY_RULE_DEFINITIONS } from '@/data/fuzzy-rules'

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function serializeFuzzyRuleAlgebra(fuzzyRules: SchemaConfig['fuzzyRules']): string[] {
  const algebraRules: string[] = []
  const seenRules = new Set<string>()

  for (const rule of fuzzyRules) {
    if (!rule.enabled) {
      continue
    }

    const definition = FUZZY_RULE_DEFINITIONS.find((item) => item.id === rule.ruleId)
    if (!definition) {
      continue
    }

    for (const expression of definition.algebraRules) {
      if (seenRules.has(expression)) {
        continue
      }

      seenRules.add(expression)
      algebraRules.push(expression)
    }
  }

  return algebraRules
}

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

  if (config.style) {
    const s = config.style
    patch.style = {
      color_scheme: s.name,
      horizontal: s.horizontal,
      font_face: s.fontFace,
      font_point: s.fontSize,
      label_font_point: s.labelFontSize,
      corner_radius: s.cornerRadius,
      border_width: s.borderWidth,
      line_spacing: s.lineSpacing,
      spacing: s.spacing,
      back_color: hexToBgrInt(s.colors.backgroundColor),
      border_color: hexToBgrInt(s.colors.borderColor),
      text_color: hexToBgrInt(s.colors.textColor),
      hilited_text_color: hexToBgrInt(s.colors.hilitedTextColor),
      hilited_back_color: hexToBgrInt(s.colors.hilitedBackColor),
      candidate_text_color: hexToBgrInt(s.colors.candidateTextColor),
      hilited_candidate_text_color: hexToBgrInt(s.colors.hilitedCandidateTextColor),
      hilited_candidate_back_color: hexToBgrInt(s.colors.hilitedCandidateBackColor),
      comment_text_color: hexToBgrInt(s.colors.commentTextColor),
      label_color: hexToBgrInt(s.colors.labelColor),
    }
  }

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

  if (config.spellingScheme) {
    patch['speller/spelling_scheme'] = config.spellingScheme
  }

  const fuzzyAlgebra = serializeFuzzyRuleAlgebra(config.fuzzyRules)
  if (fuzzyAlgebra.length > 0) {
    patch['speller/algebra/@before 0'] = fuzzyAlgebra
  }

  if (config.auxiliaryCode) {
    const ac = config.auxiliaryCode
    if (ac.scheme !== undefined) patch['auxiliary_code/scheme'] = ac.scheme
    if (ac.triggerMode !== undefined) patch['auxiliary_code/trigger_mode'] = ac.triggerMode
    if (ac.hintEnabled !== undefined) patch['auxiliary_code/show_hint'] = ac.hintEnabled
    if (ac.hintLength !== undefined) patch['auxiliary_code/hint_length'] = ac.hintLength
    if (ac.splitHintEnabled !== undefined) patch['auxiliary_code/split_hint'] = ac.splitHintEnabled
  }

  // Switches
  if (config.switches && config.switches.length > 0) {
    patch.switches = config.switches.map((s) => {
      if ('options' in s) {
        const ms = s as MultiStateSwitchItem
        return { options: ms.options, reset: ms.reset, states: ms.states }
      }
      const ss = s as SimpleSwitchItem
      const entry: Record<string, unknown> = { name: ss.name, reset: ss.reset }
      if (ss.states) entry.states = ss.states
      return entry
    })
  }

  // Punctuator
  if (config.punctuator) {
    patch.punctuator = { half_shape: config.punctuator.halfShape }
  }

  // Translator
  if (config.translator) {
    const t = config.translator
    patch['translator/enable_completion'] = t.enableCompletion
    patch['translator/enable_sentence'] = t.enableSentence
    patch['translator/enable_user_dict'] = t.enableUserDict
    patch['translator/initial_quality'] = t.initialQuality
    patch['translator/core_word_length'] = t.coreWordLength
    patch['translator/max_word_length'] = t.maxWordLength
    patch['translator/max_homophones'] = t.maxHomophones
    patch['translator/max_homographs'] = t.maxHomographs
    patch['translator/spelling_hints'] = t.spellingHints
    patch['translator/always_show_comments'] = t.alwaysShowComments
  }

  // Lua extensions
  if (config.luaExtensions?.superComment) {
    const sc = config.luaExtensions.superComment
    patch['super_comment/candidate_length'] = sc.candidateLength
    patch['super_comment/corrector_type'] = sc.correctorType
  }
  if (config.luaExtensions?.superProcessor) {
    const sp = config.luaExtensions.superProcessor
    patch['super_processor/backspace_limit'] = sp.backspaceLimit
    patch['super_processor/seg_loop'] = sp.segLoop
    patch['super_processor/tone_fallback'] = sp.toneFallback
    patch['super_processor/limit_repeated'] = sp.limitRepeated
  }
  if (config.luaExtensions?.userPredict) {
    const up = config.luaExtensions.userPredict
    patch['user_predict/max_candidates'] = up.maxCandidates
    patch['user_predict/expiry_days'] = up.expiryDays
    patch['user_predict/activation_days'] = up.activationDays
  }
  if (config.luaExtensions?.superReplacer) {
    const sr = config.luaExtensions.superReplacer
    patch['super_replacer/chain'] = sr.chain
    patch['super_replacer/delimiter'] = sr.delimiter
  }
  if (config.luaExtensions?.inputStatistics) {
    patch['input_statistics/enabled'] = config.luaExtensions.inputStatistics.enabled
  }

  // Emit recognizer patterns for custom triggers
  if (config.specialInput?.customTriggers) {
    for (const trigger of config.specialInput.customTriggers) {
      const script = config.luaScripts?.find((s) => s.id === trigger.scriptId)
      const patternId = script
        ? script.fileName.replace(/\.lua$/, '')
        : trigger.id
      patch[`recognizer/patterns/${patternId}`] = `^${escapeRegExp(trigger.triggerCode)}$`
    }
  }

  // Emit lua module registrations for custom scripts
  if (config.luaScripts && config.luaScripts.length > 0) {
    const translators: string[] = []
    const filters: string[] = []
    const processors: string[] = []

    for (const script of config.luaScripts) {
      const identifier = script.fileName.replace(/\.lua$/, '')
      switch (script.scriptType) {
        case 'translator':
          translators.push(`lua_translator@${identifier}`)
          break
        case 'filter':
          filters.push(`lua_filter@${identifier}`)
          break
        case 'processor':
          processors.push(`lua_processor@${identifier}`)
          break
      }
    }

    if (translators.length > 0) patch['engine/translators/+'] = translators
    if (filters.length > 0) patch['engine/filters/+'] = filters
    if (processors.length > 0) patch['engine/processors/+'] = processors
  }

  return patch
}

const STYLE_COLOR_KEYS = new Set([
  'back_color', 'border_color', 'text_color', 'hilited_text_color',
  'hilited_back_color', 'candidate_text_color', 'hilited_candidate_text_color',
  'hilited_candidate_back_color', 'comment_text_color', 'label_color',
])

export function buildCustomYaml(
  patch: Record<string, unknown>,
  preserved?: Record<string, unknown>,
): string {
  const merged = preserved ? { ...preserved, ...patch } : patch
  const doc = new Document({ patch: merged })

  // Set HEX format for color values in style block
  const styleNode = doc.getIn(['patch', 'style'], true)
  if (styleNode && typeof styleNode === 'object' && 'items' in styleNode) {
    for (const item of (styleNode as { items: Array<{ key: { value?: string }; value: unknown }> }).items) {
      const keyValue = item.key?.value ?? String(item.key)
      if (STYLE_COLOR_KEYS.has(keyValue)) {
        const val = item.value
        if (val instanceof Scalar && typeof val.value === 'number') {
          val.format = 'HEX'
        }
      }
    }
  }

  return doc.toString({ lineWidth: 0 })
}
