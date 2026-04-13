// src/types/config.ts

// ─── Top-level project state ─────────────────────────────

export type Platform = 'macos' | 'windows' | 'linux' | 'android' | 'ios';

export interface RimeProject {
  targetPlatform: Platform;
  defaultConfig: DefaultConfig;
  platformConfig: PlatformConfig;
  schemaConfigs: Record<string, SchemaConfig>;
  customPhrases: CustomPhrase[];
  /** YAML keys the editor doesn't recognize, keyed by source file name */
  preserved: Record<string, Record<string, unknown>>;
}

// ─── default.custom.yaml ─────────────────────────────────

export interface DefaultConfig {
  schemaList: SchemaListItem[];
  pageSize: number;
  selectKeys: string;
  asciiComposer: AsciiComposerConfig;
  keyBinder: KeyBinderConfig;
}

export interface SchemaListItem {
  schema: string;
}

export type SwitchKeyAction =
  | 'commit_code'
  | 'commit_text'
  | 'inline_ascii'
  | 'clear'
  | 'noop';

export interface AsciiComposerConfig {
  goodOldCapsLock: boolean;
  switchKey: {
    shiftL: SwitchKeyAction;
    shiftR: SwitchKeyAction;
    controlL: SwitchKeyAction;
    controlR: SwitchKeyAction;
    capsLock: SwitchKeyAction;
  };
}

export interface KeyBinding {
  when: string;
  accept: string;
  send: string;
  toggle?: string;
  description?: string;
  category?: 'switch' | 'navigation' | 'editing' | 'function';
}

export interface KeyBinderConfig {
  bindings: KeyBinding[];
}

// ─── Platform config (squirrel / weasel) ─────────────────

export interface PlatformConfig {
  platform: 'macos' | 'windows' | 'linux';
  style?: ThemeStyle;
  appOptions: Record<string, AppOption>;
}

export interface AppOption {
  asciiMode: boolean;
}

// ─── Schema config (<schema>.custom.yaml) ────────────────

export interface SchemaConfig {
  schemaId: string;
  fuzzyRules: FuzzyRuleState[];
  switches?: SwitchItem[];
  punctuator?: PunctuatorConfig;
  translator?: TranslatorConfig;
  spellingScheme?: SpellingScheme;
  auxiliaryCode?: AuxiliaryCodeConfig;
  reverseLookup?: ReverseLookupConfig;
  specialInput?: SpecialInputConfig;
  luaExtensions?: LuaExtensionsConfig;
  luaScripts?: LuaScript[];
}

export interface FuzzyRuleState {
  ruleId: string;
  enabled: boolean;
}

// ─── Custom phrases (custom_phrase.txt) ──────────────────

export interface CustomPhrase {
  text: string;
  code: string;
  weight: number;
}

// ─── Punctuation config ─────────────────────────────────

export interface PunctuatorConfig {
  halfShape: Record<string, string | string[]>;
}

// ─── Switch items ───────────────────────────────────────

export type SwitchItem = SimpleSwitchItem | MultiStateSwitchItem;

export interface SimpleSwitchItem {
  name: string;
  reset: number;
  states?: [string, string];
}

export interface MultiStateSwitchItem {
  options: string[];
  reset: number;
  states: string[];
}

// ─── Theme style (squirrel / weasel appearance) ─────────

export interface ThemeColors {
  backgroundColor: string;             // back_color
  borderColor: string;                 // border_color
  textColor: string;                   // text_color (composing area)
  hilitedTextColor: string;            // hilited_text_color
  hilitedBackColor: string;            // hilited_back_color
  candidateTextColor: string;          // candidate_text_color
  hilitedCandidateTextColor: string;   // hilited_candidate_text_color
  hilitedCandidateBackColor: string;   // hilited_candidate_back_color
  commentTextColor: string;            // comment_text_color
  labelColor: string;                  // label_color
}

export interface ThemeStyle {
  name: string;
  horizontal: boolean;
  fontFace: string;
  fontSize: number;
  labelFontSize: number;
  cornerRadius: number;
  borderWidth: number;
  lineSpacing: number;
  spacing: number;
  colors: ThemeColors;
}

// ─── Translator config ─────────────────────────────────
export interface TranslatorConfig {
  enableCompletion: boolean;
  enableSentence: boolean;
  enableUserDict: boolean;
  initialQuality: number;
  coreWordLength: number;
  maxWordLength: number;
  maxHomophones: number;
  maxHomographs: number;
  spellingHints: number;
  alwaysShowComments: boolean;
}

// ─── Spelling scheme ───────────────────────────────────
export type SpellingScheme =
  | 'full_pinyin' | 'flypy' | 'zrm' | 'mspy'
  | 'sogou' | 'abc' | 'ziguang';

// ─── Auxiliary code ────────────────────────────────────
export type AuxiliaryCodeScheme =
  | 'moqi' | 'hexing' | 'zrm' | 'tiger'
  | 'wubi' | 'cangjie' | 'simple_he' | 'hanxin';

export interface AuxiliaryCodeConfig {
  scheme: AuxiliaryCodeScheme;
  triggerMode: 'direct' | 'indirect' | 'backtick';
  hintEnabled: boolean;
  hintLength: number;
  splitHintEnabled: boolean;
}

export interface ReverseLookupConfig {
  prefix: string;
  dictionary: string;
  tips: string;
  enableCompletion: boolean;
  prism?: string;
  preeditFormat: string[];
  recognizerPattern?: string;
}

export interface SuperCommentConfig {
  candidateLength: number;
  correctorType: string;
}

export const DEFAULT_SUPER_COMMENT_CONFIG: SuperCommentConfig = {
  candidateLength: 2,
  correctorType: '〔纠错〕',
}

export const SUPER_COMMENT_CANDIDATE_LENGTH_MIN = 1
export const SUPER_COMMENT_CANDIDATE_LENGTH_MAX = 50

// ─── Special input ─────────────────────────────────────
export interface SpecialTrigger {
  id: string;
  enabled: boolean;
  triggerCode: string;
}

/** User-defined special trigger that invokes a custom Lua script. */
export interface CustomTrigger {
  id: string;              // UUID
  name: string;            // User-readable name, e.g. "IP 地址查询"
  triggerCode: string;     // e.g. "/ip"
  description: string;
  scriptId: string;        // FK to LuaScript.id
}

export interface SpecialInputConfig {
  enabledTriggers: SpecialTrigger[];
  customTriggers: CustomTrigger[];
}

/** A user-authored Lua script registered in the schema. */
export interface LuaScript {
  id: string;              // UUID
  fileName: string;        // e.g. "my_translator.lua" (letters, digits, _, -)
  scriptType: 'translator' | 'filter' | 'processor';
  description: string;
  code: string;            // Lua source code
}

// ─── Lua extensions ────────────────────────────────────
export interface LuaExtensionsConfig {
  superComment?: SuperCommentConfig;
  superProcessor?: {
    backspaceLimit: boolean;
    segLoop: boolean;
    toneFallback: boolean;
    limitRepeated: string;
  };
  userPredict?: {
    maxCandidates: number;
    expiryDays: number;
    activationDays: number;
  };
  superReplacer?: {
    chain: boolean;
    delimiter: string;
  };
  inputStatistics?: {
    enabled: boolean;
  };
}


// ─── Editor UI state ────────────────────────────────────

export type EditorModule = string;

export interface EditorUIState {
  viewMode: 'panel' | 'immersive';
  tutorialCollapsed: boolean;
  activeSection?: string;
}
