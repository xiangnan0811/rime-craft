import { parse } from 'yaml'
import type {
  DefaultConfig,
  PlatformConfig,
  SchemaConfig,
  SwitchKeyAction,
  AppOption,
  ThemeStyle,
  ThemeColors,
  SimpleSwitchItem,
  MultiStateSwitchItem,
  CustomTrigger,
  AuxiliaryCodeConfig,
  FuzzyRuleState,
  SpellingScheme,
} from '@/types/config'
import { DEFAULT_SUPER_COMMENT_CONFIG } from '@/types/config'
import { bgrIntToHex } from '@/lib/color/convert'
import { SPECIAL_TRIGGER_DEFINITIONS } from '@/data/special-trigger-definitions'
import { FUZZY_RULE_DEFINITIONS } from '@/data/fuzzy-rules'

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

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

function setNestedValue(
  obj: Record<string, unknown>,
  path: string[],
  value: unknown,
): void {
  let current = obj as Record<string, unknown>
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i]!
    if (DANGEROUS_KEYS.has(key)) return
    if (current[key] === undefined || typeof current[key] !== 'object') {
      current[key] = {}
    }
    current = current[key] as Record<string, unknown>
  }
  const finalKey = path[path.length - 1]!
  if (DANGEROUS_KEYS.has(finalKey)) return
  current[finalKey] = value
}

function hasOwn(object: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(object, key)
}

const DEFAULT_AUXILIARY_CODE_CONFIG: AuxiliaryCodeConfig = {
  scheme: 'zrm',
  triggerMode: 'direct',
  hintEnabled: true,
  hintLength: 1,
  splitHintEnabled: false,
}

const FUZZY_RULE_SIGNATURE_COUNTS = FUZZY_RULE_DEFINITIONS.reduce(
  (counts, definition) => {
    const signature = definition.algebraRules.join('\u0000')
    counts.set(signature, (counts.get(signature) ?? 0) + 1)
    return counts
  },
  new Map<string, number>(),
)

function collectAlgebraExpressions(rawAlgebra: unknown): string[] {
  if (Array.isArray(rawAlgebra)) {
    return rawAlgebra.filter((value): value is string => typeof value === 'string')
  }

  if (!rawAlgebra || typeof rawAlgebra !== 'object') {
    return []
  }

  const expressions: string[] = []
  for (const value of Object.values(rawAlgebra as Record<string, unknown>)) {
    if (!Array.isArray(value)) {
      continue
    }

    expressions.push(...value.filter((item): item is string => typeof item === 'string'))
  }

  return expressions
}

