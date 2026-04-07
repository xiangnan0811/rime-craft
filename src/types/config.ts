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
}

export interface KeyBinderConfig {
  bindings: KeyBinding[];
}

// ─── Platform config (squirrel / weasel) ─────────────────

export interface PlatformConfig {
  platform: 'macos' | 'windows';
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

export interface SwitchItem {
  name: string;
  reset: number;
  states?: [string, string];
}

// ─── Editor UI state ────────────────────────────────────

export type EditorModule =
  | 'schema-manager'
  | 'candidate-settings'
  | 'key-bindings'
  | 'fuzzy-pinyin'
  | 'ascii-mode'
  | 'punctuation'
  | 'dictionary'
  | 'switches';
