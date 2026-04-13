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

  if (rawReverseLookup) {
    result.reverseLookup = {
      prefix: (rawReverseLookup.prefix as string) ?? '',
      dictionary: (rawReverseLookup.dictionary as string) ?? '',
      tips: (rawReverseLookup.tips as string) ?? '',
      enableCompletion: (rawReverseLookup.enable_completion as boolean) ?? false,
      ...(typeof rawReverseLookup.prism === 'string' ? { prism: rawReverseLookup.prism } : {}),
      preeditFormat: Array.isArray(rawReverseLookup.preedit_format)
        ? rawReverseLookup.preedit_format.filter((value): value is string => typeof value === 'string')
        : [],
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
    result.translator = {
      enableCompletion: (rawTranslator.enable_completion as boolean) ?? false,
      enableSentence: (rawTranslator.enable_sentence as boolean) ?? true,
      enableUserDict: (rawTranslator.enable_user_dict as boolean) ?? true,
      initialQuality: (rawTranslator.initial_quality as number) ?? 1.2,
      coreWordLength: (rawTranslator.core_word_length as number) ?? 4,
      maxWordLength: (rawTranslator.max_word_length as number) ?? 7,
      maxHomophones: (rawTranslator.max_homophones as number) ?? 1,
      maxHomographs: (rawTranslator.max_homographs as number) ?? 1,
      spellingHints: (rawTranslator.spelling_hints as number) ?? 0,
      alwaysShowComments: (rawTranslator.always_show_comments as boolean) ?? false,
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
      result.luaExtensions.superComment = {
        candidateLength: (rawSuperComment.candidate_length as number) ?? 2,
        correctorType: (rawSuperComment.corrector_type as string) ?? '〔纠错〕',
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