function recoverFuzzyRules(rawAlgebra: unknown): FuzzyRuleState[] {
  const algebraRules = new Set(collectAlgebraExpressions(rawAlgebra))
  if (algebraRules.size === 0) {
    return []
  }

  const recovered: FuzzyRuleState[] = []
  for (const definition of FUZZY_RULE_DEFINITIONS) {
    const signature = definition.algebraRules.join('\u0000')
    if ((FUZZY_RULE_SIGNATURE_COUNTS.get(signature) ?? 0) !== 1) {
      continue
    }

    if (!definition.algebraRules.every((rule) => algebraRules.has(rule))) {
      continue
    }

    recovered.push({ ruleId: definition.id, enabled: true })
  }

  return recovered
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

// ─── Parse theme colors & style ─────────────────────────

function parseThemeColors(style: Record<string, unknown>): ThemeColors {
  const c = (key: string, fallback: number) =>
    bgrIntToHex((style[key] as number) ?? fallback)

  return {
    backgroundColor: c('back_color', 0xFFFFFF),
    borderColor: c('border_color', 0xCCCCCC),
    textColor: c('text_color', 0x000000),
    hilitedTextColor: c('hilited_text_color', 0xFF6600),
    hilitedBackColor: c('hilited_back_color', 0xEEEEEE),
    candidateTextColor: c('candidate_text_color', 0x000000),
    hilitedCandidateTextColor: c('hilited_candidate_text_color', 0xFFFFFF),
    hilitedCandidateBackColor: c('hilited_candidate_back_color', 0xD99A4A),
    commentTextColor: c('comment_text_color', 0x888888),
    labelColor: c('label_color', 0x666666),
  }
}

function parseThemeStyle(style: Record<string, unknown>): ThemeStyle {
  return {
    name: (style.color_scheme as string) ?? 'custom',
    horizontal: (style.horizontal as boolean) ?? false,
    fontFace: (style.font_face as string) ?? 'sans-serif',
    fontSize: (style.font_point as number) ?? 16,
    labelFontSize: (style.label_font_point as number) ?? 14,
    cornerRadius: (style.corner_radius as number) ?? 6,
    borderWidth: (style.border_width as number) ?? 1,
    lineSpacing: (style.line_spacing as number) ?? 5,
    spacing: (style.spacing as number) ?? 8,
    colors: parseThemeColors(style),
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

  const result: PlatformConfig = {
    platform: defaults.platform,
    appOptions:
      Object.keys(appOptions).length > 0 ? appOptions : defaults.appOptions,
  }

  const rawStyle = expanded.style as Record<string, unknown> | undefined
  if (rawStyle) {
    result.style = parseThemeStyle(rawStyle)
  }

  return result
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
  const rawSpeller = expanded.speller as Record<string, unknown> | undefined
  const rawAuxiliaryCode = expanded.auxiliary_code as Record<string, unknown> | undefined
  const rawReverseLookup = expanded.reverse_lookup as Record<string, unknown> | undefined
  const recognizerPatterns = (expanded.recognizer as Record<string, unknown> | undefined)
    ?.patterns as Record<string, unknown> | undefined
  const reverseLookupRecognizerPattern = typeof recognizerPatterns?.reverse_lookup === 'string'
    ? recognizerPatterns.reverse_lookup
    : typeof expanded['recognizer/patterns/reverse_lookup'] === 'string'
      ? expanded['recognizer/patterns/reverse_lookup']
      : undefined

  if (typeof rawSpeller?.spelling_scheme === 'string') {
    result.spellingScheme = rawSpeller.spelling_scheme as SpellingScheme
  }

  const fuzzyRules = recoverFuzzyRules(rawSpeller?.algebra)
  if (fuzzyRules.length > 0) {
    result.fuzzyRules = fuzzyRules
  }

  if (rawAuxiliaryCode) {
    result.auxiliaryCode = {
      scheme:
        (rawAuxiliaryCode.scheme as AuxiliaryCodeConfig['scheme']) ??
        DEFAULT_AUXILIARY_CODE_CONFIG.scheme,
      triggerMode:
        (rawAuxiliaryCode.trigger_mode as AuxiliaryCodeConfig['triggerMode']) ??
        DEFAULT_AUXILIARY_CODE_CONFIG.triggerMode,
      hintEnabled:
        (rawAuxiliaryCode.show_hint as boolean) ??
        DEFAULT_AUXILIARY_CODE_CONFIG.hintEnabled,
      hintLength:
        (rawAuxiliaryCode.hint_length as number) ??
        DEFAULT_AUXILIARY_CODE_CONFIG.hintLength,
      splitHintEnabled:
        (rawAuxiliaryCode.split_hint as boolean) ??
        DEFAULT_AUXILIARY_CODE_CONFIG.splitHintEnabled,
    }
  }

  if (rawReverseLookup || reverseLookupRecognizerPattern) {
    const reverseLookup: Partial<NonNullable<SchemaConfig['reverseLookup']>> = {}

    if (rawReverseLookup) {
      if (hasOwn(rawReverseLookup, 'prefix')) {
        reverseLookup.prefix = (rawReverseLookup.prefix as string) ?? ''
      }
      if (hasOwn(rawReverseLookup, 'dictionary')) {
        reverseLookup.dictionary = (rawReverseLookup.dictionary as string) ?? ''
      }
      if (hasOwn(rawReverseLookup, 'tips')) {
        reverseLookup.tips = (rawReverseLookup.tips as string) ?? ''
      }
      if (hasOwn(rawReverseLookup, 'enable_completion')) {
        reverseLookup.enableCompletion = (rawReverseLookup.enable_completion as boolean) ?? false
      }
      if (hasOwn(rawReverseLookup, 'preedit_format')) {
        reverseLookup.preeditFormat = Array.isArray(rawReverseLookup.preedit_format)
          ? rawReverseLookup.preedit_format.filter((value): value is string => typeof value === 'string')
          : []
      }
      if (typeof rawReverseLookup.prism === 'string') {
        reverseLookup.prism = rawReverseLookup.prism
      }
    }

    if (reverseLookupRecognizerPattern) {
      reverseLookup.recognizerPattern = reverseLookupRecognizerPattern
    }

    if (Object.keys(reverseLookup).length > 0) {
      result.reverseLookup = reverseLookup as NonNullable<SchemaConfig['reverseLookup']>
    }
  }

  // Switches
  const rawSwitches = expanded.switches as Array<Record<string, unknown>> | undefined
  if (rawSwitches) {
    result.switches = rawSwitches.map((s) => {
      if ('options' in s) {
        return {
          options: s.options as string[],
          reset: (s.reset as number) ?? 0,
          states: s.states as string[],
        } satisfies MultiStateSwitchItem
      }
      return {
        name: (s.name as string) ?? '',
        reset: (s.reset as number) ?? 0,
        states: Array.isArray(s.states) ? (s.states as [string, string]) : undefined,
      } as SimpleSwitchItem
    })
  }

  // Punctuator
  const rawPunctuator = expanded.punctuator as Record<string, unknown> | undefined
  if (rawPunctuator) {
    const halfShape = rawPunctuator.half_shape as Record<string, string | string[]> | undefined
    if (halfShape) {
      result.punctuator = { halfShape }
    }
  }

  // Translator
  const rawTranslator = expanded.translator as Record<string, unknown> | undefined
  if (rawTranslator) {
    const translator: Partial<NonNullable<SchemaConfig['translator']>> = {}
    if (hasOwn(rawTranslator, 'enable_completion')) {
      translator.enableCompletion = (rawTranslator.enable_completion as boolean) ?? false
    }
    if (hasOwn(rawTranslator, 'enable_sentence')) {
      translator.enableSentence = (rawTranslator.enable_sentence as boolean) ?? true
    }
    if (hasOwn(rawTranslator, 'enable_user_dict')) {
      translator.enableUserDict = (rawTranslator.enable_user_dict as boolean) ?? true
    }
    if (hasOwn(rawTranslator, 'initial_quality')) {
      translator.initialQuality = (rawTranslator.initial_quality as number) ?? 1.2
    }
    if (hasOwn(rawTranslator, 'core_word_length')) {
      translator.coreWordLength = (rawTranslator.core_word_length as number) ?? 4
    }
    if (hasOwn(rawTranslator, 'max_word_length')) {
      translator.maxWordLength = (rawTranslator.max_word_length as number) ?? 7
    }
    if (hasOwn(rawTranslator, 'max_homophones')) {
      translator.maxHomophones = (rawTranslator.max_homophones as number) ?? 1
    }
    if (hasOwn(rawTranslator, 'max_homographs')) {
      translator.maxHomographs = (rawTranslator.max_homographs as number) ?? 1
    }
    if (hasOwn(rawTranslator, 'spelling_hints')) {
      translator.spellingHints = (rawTranslator.spelling_hints as number) ?? 0
    }
    if (hasOwn(rawTranslator, 'always_show_comments')) {
      translator.alwaysShowComments = (rawTranslator.always_show_comments as boolean) ?? false
    }

    if (Object.keys(translator).length > 0) {
      result.translator = translator as SchemaConfig['translator']
    }
  }

  // Lua extensions
  const rawSuperComment = expanded.super_comment as Record<string, unknown> | undefined
  const rawSuperProcessor = expanded.super_processor as Record<string, unknown> | undefined
  const rawUserPredict = expanded.user_predict as Record<string, unknown> | undefined
  const rawSuperReplacer = expanded.super_replacer as Record<string, unknown> | undefined
  const rawInputStatistics = expanded.input_statistics as Record<string, unknown> | undefined
  if (rawSuperComment || rawSuperProcessor || rawUserPredict || rawSuperReplacer || rawInputStatistics) {
    result.luaExtensions = {}
    if (rawSuperComment) {
      const superComment: Partial<NonNullable<NonNullable<SchemaConfig['luaExtensions']>['superComment']>> = {}
      if (hasOwn(rawSuperComment, 'candidate_length')) {
        superComment.candidateLength =
          (rawSuperComment.candidate_length as number) ??
          DEFAULT_SUPER_COMMENT_CONFIG.candidateLength
      }
      if (hasOwn(rawSuperComment, 'corrector_type')) {
        superComment.correctorType =
          (rawSuperComment.corrector_type as string) ??
          DEFAULT_SUPER_COMMENT_CONFIG.correctorType
      }
      if (Object.keys(superComment).length > 0) {
        result.luaExtensions.superComment =
          superComment as NonNullable<NonNullable<SchemaConfig['luaExtensions']>['superComment']>
      }
    }
    if (rawSuperProcessor) {
      result.luaExtensions.superProcessor = {
        backspaceLimit: (rawSuperProcessor.backspace_limit as boolean) ?? true,
        segLoop: (rawSuperProcessor.seg_loop as boolean) ?? true,
        toneFallback: (rawSuperProcessor.tone_fallback as boolean) ?? true,
        limitRepeated: (rawSuperProcessor.limit_repeated as string) ?? '8,40',
      }
    }
    if (rawUserPredict) {
      result.luaExtensions.userPredict = {
        maxCandidates: (rawUserPredict.max_candidates as number) ?? 10,
        expiryDays: (rawUserPredict.expiry_days as number) ?? 90,
        activationDays: (rawUserPredict.activation_days as number) ?? 7,
      }
    }
    if (rawSuperReplacer) {
      result.luaExtensions.superReplacer = {
        chain: (rawSuperReplacer.chain as boolean) ?? true,
        delimiter: (rawSuperReplacer.delimiter as string) ?? '|',
      }
    }
    if (rawInputStatistics) {
      result.luaExtensions.inputStatistics = {
        enabled: (rawInputStatistics.enabled as boolean) ?? true,
      }
    }
  }

  // Extract custom triggers from recognizer/patterns entries not matching presets
  const presetIds = new Set(SPECIAL_TRIGGER_DEFINITIONS.map((d) => d.id))
  const reservedRecognizerPatternIds = new Set(['reverse_lookup'])
  const customTriggers: CustomTrigger[] = []

  // Flat patch-style keys: "recognizer/patterns/my_trigger": "^/xyz$"
  for (const [key, value] of Object.entries(expanded)) {
    const match = key.match(/^recognizer\/patterns\/(.+)$/)
    if (!match) continue
    const patternId = match[1]!
    if (presetIds.has(patternId) || reservedRecognizerPatternIds.has(patternId)) continue
    if (typeof value !== 'string') continue
    const triggerCode = value.replace(/^\^/, '').replace(/\$$/, '')
    customTriggers.push({
      id: crypto.randomUUID(),
      name: patternId,
      triggerCode,
      description: '',
      scriptId: '',
    })
  }

  // Nested style: recognizer: { patterns: { my_trigger: "^/xyz$", ... } }
  const nestedRecognizer = expanded.recognizer as Record<string, unknown> | undefined
  const nestedPatterns = nestedRecognizer?.patterns as Record<string, unknown> | undefined
  if (nestedPatterns) {
    for (const [patternId, value] of Object.entries(nestedPatterns)) {
      if (presetIds.has(patternId) || reservedRecognizerPatternIds.has(patternId)) continue
      if (typeof value !== 'string') continue
      if (customTriggers.some((t) => t.name === patternId)) continue
      const triggerCode = value.replace(/^\^/, '').replace(/\$$/, '')
      customTriggers.push({
        id: crypto.randomUUID(),
        name: patternId,
        triggerCode,
        description: '',
        scriptId: '',
      })
    }
  }

  if (customTriggers.length > 0) {
    result.specialInput = {
      enabledTriggers: result.specialInput?.enabledTriggers ?? [],
      customTriggers,
    }
  }

  // luaScripts is always an empty array when not populated from YAML
  result.luaScripts = result.luaScripts ?? []

  return result
}

export const KNOWN_SCHEMA_KEYS = ['speller', 'auxiliary_code', 'reverse_lookup', 'switches', 'punctuator', 'translator', 'recognizer', 'engine', 'super_comment', 'super_processor', 'user_predict', 'super_replacer', 'input_statistics']
