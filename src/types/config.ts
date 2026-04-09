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
  horizontal?: boolean;
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
  displayConfig?: DisplayConfig;
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

// ─── Reverse lookup ────────────────────────────────────
export type ReverseLookupMethod =
  | 'two_part' | 'multi_part' | 'stroke'
  | 'tone' | 'auxiliary';

export interface ReverseLookupConfig {
  triggerKey: string;
  dataSource: ('aux' | 'db')[];
  enabledMethods: ReverseLookupMethod[];
}

// ─── Special input ─────────────────────────────────────
export interface SpecialTrigger {
  id: string;
  enabled: boolean;
  triggerCode: string;
}

export interface SpecialInputConfig {
  enabledTriggers: SpecialTrigger[];
}

// ─── Lua extensions ────────────────────────────────────
export interface LuaExtensionsConfig {
  superComment?: {
    candidateLength: number;
    correctorType: string;
  };
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

// ─── Display config ────────────────────────────────────
export interface DisplayConfig {
  horizontal: boolean;
  commentMode: 'off' | 'toned' | 'toneless';
  encodingDisplay: 'raw' | 'toned' | 'toneless';
}

// ─── Editor UI state ────────────────────────────────────

export type EditorModule = string;

export interface EditorUIState {
  viewMode: 'panel' | 'immersive';
  tutorialCollapsed: boolean;
  activeSection?: string;
}
