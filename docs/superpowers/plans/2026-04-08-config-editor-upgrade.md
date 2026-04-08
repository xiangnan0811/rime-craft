# 配置编辑器升级 — 对齐万象拼音 Pro 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将配置编辑器从 8 个简单模块升级为 15 个完整模块，全面覆盖万象拼音 Pro 的配置面，并实现教程侧边栏联动 + 沉浸模式。

**Architecture:** 方案驱动注册表（Schema-Driven Registry）模式。创建模块注册表替换硬编码的 `EditorModule` 联合类型，每个方案声明自己的能力，侧边栏根据能力动态渲染模块。教程面板作为编辑器右侧可折叠面板，共用现有 MDX 内容，通过 `ConfigSlot` 组件在沉浸模式中嵌入配置组件。

**Tech Stack:** React 18 + TypeScript + Zustand + Radix UI + MDX + Vite

**Design Spec:** `docs/superpowers/specs/2026-04-08-config-editor-upgrade-design.md`

---

## File Map

### 新建文件

| 文件 | 职责 |
|------|------|
| `src/data/module-registry.ts` | 模块注册表：15 个模块的元数据、分组、适用性、懒加载组件引用 |
| `src/data/key-binding-definitions.ts` | 功能快捷键定义数据（类似 fuzzy-rules.ts） |
| `src/data/special-trigger-definitions.ts` | 特殊输入触发器定义数据 |
| `src/features/editor/modules/SpellingScheme.tsx` | 拼写方案模块 |
| `src/features/editor/modules/AuxiliaryCode.tsx` | 辅助码配置模块 |
| `src/features/editor/modules/ReverseLookup.tsx` | 反查与筛选模块 |
| `src/features/editor/modules/SpecialInput.tsx` | 特殊输入模块 |
| `src/features/editor/modules/LuaExtensions.tsx` | Lua 扩展模块 |
| `src/features/editor/modules/CandidateDisplay.tsx` | 候选词显示模块 |
| `src/features/editor/modules/CommentHints.tsx` | 注释与提示模块 |
| `src/features/editor/TutorialPanel.tsx` | 教程侧边面板组件 |
| `src/features/editor/ImmersiveView.tsx` | 沉浸式教程模式组件 |
| `src/features/editor/EditorContext.tsx` | 编辑器上下文 Provider（viewMode 等） |
| `src/components/shared/ConfigSlot.tsx` | MDX 中的配置插槽组件 |
| `src/content/spelling-scheme.mdx` | 拼写方案教程 |
| `src/content/auxiliary-code-config.mdx` | 辅助码配置教程（基于现有 auxiliary-code.mdx 扩展） |
| `src/content/reverse-lookup.mdx` | 反查与筛选教程 |
| `src/content/special-input.mdx` | 特殊输入教程 |
| `src/content/lua-extensions.mdx` | Lua 扩展教程 |
| `src/content/candidate-display.mdx` | 候选词显示教程 |
| `src/content/comment-hints.mdx` | 注释与提示教程 |

### 修改文件

| 文件 | 改动概要 |
|------|---------|
| `src/types/config.ts` | 新增 7 个 interface + 扩展 SchemaConfig/SwitchItem/KeyBinding/DefaultConfig |
| `src/data/schema-registry.ts` | SchemaInfo 增加 capabilities 等字段，更新 8 个方案的数据 |
| `src/data/switch-definitions.ts` | 新增 9+ 个开关定义，支持多态开关 |
| `src/data/presets.ts` | 更新万象预设，填充新字段 |
| `src/stores/config-store.ts` | 新增 schema 级 updater（translator/auxiliaryCode 等）+ EditorUIState |
| `src/features/editor/EditorSidebar.tsx` | 从静态列表重构为注册表驱动的分组侧边栏 |
| `src/features/editor/EditorContent.tsx` | 从硬编码组件映射改为注册表动态加载 |
| `src/features/editor/ModuleWrapper.tsx` | 无大改动，`module` prop 类型从 `EditorModule` 改为 `string` |
| `src/features/editor/modules/CandidateSettings.tsx` | 新增 7 个配置项 |
| `src/features/editor/modules/KeyBindings.tsx` | 新增功能快捷键子区域 |
| `src/features/editor/modules/Switches.tsx` | 支持多态开关 + 分组显示 |
| `src/app/editor/EditorPage.tsx` | 增加教程面板 + 模式切换布局 |
| `src/components/shared/LearnMoreLink.tsx` | 从 `EditorModule` 类型改为 `string` |
| `src/lib/yaml/serializer.ts` | 新增 TranslatorConfig/AuxiliaryCode 等序列化 |
| `src/lib/yaml/parser.ts` | 新增对应的解析逻辑 |
| `src/lib/yaml/module-yaml.ts` | 新增 7 个模块的 YAML 提取/应用映射 |
| `src/lib/config/diff.ts` | 新增 SchemaConfig 级别的 diff 支持 |
| `src/lib/config/defaults.ts` | 新增各配置类型的默认值 |
| `src/content/*.mdx`（现有 8 个） | `GoToConfigButton` → `ConfigSlot` |

---

## Phase 1: 基础架构（类型 + 注册表 + Store）

### Task 1: 扩展类型系统

**Files:**
- Modify: `src/types/config.ts`
- Test: `src/stores/config-store.test.ts`（确保现有测试不 break）

- [ ] **Step 1: 新增配置 interface 到 config.ts**

在 `src/types/config.ts` 文件末尾的 `EditorModule` 类型之前，添加以下类型定义：

```typescript
// ─── Translator config ─────────────────────────────────
export interface TranslatorConfig {
  enableCompletion: boolean;
  enableUserDict: boolean;
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
```

- [ ] **Step 2: 扩展 SchemaConfig**

修改现有的 `SchemaConfig` interface，添加新的 optional 字段：

```typescript
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
```

- [ ] **Step 3: 扩展 SwitchItem 为联合类型**

替换现有的 `SwitchItem`：

```typescript
export type SwitchItem = SimpleSwitchItem | MultiStateSwitchItem;

export interface SimpleSwitchItem {
  name: string;
  reset: number;
  states: [string, string];
}

export interface MultiStateSwitchItem {
  options: string[];
  reset: number;
  states: string[];
}
```

- [ ] **Step 4: 扩展 KeyBinding**

```typescript
export interface KeyBinding {
  when: string;
  accept: string;
  send: string;
  toggle?: string;
  description?: string;
  category?: 'switch' | 'navigation' | 'editing' | 'function';
}
```

- [ ] **Step 5: 扩展 DefaultConfig**

在 `DefaultConfig` 中添加 `horizontal` 字段：

```typescript
export interface DefaultConfig {
  schemaList: SchemaListItem[];
  pageSize: number;
  selectKeys: string;
  asciiComposer: AsciiComposerConfig;
  keyBinder: KeyBinderConfig;
  horizontal?: boolean;
}
```

- [ ] **Step 6: 将 EditorModule 改为 string**

当前 `EditorModule` 是一个严格的联合类型。注册表模式下模块 ID 来自数据，类型应放宽：

```typescript
export type EditorModule = string;
```

- [ ] **Step 7: 新增 EditorUIState 类型**

```typescript
export interface EditorUIState {
  viewMode: 'panel' | 'immersive';
  tutorialCollapsed: boolean;
  activeSection?: string;
}
```

- [ ] **Step 8: 运行现有测试确认不 break**

Run: `npx vitest run src/stores/config-store.test.ts src/lib/yaml/serializer.test.ts src/lib/yaml/parser.test.ts`

Expected: 所有现有测试通过（SwitchItem 类型变化可能需要在测试中调整类型断言）。如果有 `SwitchItem` 相关的测试失败，更新测试中的类型使用以匹配新的 `SimpleSwitchItem`。

- [ ] **Step 9: Commit**

```bash
git add src/types/config.ts
git commit -m "feat(types): expand config type system for Wanxiang Pro alignment

Add TranslatorConfig, AuxiliaryCodeConfig, ReverseLookupConfig,
SpecialInputConfig, LuaExtensionsConfig, DisplayConfig types.
Extend SchemaConfig, SwitchItem (union type), KeyBinding, DefaultConfig.
Relax EditorModule to string for registry-driven modules."
```

---

### Task 2: 扩展 SchemaInfo 和 schema-registry

**Files:**
- Modify: `src/data/schema-registry.ts`

- [ ] **Step 1: 扩展 SchemaInfo interface**

```typescript
export interface SchemaInfo {
  id: string;
  name: string;
  description: string;
  type: 'full_pinyin' | 'double_pinyin' | 'shape' | 'mixed';
  capabilities: string[];
  availableSpellingSchemes?: SpellingScheme[];
  availableAuxiliaryCodes?: AuxiliaryCodeScheme[];
  customSwitchNames?: string[];
}
```

添加 import：
```typescript
import type { SpellingScheme, AuxiliaryCodeScheme } from '@/types/config'
```

- [ ] **Step 2: 更新所有方案数据**

```typescript
export const SCHEMA_REGISTRY: SchemaInfo[] = [
  {
    id: 'rime_ice',
    name: '雾凇拼音',
    description: '功能齐全的全拼方案，词库丰富，社区活跃',
    type: 'full_pinyin',
    capabilities: ['special-input'],
  },
  {
    id: 'double_pinyin_flypy',
    name: '小鹤双拼',
    description: '最流行的双拼方案之一，键位分布合理',
    type: 'double_pinyin',
    capabilities: [],
  },
  {
    id: 'wanxiang',
    name: '万象拼音',
    description: '新一代拼音方案，支持直接辅助码',
    type: 'full_pinyin',
    capabilities: [
      'multi-spelling', 'auxiliary-code', 'reverse-lookup',
      'special-input', 'lua-extensions', 'super-comment',
    ],
    availableSpellingSchemes: ['full_pinyin', 'flypy', 'zrm', 'mspy', 'sogou', 'abc', 'ziguang'],
    availableAuxiliaryCodes: ['moqi', 'hexing', 'zrm', 'tiger', 'wubi', 'cangjie', 'simple_he', 'hanxin'],
    customSwitchNames: [
      'chinese_english', 'prediction', 'abbrev',
      'charset_filter', 'char_priority', 'super_tips',
    ],
  },
  {
    id: 'luna_pinyin',
    name: '朙月拼音',
    description: 'Rime 内置全拼方案，轻量稳定',
    type: 'full_pinyin',
    capabilities: [],
  },
  {
    id: 'double_pinyin',
    name: '自然码双拼',
    description: '经典双拼方案',
    type: 'double_pinyin',
    capabilities: [],
  },
  {
    id: 'double_pinyin_mspy',
    name: '微软双拼',
    description: '微软拼音使用的双拼方案',
    type: 'double_pinyin',
    capabilities: [],
  },
  {
    id: 'wubi86',
    name: '五笔86',
    description: '经典五笔字型方案',
    type: 'shape',
    capabilities: [],
  },
  {
    id: 'cangjie5',
    name: '仓颉五代',
    description: '经典形码方案',
    type: 'shape',
    capabilities: [],
  },
]
```

- [ ] **Step 3: 添加辅助函数**

```typescript
/** 查找方案是否具有某能力 */
export function schemaHasCapability(schemaId: string, capability: string): boolean {
  const schema = SCHEMA_REGISTRY.find((s) => s.id === schemaId)
  return schema?.capabilities.includes(capability) ?? false
}

/** 获取方案的所有能力 */
export function getSchemaCapabilities(schemaId: string): string[] {
  return SCHEMA_REGISTRY.find((s) => s.id === schemaId)?.capabilities ?? []
}
```

- [ ] **Step 4: Commit**

```bash
git add src/data/schema-registry.ts
git commit -m "feat(data): extend schema registry with capabilities

Add capabilities, availableSpellingSchemes, availableAuxiliaryCodes,
customSwitchNames fields. Populate Wanxiang with full capability set."
```

---

### Task 3: 创建模块注册表

**Files:**
- Create: `src/data/module-registry.ts`

- [ ] **Step 1: 创建模块注册表文件**

```typescript
import { lazy } from 'react'
import type { RimeProject } from '@/types/config'

// ─── Types ─────────────────────────────────────────────

export type ModuleGroup = 'basic' | 'input' | 'auxiliary' | 'appearance'

export type SchemaApplicability =
  | { type: 'universal' }
  | { type: 'schemas'; ids: string[] }
  | { type: 'capability'; cap: string }

export interface ModuleDefinition {
  id: string
  label: string
  group: ModuleGroup
  tutorialSlug?: string
  applicability: SchemaApplicability
  getModifiedCount?: (project: RimeProject) => number
}

export interface ModuleGroupInfo {
  id: ModuleGroup
  label: string
  order: number
}

// ─── Group definitions ─────────────────────────────────

export const MODULE_GROUPS: ModuleGroupInfo[] = [
  { id: 'basic', label: '基本设置', order: 0 },
  { id: 'input', label: '输入行为', order: 1 },
  { id: 'auxiliary', label: '辅助功能', order: 2 },
  { id: 'appearance', label: '外观与显示', order: 3 },
]

// ─── Module definitions ────────────────────────────────

export const MODULE_REGISTRY: ModuleDefinition[] = [
  // --- basic ---
  {
    id: 'schema-manager',
    label: '输入方案管理',
    group: 'basic',
    tutorialSlug: 'schema-manager',
    applicability: { type: 'universal' },
  },
  {
    id: 'candidate-settings',
    label: '候选词设置',
    group: 'basic',
    tutorialSlug: 'candidate-settings',
    applicability: { type: 'universal' },
  },
  {
    id: 'key-bindings',
    label: '按键绑定',
    group: 'basic',
    tutorialSlug: 'key-bindings',
    applicability: { type: 'universal' },
  },
  {
    id: 'switches',
    label: '开关与杂项',
    group: 'basic',
    tutorialSlug: 'switches',
    applicability: { type: 'universal' },
  },
  // --- input ---
  {
    id: 'fuzzy-pinyin',
    label: '模糊音规则',
    group: 'input',
    tutorialSlug: 'fuzzy-pinyin',
    applicability: { type: 'universal' },
  },
  {
    id: 'spelling-scheme',
    label: '拼写方案',
    group: 'input',
    tutorialSlug: 'spelling-scheme',
    applicability: { type: 'capability', cap: 'multi-spelling' },
  },
  {
    id: 'auxiliary-code',
    label: '辅助码配置',
    group: 'input',
    tutorialSlug: 'auxiliary-code-config',
    applicability: { type: 'capability', cap: 'auxiliary-code' },
  },
  {
    id: 'reverse-lookup',
    label: '反查与筛选',
    group: 'input',
    tutorialSlug: 'reverse-lookup',
    applicability: { type: 'capability', cap: 'reverse-lookup' },
  },
  // --- auxiliary ---
  {
    id: 'punctuation',
    label: '标点符号映射',
    group: 'auxiliary',
    tutorialSlug: 'punctuation',
    applicability: { type: 'universal' },
  },
  {
    id: 'dictionary',
    label: '词典管理',
    group: 'auxiliary',
    tutorialSlug: 'dictionary',
    applicability: { type: 'universal' },
  },
  {
    id: 'special-input',
    label: '特殊输入',
    group: 'auxiliary',
    tutorialSlug: 'special-input',
    applicability: { type: 'capability', cap: 'special-input' },
  },
  {
    id: 'lua-extensions',
    label: 'Lua 扩展',
    group: 'auxiliary',
    tutorialSlug: 'lua-extensions',
    applicability: { type: 'capability', cap: 'lua-extensions' },
  },
  // --- appearance ---
  {
    id: 'ascii-mode',
    label: '中英文切换',
    group: 'appearance',
    tutorialSlug: 'ascii-mode',
    applicability: { type: 'universal' },
  },
  {
    id: 'candidate-display',
    label: '候选词显示',
    group: 'appearance',
    tutorialSlug: 'candidate-display',
    applicability: { type: 'universal' },
  },
  {
    id: 'comment-hints',
    label: '注释与提示',
    group: 'appearance',
    tutorialSlug: 'comment-hints',
    applicability: { type: 'capability', cap: 'super-comment' },
  },
]

// ─── Component lazy-load map ───────────────────────────

export const MODULE_COMPONENTS: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  'schema-manager': lazy(() => import('@/features/editor/modules/SchemaManager').then(m => ({ default: m.SchemaManager }))),
  'candidate-settings': lazy(() => import('@/features/editor/modules/CandidateSettings').then(m => ({ default: m.CandidateSettings }))),
  'key-bindings': lazy(() => import('@/features/editor/modules/KeyBindings').then(m => ({ default: m.KeyBindings }))),
  'switches': lazy(() => import('@/features/editor/modules/Switches').then(m => ({ default: m.Switches }))),
  'fuzzy-pinyin': lazy(() => import('@/features/editor/modules/FuzzyPinyin').then(m => ({ default: m.FuzzyPinyin }))),
  'spelling-scheme': lazy(() => import('@/features/editor/modules/SpellingScheme').then(m => ({ default: m.SpellingScheme }))),
  'auxiliary-code': lazy(() => import('@/features/editor/modules/AuxiliaryCode').then(m => ({ default: m.AuxiliaryCode }))),
  'reverse-lookup': lazy(() => import('@/features/editor/modules/ReverseLookup').then(m => ({ default: m.ReverseLookup }))),
  'punctuation': lazy(() => import('@/features/editor/modules/Punctuation').then(m => ({ default: m.Punctuation }))),
  'dictionary': lazy(() => import('@/features/editor/modules/Dictionary').then(m => ({ default: m.Dictionary }))),
  'special-input': lazy(() => import('@/features/editor/modules/SpecialInput').then(m => ({ default: m.SpecialInput }))),
  'lua-extensions': lazy(() => import('@/features/editor/modules/LuaExtensions').then(m => ({ default: m.LuaExtensions }))),
  'ascii-mode': lazy(() => import('@/features/editor/modules/AsciiMode').then(m => ({ default: m.AsciiMode }))),
  'candidate-display': lazy(() => import('@/features/editor/modules/CandidateDisplay').then(m => ({ default: m.CandidateDisplay }))),
  'comment-hints': lazy(() => import('@/features/editor/modules/CommentHints').then(m => ({ default: m.CommentHints }))),
}

// ─── Helper functions ──────────────────────────────────

/** 根据方案能力过滤出适用的模块 */
export function getModulesForSchema(capabilities: string[]): ModuleDefinition[] {
  return MODULE_REGISTRY.filter((mod) => {
    const a = mod.applicability
    if (a.type === 'universal') return true
    if (a.type === 'capability') return capabilities.includes(a.cap)
    if (a.type === 'schemas') return false // handled by caller with schema id
    return false
  })
}

/** 按分组组织模块 */
export function groupModules(modules: ModuleDefinition[]): Map<ModuleGroup, ModuleDefinition[]> {
  const grouped = new Map<ModuleGroup, ModuleDefinition[]>()
  for (const group of MODULE_GROUPS) {
    const items = modules.filter((m) => m.group === group.id)
    if (items.length > 0) grouped.set(group.id, items)
  }
  return grouped
}
```

- [ ] **Step 2: Commit**

```bash
git add src/data/module-registry.ts
git commit -m "feat(data): create schema-driven module registry

15 module definitions with group, applicability, tutorial slug.
Lazy-load component map. Helper functions for filtering and grouping."
```

---

### Task 4: 扩展 config-store

**Files:**
- Modify: `src/stores/config-store.ts`
- Test: `src/stores/config-store.test.ts`

- [ ] **Step 1: 添加新的 import 和 state 字段**

在 `config-store.ts` 顶部添加新类型 import：

```typescript
import type {
  RimeProject,
  DefaultConfig,
  SchemaListItem,
  FuzzyRuleState,
  SwitchItem,
  PunctuatorConfig,
  CustomPhrase,
  ThemeStyle,
  ThemeColors,
  TranslatorConfig,
  AuxiliaryCodeConfig,
  ReverseLookupConfig,
  SpecialInputConfig,
  LuaExtensionsConfig,
  DisplayConfig,
  SpellingScheme,
  EditorUIState,
} from '@/types/config'
```

- [ ] **Step 2: 在 ConfigState interface 中添加 UI state 和新 action**

在 `ConfigState` interface 中新增：

```typescript
// UI 状态
editorUI: EditorUIState;
setViewMode: (mode: 'panel' | 'immersive') => void;
setTutorialCollapsed: (collapsed: boolean) => void;
setActiveSection: (section?: string) => void;

// Schema 级配置 updater
updateSchemaConfig: (schemaId: string, partial: Partial<SchemaConfig>) => void;
```

- [ ] **Step 3: 在 store 实现中添加对应的 action**

在 `create<ConfigState>((set) => ({` 内新增：

```typescript
editorUI: {
  viewMode: 'panel',
  tutorialCollapsed: false,
  activeSection: undefined,
},

setViewMode: (mode) =>
  set((s) => ({ editorUI: { ...s.editorUI, viewMode: mode } })),

setTutorialCollapsed: (collapsed) =>
  set((s) => ({ editorUI: { ...s.editorUI, tutorialCollapsed: collapsed } })),

setActiveSection: (section) =>
  set((s) => ({ editorUI: { ...s.editorUI, activeSection: section } })),

updateSchemaConfig: (schemaId, partial) =>
  set((s) => ({
    project: {
      ...s.project,
      schemaConfigs: {
        ...s.project.schemaConfigs,
        [schemaId]: {
          ...(s.project.schemaConfigs[schemaId] ?? { schemaId, fuzzyRules: [] }),
          ...partial,
        },
      },
    },
    isDirty: true,
  })),
```

同时在 `import` 中添加 `SchemaConfig` import，在 `reset` action 中重置 `editorUI`：

```typescript
reset: () =>
  set({
    project: createEmptyProject(),
    activeModule: 'schema-manager',
    isDirty: false,
    editorUI: { viewMode: 'panel', tutorialCollapsed: false, activeSection: undefined },
  }),
```

- [ ] **Step 4: 运行测试**

Run: `npx vitest run src/stores/config-store.test.ts`

Expected: PASS。如有失败，需要在测试中添加 `editorUI` 初始状态断言。

- [ ] **Step 5: Commit**

```bash
git add src/stores/config-store.ts
git commit -m "feat(store): add EditorUIState and generic updateSchemaConfig action

New state: viewMode, tutorialCollapsed, activeSection.
New action: updateSchemaConfig for all schema-level config updates."
```

---

### Task 5: 重构侧边栏

**Files:**
- Modify: `src/features/editor/EditorSidebar.tsx`

- [ ] **Step 1: 重写 EditorSidebar 使用注册表**

完整替换 `EditorSidebar.tsx` 内容：

```tsx
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useConfigStore } from '@/stores/config-store'
import { SCHEMA_REGISTRY, getSchemaCapabilities } from '@/data/schema-registry'
import {
  MODULE_REGISTRY, MODULE_GROUPS, getModulesForSchema, groupModules,
  type ModuleDefinition,
} from '@/data/module-registry'

export function EditorSidebar() {
  const activeModule = useConfigStore((s) => s.activeModule)
  const setActiveModule = useConfigStore((s) => s.setActiveModule)
  const schemaList = useConfigStore((s) => s.project.defaultConfig.schemaList)
  const [showAll, setShowAll] = useState(false)

  const primarySchemaId = schemaList[0]?.schema ?? ''
  const capabilities = getSchemaCapabilities(primarySchemaId)
  const applicableModules = getModulesForSchema(capabilities)
  const displayModules = showAll ? MODULE_REGISTRY : applicableModules
  const grouped = groupModules(displayModules)

  function isModuleApplicable(mod: ModuleDefinition): boolean {
    if (mod.applicability.type === 'universal') return true
    if (mod.applicability.type === 'capability') {
      return capabilities.includes(mod.applicability.cap)
    }
    return false
  }

  return (
    <nav className="w-60 flex-shrink-0 overflow-y-auto border-r bg-gray-50">
      <div className="p-4">
        {MODULE_GROUPS.map((group) => {
          const modules = grouped.get(group.id)
          if (!modules || modules.length === 0) return null

          const applicableCount = modules.filter(isModuleApplicable).length

          return (
            <div key={group.id} className="mb-4">
              <div className="mb-1 flex items-center justify-between px-3">
                <h3 className="text-xs font-semibold uppercase text-gray-400">
                  {group.label}
                </h3>
                {showAll && (
                  <span className="text-xs text-gray-400">
                    {applicableCount}/{modules.length}
                  </span>
                )}
              </div>
              <ul className="space-y-0.5">
                {modules.map((mod) => {
                  const applicable = isModuleApplicable(mod)
                  return (
                    <li key={mod.id}>
                      <button
                        onClick={() => setActiveModule(mod.id)}
                        disabled={!applicable && !showAll}
                        className={cn(
                          'w-full rounded-md px-3 py-2 text-left text-sm transition-colors',
                          activeModule === mod.id
                            ? 'bg-white font-medium text-gray-900 shadow-sm'
                            : applicable
                              ? 'text-gray-600 hover:bg-gray-100'
                              : 'cursor-default text-gray-400',
                        )}
                      >
                        <span>{mod.label}</span>
                        {!applicable && showAll && (
                          <span className="ml-1 text-xs">🔒</span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}

        <div className="mt-2 border-t pt-2">
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full px-3 py-2 text-left text-sm text-gray-400 hover:text-gray-600"
          >
            {showAll ? '隐藏不适用的模块' : '📖 查看所有模块...'}
          </button>
        </div>
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: 验证编译通过**

Run: `npx tsc --noEmit`

Expected: 无错误（新模块组件文件尚不存在，但 lazy import 不会在类型检查时报错）。

- [ ] **Step 3: Commit**

```bash
git add src/features/editor/EditorSidebar.tsx
git commit -m "refactor(editor): rewrite sidebar with registry-driven grouped modules

Dynamic filtering by schema capabilities. Grouped display with
explore-all toggle showing locked modules."
```

---

### Task 6: 重构 EditorContent

**Files:**
- Modify: `src/features/editor/EditorContent.tsx`
- Modify: `src/features/editor/ModuleWrapper.tsx`
- Modify: `src/components/shared/LearnMoreLink.tsx`

- [ ] **Step 1: 重写 EditorContent 使用注册表**

```tsx
import { Suspense } from 'react'
import { useConfigStore } from '@/stores/config-store'
import { ModuleWrapper } from './ModuleWrapper'
import { MODULE_COMPONENTS, MODULE_REGISTRY } from '@/data/module-registry'

export function EditorContent() {
  const activeModule = useConfigStore((s) => s.activeModule)

  const Component = MODULE_COMPONENTS[activeModule]
  const moduleDef = MODULE_REGISTRY.find((m) => m.id === activeModule)

  if (!Component) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-2xl text-gray-400">
          模块「{activeModule}」尚未实现。
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mx-auto max-w-2xl">
        <ModuleWrapper module={activeModule}>
          <Suspense fallback={<div className="text-gray-400">加载中...</div>}>
            <Component />
          </Suspense>
        </ModuleWrapper>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 更新 ModuleWrapper 的 module prop 类型**

在 `ModuleWrapper.tsx` 中，将 interface 改为：

```typescript
interface ModuleWrapperProps {
  module: string;
  children: React.ReactNode;
}
```

同时更新 `extractModuleYaml` 和 `applyModuleYaml` 调用：如果 `module-yaml.ts` 中的函数要求 `EditorModule` 类型参数，由于 `EditorModule` 已改为 `string`，无需额外修改。

- [ ] **Step 3: 更新 LearnMoreLink**

修改 `src/components/shared/LearnMoreLink.tsx`，从硬编码映射改为注册表查询：

```tsx
import { Link } from 'react-router-dom'
import { MODULE_REGISTRY } from '@/data/module-registry'

interface LearnMoreLinkProps {
  module: string;
}

export function LearnMoreLink({ module }: LearnMoreLinkProps) {
  const moduleDef = MODULE_REGISTRY.find((m) => m.id === module)
  const slug = moduleDef?.tutorialSlug ?? module

  return (
    <Link
      to={`/docs/${slug}`}
      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
      target="_blank"
    >
      📖 了解更多
    </Link>
  )
}
```

- [ ] **Step 4: 验证编译**

Run: `npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add src/features/editor/EditorContent.tsx src/features/editor/ModuleWrapper.tsx src/components/shared/LearnMoreLink.tsx
git commit -m "refactor(editor): use registry for EditorContent and LearnMoreLink

Dynamic component loading from MODULE_COMPONENTS map.
Graceful fallback for unimplemented modules."
```

---

## Phase 2: 模块扩充与新增

### Task 7: 扩展开关定义数据

**Files:**
- Modify: `src/data/switch-definitions.ts`

- [ ] **Step 1: 添加多态开关支持和新开关**

完整替换 `switch-definitions.ts`：

```typescript
export interface SwitchDefinition {
  name: string;
  label: string;
  description: string;
  defaultReset: number;
  states: [string, string];
  category: 'basic' | 'conversion' | 'input' | 'display' | 'encoding' | 'comment';
}

export interface MultiStateSwitchDefinition {
  options: string[];
  label: string;
  description: string;
  defaultReset: number;
  states: string[];
  category: 'basic' | 'conversion' | 'input' | 'display' | 'encoding' | 'comment';
}

export type AnySwitchDefinition = SwitchDefinition | MultiStateSwitchDefinition;

export function isBinarySwitch(def: AnySwitchDefinition): def is SwitchDefinition {
  return 'name' in def;
}

export const SWITCH_DEFINITIONS: AnySwitchDefinition[] = [
  // --- basic ---
  { name: 'emoji', label: 'Emoji', description: '输入时显示 Emoji 候选', defaultReset: 1, states: ['关', '开'], category: 'basic' },
  { name: 'full_shape', label: '全角/半角', description: '全角模式输出全角字符', defaultReset: 0, states: ['半角', '全角'], category: 'basic' },
  { name: 'ascii_punct', label: '中英标点', description: '切换中文标点和英文标点', defaultReset: 0, states: ['中文', '英文'], category: 'basic' },
  // --- conversion (multi-state) ---
  { options: ['s2s', 's2t', 's2hk', 's2tw'], label: '简繁转换', description: '选择输出字形：简体、通用繁体、港繁、台繁', defaultReset: 0, states: ['简体', '通繁', '港繁', '臺繁'], category: 'conversion' },
  // --- input ---
  { name: 'prediction', label: '预测输入', description: '根据上下文预测下一个词', defaultReset: 0, states: ['关', '开'], category: 'input' },
  { name: 'abbrev', label: '简码', description: '启用简码输入', defaultReset: 1, states: ['关', '开'], category: 'input' },
  { name: 'chinese_english', label: '翻译模式', description: '输入中文显示对应英文翻译', defaultReset: 0, states: ['关', '开'], category: 'input' },
  // --- display ---
  { name: 'charset_filter', label: '字集过滤', description: '限制候选词字符集范围', defaultReset: 0, states: ['大字集', '小字集'], category: 'display' },
  { name: 'char_priority', label: '候选排序', description: '优先显示单字或词组', defaultReset: 0, states: ['词组先', '单字先'], category: 'display' },
  { name: 'super_tips', label: 'Tips 提示', description: '显示 Tips 扩展提示信息', defaultReset: 0, states: ['关', '开'], category: 'display' },
  // --- encoding (multi-state) ---
  { options: ['raw_input', 'tone_display', 'full_pinyin'], label: '编码显示', description: '候选栏中显示的编码格式', defaultReset: 0, states: ['原编码', '有声调', '无声调'], category: 'encoding' },
  // --- comment (multi-state) ---
  { options: ['comment_off', 'tone_hint', 'toneless_hint'], label: '注释模式', description: '候选词注释显示方式', defaultReset: 0, states: ['注释关', '有声调', '无声调'], category: 'comment' },
]

export const SWITCH_CATEGORIES = [
  { id: 'basic', label: '基础' },
  { id: 'conversion', label: '繁简转换' },
  { id: 'input', label: '输入增强' },
  { id: 'display', label: '显示控制' },
  { id: 'encoding', label: '编码显示' },
  { id: 'comment', label: '注释模式' },
] as const
```

- [ ] **Step 2: Commit**

```bash
git add src/data/switch-definitions.ts
git commit -m "feat(data): expand switch definitions to 13 with multi-state support

Add conversion (4-state), encoding (3-state), comment (3-state) switches.
Categorize all switches for grouped display in Switches module."
```

---

### Task 8: 重写开关模块（多态支持）

**Files:**
- Modify: `src/features/editor/modules/Switches.tsx`

- [ ] **Step 1: 重写 Switches.tsx 支持分组和多态**

```tsx
import { useConfigStore } from '@/stores/config-store'
import {
  SWITCH_DEFINITIONS, SWITCH_CATEGORIES,
  isBinarySwitch, type AnySwitchDefinition,
} from '@/data/switch-definitions'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import type { SwitchItem, SimpleSwitchItem, MultiStateSwitchItem } from '@/types/config'
import { LearnMoreLink } from '@/components/shared/LearnMoreLink'

export function Switches() {
  const schemaList = useConfigStore((s) => s.project.defaultConfig.schemaList)
  const schemaConfigs = useConfigStore((s) => s.project.schemaConfigs)
  const updateSchemaConfig = useConfigStore((s) => s.updateSchemaConfig)

  const primarySchemaId = schemaList[0]?.schema ?? ''
  const currentSwitches: SwitchItem[] = schemaConfigs[primarySchemaId]?.switches ?? []

  function findCurrentReset(def: AnySwitchDefinition): number {
    if (isBinarySwitch(def)) {
      const item = currentSwitches.find((s) => 'name' in s && s.name === def.name) as SimpleSwitchItem | undefined
      return item?.reset ?? def.defaultReset
    }
    const item = currentSwitches.find(
      (s) => 'options' in s && JSON.stringify(s.options) === JSON.stringify(def.options)
    ) as MultiStateSwitchItem | undefined
    return item?.reset ?? def.defaultReset
  }

  function handleBinaryToggle(name: string, enabled: boolean) {
    const def = SWITCH_DEFINITIONS.find((d) => isBinarySwitch(d) && d.name === name) as typeof SWITCH_DEFINITIONS[0] | undefined
    if (!def || !isBinarySwitch(def)) return
    const others = currentSwitches.filter((s) => !('name' in s && s.name === name))
    const updated: SwitchItem[] = [
      ...others,
      { name, reset: enabled ? 1 : 0, states: def.states } as SimpleSwitchItem,
    ]
    updateSchemaConfig(primarySchemaId, { switches: updated })
  }

  function handleMultiStateChange(options: string[], value: number, def: AnySwitchDefinition) {
    const others = currentSwitches.filter(
      (s) => !('options' in s && JSON.stringify(s.options) === JSON.stringify(options))
    )
    const updated: SwitchItem[] = [
      ...others,
      { options, reset: value, states: def.states } as MultiStateSwitchItem,
    ]
    updateSchemaConfig(primarySchemaId, { switches: updated })
  }

  if (!primarySchemaId) {
    return <div className="text-gray-500">请先在「输入方案管理」中添加至少一个方案。</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">开关与杂项</h3>
          <LearnMoreLink module="switches" />
        </div>
        <p className="mt-1 text-sm text-gray-500">
          控制方案的各项功能开关，当前配置应用于方案：{primarySchemaId}
        </p>
      </div>

      {SWITCH_CATEGORIES.map((cat) => {
        const defs = SWITCH_DEFINITIONS.filter((d) => d.category === cat.id)
        if (defs.length === 0) return null

        return (
          <div key={cat.id}>
            <h4 className="mb-3 font-medium text-gray-700">{cat.label}</h4>
            <div className="space-y-3">
              {defs.map((def) => {
                const reset = findCurrentReset(def)

                if (isBinarySwitch(def)) {
                  return (
                    <div key={def.name} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{def.label}</p>
                        <p className="text-sm text-gray-500">{def.description}</p>
                      </div>
                      <Switch
                        checked={reset === 1}
                        onCheckedChange={(checked) => handleBinaryToggle(def.name, checked)}
                      />
                    </div>
                  )
                }

                // Multi-state switch
                return (
                  <div key={def.options.join(',')} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{def.label}</p>
                      <p className="text-sm text-gray-500">{def.description}</p>
                    </div>
                    <Select
                      value={String(reset)}
                      onValueChange={(v) => handleMultiStateChange(def.options, Number(v), def)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {def.states.map((state, idx) => (
                          <SelectItem key={idx} value={String(idx)}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )
              })}
            </div>
            <Separator className="mt-4" />
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: 验证编译**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/features/editor/modules/Switches.tsx
git commit -m "feat(switches): rewrite with multi-state support and categorized display

Support SimpleSwitchItem (toggle) and MultiStateSwitchItem (select).
Group switches by category: basic, conversion, input, display, encoding, comment."
```

---

### Task 9: 扩充候选词设置模块

**Files:**
- Modify: `src/features/editor/modules/CandidateSettings.tsx`

- [ ] **Step 1: 添加高级设置区域**

在现有的候选词数量和选词按键之后，添加一个「高级设置」折叠区域，包含 translator 配置项：

在 `CandidateSettings` 组件内，现有 JSX 的 `</div>` 结束前（`space-y-4` div 的末尾），追加：

```tsx
<Separator className="my-4" />
<details className="group">
  <summary className="cursor-pointer font-medium text-gray-700">
    高级设置
    <span className="ml-1 text-xs text-gray-400">（翻译器参数）</span>
  </summary>
  <div className="mt-3 space-y-4">
    <div className="flex items-center justify-between">
      <div>
        <Label>输入补全</Label>
        <p className="text-sm text-gray-500">打部分拼音时是否显示完整词</p>
      </div>
      <Switch
        checked={translator.enableCompletion}
        onCheckedChange={(v) => updateTranslator({ enableCompletion: v })}
      />
    </div>
    <div className="flex items-center justify-between">
      <div>
        <Label>用户词典</Label>
        <p className="text-sm text-gray-500">启用自动调频和用户词典记忆</p>
      </div>
      <Switch
        checked={translator.enableUserDict}
        onCheckedChange={(v) => updateTranslator({ enableUserDict: v })}
      />
    </div>
    <div>
      <Label>核心词最大长度</Label>
      <Input
        type="number" min={1} max={10} className="mt-1 w-24"
        value={translator.coreWordLength}
        onChange={(e) => updateTranslator({ coreWordLength: Number(e.target.value) })}
      />
      <p className="mt-1 text-sm text-gray-500">影响造句质量，默认 4</p>
    </div>
    <div>
      <Label>候选词最大长度</Label>
      <Input
        type="number" min={1} max={20} className="mt-1 w-24"
        value={translator.maxWordLength}
        onChange={(e) => updateTranslator({ maxWordLength: Number(e.target.value) })}
      />
    </div>
    <div>
      <Label>同音词上限</Label>
      <Input
        type="number" min={1} max={20} className="mt-1 w-24"
        value={translator.maxHomophones}
        onChange={(e) => updateTranslator({ maxHomophones: Number(e.target.value) })}
      />
    </div>
    <div>
      <Label>同形词上限</Label>
      <Input
        type="number" min={1} max={20} className="mt-1 w-24"
        value={translator.maxHomographs}
        onChange={(e) => updateTranslator({ maxHomographs: Number(e.target.value) })}
      />
    </div>
  </div>
</details>
```

需要在组件顶部添加 translator 状态读取和更新逻辑：

```typescript
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import type { TranslatorConfig } from '@/types/config'

// 在组件函数内部：
const schemaList = useConfigStore((s) => s.project.defaultConfig.schemaList)
const schemaConfigs = useConfigStore((s) => s.project.schemaConfigs)
const updateSchemaConfig = useConfigStore((s) => s.updateSchemaConfig)
const primarySchemaId = schemaList[0]?.schema ?? ''

const DEFAULT_TRANSLATOR: TranslatorConfig = {
  enableCompletion: true,
  enableUserDict: true,
  coreWordLength: 4,
  maxWordLength: 7,
  maxHomophones: 8,
  maxHomographs: 8,
  spellingHints: 30,
  alwaysShowComments: true,
}

const translator = schemaConfigs[primarySchemaId]?.translator ?? DEFAULT_TRANSLATOR

function updateTranslator(partial: Partial<TranslatorConfig>) {
  updateSchemaConfig(primarySchemaId, {
    translator: { ...translator, ...partial },
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/editor/modules/CandidateSettings.tsx
git commit -m "feat(candidate-settings): add advanced translator config section

Collapsible section with enableCompletion, enableUserDict,
coreWordLength, maxWordLength, maxHomophones, maxHomographs."
```

---

### Task 10: 扩充按键绑定模块

**Files:**
- Create: `src/data/key-binding-definitions.ts`
- Modify: `src/features/editor/modules/KeyBindings.tsx`

- [ ] **Step 1: 创建功能快捷键定义数据**

创建 `src/data/key-binding-definitions.ts`：

```typescript
export interface FunctionKeyDefinition {
  id: string;
  label: string;
  description: string;
  defaultAccept: string;
  defaultSend?: string;
  defaultToggle?: string;
  when: string;
  category: 'function' | 'navigation' | 'editing';
}

export const FUNCTION_KEY_DEFINITIONS: FunctionKeyDefinition[] = [
  { id: 'tab_next', label: 'Tab 音节跳转', description: '在多音节输入时循环切换到下一个音节', defaultAccept: 'Tab', defaultSend: 'Shift+Right', when: 'composing', category: 'navigation' },
  { id: 'ctrl_a', label: 'Ctrl+A 注释切换', description: '切换辅助码/声调注释显示', defaultAccept: 'Control+a', defaultToggle: 'tone_hint', when: 'always', category: 'function' },
  { id: 'ctrl_s', label: 'Ctrl+S 声调显示', description: '在输入码中显示声调标记', defaultAccept: 'Control+s', defaultToggle: 'tone_display', when: 'always', category: 'function' },
  { id: 'ctrl_e', label: 'Ctrl+E 翻译模式', description: '切换中英翻译模式', defaultAccept: 'Control+e', defaultToggle: 'chinese_english', when: 'always', category: 'function' },
  { id: 'ctrl_t', label: 'Ctrl+T Tips', description: '切换 Tips 提示开关', defaultAccept: 'Control+t', defaultToggle: 'super_tips', when: 'always', category: 'function' },
  { id: 'ctrl_g', label: 'Ctrl+G 字集', description: '切换大字集/小字集', defaultAccept: 'Control+g', defaultToggle: 'charset_filter', when: 'always', category: 'function' },
  { id: 'ctrl_j', label: 'Ctrl+J 左移排序', description: '手动将候选词向左移动一步', defaultAccept: 'Control+j', defaultSend: 'Shift+Left', when: 'has_menu', category: 'editing' },
  { id: 'ctrl_k', label: 'Ctrl+K 右移排序', description: '手动将候选词向右移动一步', defaultAccept: 'Control+k', defaultSend: 'Shift+Right', when: 'has_menu', category: 'editing' },
  { id: 'minus_pgup', label: '减号翻页', description: '使用减号键向上翻页', defaultAccept: 'minus', defaultSend: 'Page_Up', when: 'has_menu', category: 'navigation' },
  { id: 'equal_pgdn', label: '等号翻页', description: '使用等号键向下翻页', defaultAccept: 'equal', defaultSend: 'Page_Down', when: 'has_menu', category: 'navigation' },
]
```

- [ ] **Step 2: 在 KeyBindings.tsx 中添加功能快捷键子区域**

在现有「中英切换键」区域之后，添加 `<Separator />` 和新的「功能快捷键」区域。从 `FUNCTION_KEY_DEFINITIONS` 渲染列表，每项显示 label + description + 一个 Switch 启用/禁用。启用时将对应 KeyBinding 添加到 `keyBinder.bindings`，禁用时移除。

- [ ] **Step 3: Commit**

```bash
git add src/data/key-binding-definitions.ts src/features/editor/modules/KeyBindings.tsx
git commit -m "feat(key-bindings): add function shortcut keys section

10 configurable shortcuts: Tab cycling, Ctrl+A/S/E/T/G toggles,
Ctrl+J/K manual sort, minus/equal page navigation."
```

---

### Task 11-17: 新增 7 个模块组件

每个新模块遵循相同模式：读取 store → 渲染表单 → 更新 store。以辅助码模块为例展示完整代码，其余模块结构类似。

**Files:**
- Create: `src/features/editor/modules/SpellingScheme.tsx`
- Create: `src/features/editor/modules/AuxiliaryCode.tsx`
- Create: `src/features/editor/modules/ReverseLookup.tsx`
- Create: `src/features/editor/modules/SpecialInput.tsx`
- Create: `src/features/editor/modules/LuaExtensions.tsx`
- Create: `src/features/editor/modules/CandidateDisplay.tsx`
- Create: `src/features/editor/modules/CommentHints.tsx`

- [ ] **Step 1: 创建 AuxiliaryCode.tsx**

```tsx
import { useConfigStore } from '@/stores/config-store'
import { SCHEMA_REGISTRY } from '@/data/schema-registry'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { LearnMoreLink } from '@/components/shared/LearnMoreLink'
import type { AuxiliaryCodeConfig, AuxiliaryCodeScheme } from '@/types/config'

const AUXILIARY_CODE_LABELS: Record<AuxiliaryCodeScheme, string> = {
  moqi: '墨奇码',
  hexing: '鹤形',
  zrm: '自然码',
  tiger: '虎码',
  wubi: '五笔',
  cangjie: '仓颉',
  simple_he: '简单鹤',
  hanxin: '汉心码',
}

const TRIGGER_MODE_LABELS = {
  direct: '直接辅助码',
  indirect: '间接辅助码（/ 引导）',
  backtick: '反引号引导（` 引导）',
}

const DEFAULT_AUX_CONFIG: AuxiliaryCodeConfig = {
  scheme: 'zrm',
  triggerMode: 'direct',
  hintEnabled: true,
  hintLength: 1,
  splitHintEnabled: false,
}

export function AuxiliaryCode() {
  const schemaList = useConfigStore((s) => s.project.defaultConfig.schemaList)
  const schemaConfigs = useConfigStore((s) => s.project.schemaConfigs)
  const updateSchemaConfig = useConfigStore((s) => s.updateSchemaConfig)

  const primarySchemaId = schemaList[0]?.schema ?? ''
  const schemaInfo = SCHEMA_REGISTRY.find((s) => s.id === primarySchemaId)
  const config = schemaConfigs[primarySchemaId]?.auxiliaryCode ?? DEFAULT_AUX_CONFIG
  const availableSchemes = schemaInfo?.availableAuxiliaryCodes ?? ['zrm']

  function update(partial: Partial<AuxiliaryCodeConfig>) {
    updateSchemaConfig(primarySchemaId, {
      auxiliaryCode: { ...config, ...partial },
    })
  }

  if (!primarySchemaId) {
    return <div className="text-gray-500">请先在「输入方案管理」中添加至少一个方案。</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">辅助码配置</h3>
          <LearnMoreLink module="auxiliary-code" />
        </div>
        <p className="mt-1 text-sm text-gray-500">
          配置辅助码方案和引导方式。当前方案：{primarySchemaId}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label>辅助码方案</Label>
          <Select
            value={config.scheme}
            onValueChange={(v) => update({ scheme: v as AuxiliaryCodeScheme })}
          >
            <SelectTrigger className="mt-1 w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              {availableSchemes.map((s) => (
                <SelectItem key={s} value={s}>
                  {AUXILIARY_CODE_LABELS[s] ?? s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>引导方式</Label>
          <Select
            value={config.triggerMode}
            onValueChange={(v) => update({ triggerMode: v as AuxiliaryCodeConfig['triggerMode'] })}
          >
            <SelectTrigger className="mt-1 w-64"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(TRIGGER_MODE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-1 text-sm text-gray-500">
            直接辅助码在编码末尾追加；间接辅助码通过 / 或 ` 分隔
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>辅助码提示</Label>
            <p className="text-sm text-gray-500">在候选词旁显示辅助码提示</p>
          </div>
          <Switch
            checked={config.hintEnabled}
            onCheckedChange={(v) => update({ hintEnabled: v })}
          />
        </div>

        {config.hintEnabled && (
          <div>
            <Label>提示长度</Label>
            <Input
              type="number" min={1} max={10}
              className="mt-1 w-24"
              value={config.hintLength}
              onChange={(e) => update({ hintLength: Number(e.target.value) })}
            />
            <p className="mt-1 text-sm text-gray-500">显示几个字的辅助码（默认 1 = 单字）</p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <Label>拆分提示</Label>
            <p className="text-sm text-gray-500">显示字形拆分提示</p>
          </div>
          <Switch
            checked={config.splitHintEnabled}
            onCheckedChange={(v) => update({ splitHintEnabled: v })}
          />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 创建 SpellingScheme.tsx**

同样模式：Select 组件选择拼写方案（从 `schemaInfo.availableSpellingSchemes` 获取选项），Toggle 控制 `toneIsolate`。组件读取 `schemaConfigs[id]?.spellingScheme`，通过 `updateSchemaConfig` 更新。

- [ ] **Step 3: 创建 ReverseLookup.tsx**

反查触发键（Input）、数据源（checkbox 组）、反查方式（checkbox 组）。读取/写入 `reverseLookup` 字段。

- [ ] **Step 4: 创建 SpecialInput.tsx**

从 `special-trigger-definitions.ts`（需先创建）读取可用触发器列表，每个触发器一行：名称 + 触发码（Input）+ 启用/禁用（Switch）。读取/写入 `specialInput.enabledTriggers`。

创建 `src/data/special-trigger-definitions.ts`：

```typescript
export interface SpecialTriggerDefinition {
  id: string;
  label: string;
  description: string;
  defaultCode: string;
  category: 'datetime' | 'tool' | 'stats';
}

export const SPECIAL_TRIGGER_DEFINITIONS: SpecialTriggerDefinition[] = [
  { id: 'date', label: '日期', description: '输出当前日期', defaultCode: '/rq', category: 'datetime' },
  { id: 'time', label: '时间', description: '输出当前时间', defaultCode: '/sj', category: 'datetime' },
  { id: 'week', label: '星期', description: '输出当前星期', defaultCode: '/xq', category: 'datetime' },
  { id: 'lunar', label: '农历', description: '输出农历日期', defaultCode: '/nl', category: 'datetime' },
  { id: 'solar_term', label: '节气', description: '输出当前节气', defaultCode: '/jq', category: 'datetime' },
  { id: 'holiday', label: '节日', description: '输出近期节日', defaultCode: '/jr', category: 'datetime' },
  { id: 'timestamp', label: '时间戳', description: '输出 Unix 时间戳', defaultCode: '/tt', category: 'datetime' },
  { id: 'calculator', label: '计算器', description: '数学表达式计算', defaultCode: 'V', category: 'tool' },
  { id: 'unicode', label: 'Unicode', description: 'Unicode 字符输入', defaultCode: 'U', category: 'tool' },
  { id: 'stats_today', label: '今日统计', description: '显示今日输入统计', defaultCode: '/rtj', category: 'stats' },
  { id: 'stats_total', label: '总计统计', description: '显示累计输入统计', defaultCode: '/tj', category: 'stats' },
]
```

- [ ] **Step 5: 创建 LuaExtensions.tsx**

分节显示各 Lua 扩展的配置（超级注释、超级处理器、预测、快符、统计）。每节用 details 折叠。读取/写入 `luaExtensions` 字段的对应子对象。

- [ ] **Step 6: 创建 CandidateDisplay.tsx**

横排/竖排 Switch、拼音提示长度 Input、始终显示注释 Switch。读取 `displayConfig` 和 `translator.spellingHints/alwaysShowComments`。

- [ ] **Step 7: 创建 CommentHints.tsx**

注释模式 Select（3 态）、Tips 数据源路径 Input、辅助码提示样式。读取 `displayConfig.commentMode` 和 `luaExtensions.superComment`。

- [ ] **Step 8: 验证所有模块编译**

Run: `npx tsc --noEmit`

- [ ] **Step 9: Commit**

```bash
git add src/features/editor/modules/SpellingScheme.tsx \
  src/features/editor/modules/AuxiliaryCode.tsx \
  src/features/editor/modules/ReverseLookup.tsx \
  src/features/editor/modules/SpecialInput.tsx \
  src/features/editor/modules/LuaExtensions.tsx \
  src/features/editor/modules/CandidateDisplay.tsx \
  src/features/editor/modules/CommentHints.tsx \
  src/data/special-trigger-definitions.ts
git commit -m "feat(modules): add 7 new editor modules for Wanxiang alignment

SpellingScheme, AuxiliaryCode, ReverseLookup, SpecialInput,
LuaExtensions, CandidateDisplay, CommentHints."
```

---

### Task 18: 扩展 YAML 序列化器

**Files:**
- Modify: `src/lib/yaml/serializer.ts`
- Test: `src/lib/yaml/serializer.test.ts`

- [ ] **Step 1: 扩展 serializeSchemaConfig**

在 `serializeSchemaConfig` 函数中，Punctuator 代码块之后添加：

```typescript
// Translator
if (config.translator) {
  const t = config.translator
  patch['translator/enable_completion'] = t.enableCompletion
  patch['translator/enable_user_dict'] = t.enableUserDict
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
if (config.luaExtensions?.userPredict) {
  const up = config.luaExtensions.userPredict
  patch['user_predict/max_candidates'] = up.maxCandidates
  patch['user_predict/expiry_days'] = up.expiryDays
  patch['user_predict/activation_days'] = up.activationDays
}
```

同时更新 switches 序列化以支持多态：

```typescript
if (config.switches && config.switches.length > 0) {
  patch.switches = config.switches.map((s) => {
    if ('options' in s) {
      return { options: s.options, reset: s.reset, states: s.states }
    }
    const entry: Record<string, unknown> = { name: s.name, reset: s.reset }
    if (s.states) entry.states = s.states
    return entry
  })
}
```

- [ ] **Step 2: 添加序列化测试**

在 `serializer.test.ts` 中添加：

```typescript
it('serializes translator config', () => {
  const config: SchemaConfig = {
    schemaId: 'wanxiang',
    fuzzyRules: [],
    translator: {
      enableCompletion: true,
      enableUserDict: false,
      coreWordLength: 4,
      maxWordLength: 7,
      maxHomophones: 8,
      maxHomographs: 8,
      spellingHints: 30,
      alwaysShowComments: true,
    },
  }
  const result = serializeSchemaConfig(config)
  expect(result['translator/enable_completion']).toBe(true)
  expect(result['translator/enable_user_dict']).toBe(false)
})

it('serializes multi-state switches', () => {
  const config: SchemaConfig = {
    schemaId: 'test',
    fuzzyRules: [],
    switches: [
      { options: ['s2s', 's2t'], reset: 0, states: ['简体', '繁体'] },
    ],
  }
  const result = serializeSchemaConfig(config)
  expect(result.switches).toEqual([
    { options: ['s2s', 's2t'], reset: 0, states: ['简体', '繁体'] },
  ])
})
```

- [ ] **Step 3: 运行测试**

Run: `npx vitest run src/lib/yaml/serializer.test.ts`

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/lib/yaml/serializer.ts src/lib/yaml/serializer.test.ts
git commit -m "feat(yaml): extend serializer for translator, lua, multi-state switches"
```

---

### Task 19: 扩展 YAML 解析器

**Files:**
- Modify: `src/lib/yaml/parser.ts`
- Test: `src/lib/yaml/parser.test.ts`

- [ ] **Step 1: 在 mapToSchemaConfig 中添加新字段解析**

在现有的 switches 和 punctuator 解析之后添加 translator、lua extension 解析逻辑。解析 `translator/xxx` 路径的值到 `TranslatorConfig` 对象，`super_comment/xxx` 到 `luaExtensions.superComment` 等。

- [ ] **Step 2: 添加多态 switch 解析**

更新 switches 解析，检测 `options` 字段以区分 `SimpleSwitchItem` 和 `MultiStateSwitchItem`。

- [ ] **Step 3: 添加解析测试**

- [ ] **Step 4: 运行测试**

Run: `npx vitest run src/lib/yaml/parser.test.ts`

- [ ] **Step 5: Commit**

```bash
git add src/lib/yaml/parser.ts src/lib/yaml/parser.test.ts
git commit -m "feat(yaml): extend parser for translator, lua config, multi-state switches"
```

---

### Task 20: 更新 module-yaml.ts

**Files:**
- Modify: `src/lib/yaml/module-yaml.ts`

- [ ] **Step 1: 扩展 MODULE_KEY_MAP 添加新模块**

```typescript
const MODULE_KEY_MAP: Record<string, ModuleKeyMapping> = {
  'schema-manager': { file: 'default', keys: ['schema_list'] },
  'candidate-settings': { file: 'default', keys: ['menu'] },
  'key-bindings': { file: 'default', keys: ['ascii_composer', 'key_binder'] },
  'fuzzy-pinyin': { file: 'schema', keys: ['speller'] },
  'ascii-mode': { file: 'platform', keys: ['app_options'] },
  'punctuation': { file: 'schema', keys: ['punctuator'] },
  'dictionary': { file: 'custom_phrase', keys: [] },
  'switches': { file: 'schema', keys: ['switches'] },
  // 新增模块
  'spelling-scheme': { file: 'schema', keys: ['speller'] },
  'auxiliary-code': { file: 'schema', keys: ['speller'] },
  'reverse-lookup': { file: 'schema', keys: ['reverse_lookup', 'wanxiang_lookup'] },
  'special-input': { file: 'schema', keys: ['recognizer'] },
  'lua-extensions': { file: 'schema', keys: ['super_comment', 'super_processor', 'user_predict', 'super_replacer'] },
  'candidate-display': { file: 'schema', keys: ['translator'] },
  'comment-hints': { file: 'schema', keys: ['super_comment'] },
}
```

同时更新函数签名中的 `EditorModule` 类型引用为 `string`（已通过 Task 1 Step 6 处理）。

- [ ] **Step 2: 运行测试**

Run: `npx vitest run src/lib/yaml/module-yaml.test.ts`

- [ ] **Step 3: Commit**

```bash
git add src/lib/yaml/module-yaml.ts
git commit -m "feat(yaml): add module YAML mapping for 7 new modules"
```

---

## Phase 3: 教程集成

### Task 21: 创建 EditorContext

**Files:**
- Create: `src/features/editor/EditorContext.tsx`

- [ ] **Step 1: 创建 context**

```tsx
import { createContext, useContext } from 'react'

interface EditorContextValue {
  isImmersive: boolean;
}

export const EditorContext = createContext<EditorContextValue>({
  isImmersive: false,
})

export function useEditorContext() {
  return useContext(EditorContext)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/editor/EditorContext.tsx
git commit -m "feat(editor): add EditorContext for view mode"
```

---

### Task 22: 创建 ConfigSlot 组件

**Files:**
- Create: `src/components/shared/ConfigSlot.tsx`

- [ ] **Step 1: 实现 ConfigSlot**

```tsx
import { Suspense } from 'react'
import { useEditorContext } from '@/features/editor/EditorContext'
import { MODULE_COMPONENTS } from '@/data/module-registry'
import { GoToConfigButton } from './GoToConfigButton'

interface ConfigSlotProps {
  module: string;
  label?: string;
}

export function ConfigSlot({ module, label }: ConfigSlotProps) {
  const { isImmersive } = useEditorContext()

  if (isImmersive) {
    const Component = MODULE_COMPONENTS[module]
    if (!Component) return null

    return (
      <div className="my-6 rounded-lg border-2 border-blue-500 bg-blue-50/30 p-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="rounded bg-blue-500 px-2 py-0.5 text-xs text-white">
            ⚡ 在此配置
          </span>
          <span className="text-xs text-gray-500">你的修改会实时生效</span>
        </div>
        <Suspense fallback={<div className="text-gray-400">加载中...</div>}>
          <Component />
        </Suspense>
      </div>
    )
  }

  return <GoToConfigButton module={module} label={label ?? `在编辑器中配置`} />
}
```

注意：需要确认 `GoToConfigButton` 组件存在。查看现有 MDX 中的引用方式，如有需要创建或适配。

- [ ] **Step 2: Commit**

```bash
git add src/components/shared/ConfigSlot.tsx
git commit -m "feat(mdx): create ConfigSlot component for tutorial/editor integration

Renders embedded config component in immersive mode,
GoToConfigButton link in panel mode."
```

---

### Task 23: 创建 TutorialPanel

**Files:**
- Create: `src/features/editor/TutorialPanel.tsx`

- [ ] **Step 1: 实现教程面板**

```tsx
import { lazy, Suspense, useMemo } from 'react'
import { useConfigStore } from '@/stores/config-store'
import { MODULE_REGISTRY } from '@/data/module-registry'

// 动态导入 MDX 内容的映射
const MDX_LOADERS: Record<string, () => Promise<{ default: React.ComponentType }>> = {
  'schema-manager': () => import('@/content/schema-manager.mdx'),
  'candidate-settings': () => import('@/content/candidate-settings.mdx'),
  'key-bindings': () => import('@/content/key-bindings.mdx'),
  'fuzzy-pinyin': () => import('@/content/fuzzy-pinyin.mdx'),
  'ascii-mode': () => import('@/content/ascii-mode.mdx'),
  'punctuation': () => import('@/content/punctuation.mdx'),
  'dictionary': () => import('@/content/dictionary.mdx'),
  'switches': () => import('@/content/switches.mdx'),
  // 新模块教程在 MDX 文件创建后添加
}

interface TutorialPanelProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onEnterImmersive: () => void;
}

export function TutorialPanel({ collapsed, onToggleCollapse, onEnterImmersive }: TutorialPanelProps) {
  const activeModule = useConfigStore((s) => s.activeModule)
  const moduleDef = MODULE_REGISTRY.find((m) => m.id === activeModule)
  const slug = moduleDef?.tutorialSlug ?? activeModule

  const MdxContent = useMemo(() => {
    const loader = MDX_LOADERS[slug]
    if (!loader) return null
    return lazy(loader)
  }, [slug])

  if (collapsed) {
    return (
      <div className="flex w-10 flex-shrink-0 flex-col items-center border-l bg-gray-50 pt-4">
        <button
          onClick={onToggleCollapse}
          className="text-gray-400 hover:text-gray-600"
          title="展开教程面板"
        >
          📖
        </button>
      </div>
    )
  }

  return (
    <div className="w-72 flex-shrink-0 overflow-y-auto border-l bg-gray-50/50">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-xs font-semibold text-gray-500">📖 教程</span>
        <div className="flex gap-2">
          <button
            onClick={onEnterImmersive}
            className="text-xs text-blue-500 hover:text-blue-700"
          >
            沉浸模式 →
          </button>
          <button
            onClick={onToggleCollapse}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            收起
          </button>
        </div>
      </div>
      <div className="prose prose-sm max-w-none p-4">
        {MdxContent ? (
          <Suspense fallback={<div className="text-gray-400">加载教程...</div>}>
            <MdxContent />
          </Suspense>
        ) : (
          <p className="text-gray-400">暂无此模块的教程内容</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/editor/TutorialPanel.tsx
git commit -m "feat(editor): create TutorialPanel component

Auto-loads MDX content matching active module. Collapsible with
immersive mode entry point."
```

---

### Task 24: 创建 ImmersiveView

**Files:**
- Create: `src/features/editor/ImmersiveView.tsx`

- [ ] **Step 1: 实现沉浸模式**

```tsx
import { lazy, Suspense, useMemo } from 'react'
import { useConfigStore } from '@/stores/config-store'
import { MODULE_REGISTRY } from '@/data/module-registry'
import { EditorContext } from './EditorContext'

// 复用 TutorialPanel 的 MDX_LOADERS（可提取到共享位置）
const MDX_LOADERS: Record<string, () => Promise<{ default: React.ComponentType }>> = {
  'schema-manager': () => import('@/content/schema-manager.mdx'),
  'candidate-settings': () => import('@/content/candidate-settings.mdx'),
  'key-bindings': () => import('@/content/key-bindings.mdx'),
  'fuzzy-pinyin': () => import('@/content/fuzzy-pinyin.mdx'),
  'ascii-mode': () => import('@/content/ascii-mode.mdx'),
  'punctuation': () => import('@/content/punctuation.mdx'),
  'dictionary': () => import('@/content/dictionary.mdx'),
  'switches': () => import('@/content/switches.mdx'),
}

interface ImmersiveViewProps {
  onExitImmersive: () => void;
}

export function ImmersiveView({ onExitImmersive }: ImmersiveViewProps) {
  const activeModule = useConfigStore((s) => s.activeModule)
  const moduleDef = MODULE_REGISTRY.find((m) => m.id === activeModule)
  const slug = moduleDef?.tutorialSlug ?? activeModule

  const MdxContent = useMemo(() => {
    const loader = MDX_LOADERS[slug]
    if (!loader) return null
    return lazy(loader)
  }, [slug])

  return (
    <EditorContext.Provider value={{ isImmersive: true }}>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-2xl">
          <button
            onClick={onExitImmersive}
            className="mb-4 text-sm text-blue-500 hover:text-blue-700"
          >
            ← 返回面板模式
          </button>
          <div className="prose prose-sm max-w-none">
            {MdxContent ? (
              <Suspense fallback={<div className="text-gray-400">加载教程...</div>}>
                <MdxContent />
              </Suspense>
            ) : (
              <p className="text-gray-400">暂无此模块的教程内容</p>
            )}
          </div>
        </div>
      </div>
    </EditorContext.Provider>
  )
}
```

注意：`MDX_LOADERS` 在 TutorialPanel 和 ImmersiveView 中重复。应提取到共享文件 `src/data/tutorial-loaders.ts`。在实现时统一处理。

- [ ] **Step 2: Commit**

```bash
git add src/features/editor/ImmersiveView.tsx
git commit -m "feat(editor): create ImmersiveView for tutorial-first mode

Wraps MDX content with EditorContext isImmersive=true,
enabling ConfigSlot to render embedded config components."
```

---

### Task 25: 更新 EditorPage 布局

**Files:**
- Modify: `src/app/editor/EditorPage.tsx`

- [ ] **Step 1: 集成教程面板和模式切换**

完整替换 `EditorPage.tsx`：

```tsx
import { EditorSidebar } from '@/features/editor/EditorSidebar'
import { EditorContent } from '@/features/editor/EditorContent'
import { TutorialPanel } from '@/features/editor/TutorialPanel'
import { ImmersiveView } from '@/features/editor/ImmersiveView'
import { EditorContext } from '@/features/editor/EditorContext'
import { ImportDialog } from '@/features/share/ImportDialog'
import { ExportButton } from '@/features/share/ExportButton'
import { ShareDialog } from '@/features/share/ShareDialog'
import { GistDialog } from '@/features/share/GistDialog'
import { PRESETS } from '@/data/presets'
import { useConfigStore } from '@/stores/config-store'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

export function EditorPage() {
  const loadProject = useConfigStore((s) => s.loadProject)
  const editorUI = useConfigStore((s) => s.editorUI)
  const setViewMode = useConfigStore((s) => s.setViewMode)
  const setTutorialCollapsed = useConfigStore((s) => s.setTutorialCollapsed)

  function handlePresetChange(presetId: string) {
    const preset = PRESETS.find((p) => p.id === presetId)
    if (preset) loadProject(preset.createProject())
  }

  return (
    <div className="flex h-[calc(100vh-57px)] flex-col">
      <div className="flex items-center justify-between border-b px-6 py-2">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">配置编辑器</span>
          <Select onValueChange={handlePresetChange}>
            <SelectTrigger className="h-8 w-40 text-sm">
              <SelectValue placeholder="加载预设..." />
            </SelectTrigger>
            <SelectContent>
              {PRESETS.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <ShareDialog />
          <ImportDialog />
          <ExportButton />
          <GistDialog />
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <EditorSidebar />
        {editorUI.viewMode === 'immersive' ? (
          <ImmersiveView onExitImmersive={() => setViewMode('panel')} />
        ) : (
          <EditorContext.Provider value={{ isImmersive: false }}>
            <EditorContent />
            <TutorialPanel
              collapsed={editorUI.tutorialCollapsed}
              onToggleCollapse={() => setTutorialCollapsed(!editorUI.tutorialCollapsed)}
              onEnterImmersive={() => setViewMode('immersive')}
            />
          </EditorContext.Provider>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 验证编译和界面渲染**

Run: `npx tsc --noEmit && npm run dev`

在浏览器中验证：
1. 面板模式三栏布局正确
2. 点击「沉浸模式 →」切换生效
3. 点击「← 返回面板模式」切换回来
4. 教程面板可收起/展开

- [ ] **Step 3: Commit**

```bash
git add src/app/editor/EditorPage.tsx
git commit -m "feat(editor): integrate tutorial panel and immersive mode into EditorPage

Three-column panel mode (sidebar + config + tutorial).
Immersive mode with embedded config components.
Toggle between modes via store state."
```

---

### Task 26: 迁移 MDX 中的 GoToConfigButton → ConfigSlot

**Files:**
- Modify: `src/content/*.mdx`（8 个现有文件中使用 `GoToConfigButton` 的）

- [ ] **Step 1: 在每个 MDX 文件中替换**

将每个 MDX 文件末尾的：
```mdx
<GoToConfigButton module="xxx" label="在编辑器中配置xxx" />
```
替换为：
```mdx
<ConfigSlot module="xxx" />
```

需要在 MDX 组件注册中添加 `ConfigSlot`。

- [ ] **Step 2: 在 mdx-components 中注册 ConfigSlot**

确保 MDX 渲染时可以使用 `ConfigSlot` 组件。在 `src/components/shared/mdx-components.tsx` 中导入并注册。

- [ ] **Step 3: 验证 docs 页面仍能正常渲染**

Run: `npm run dev`，访问 `/docs/schema-manager` 等页面确认无报错。

- [ ] **Step 4: Commit**

```bash
git add src/content/*.mdx src/components/shared/mdx-components.tsx
git commit -m "refactor(mdx): replace GoToConfigButton with ConfigSlot in all tutorials

ConfigSlot renders embedded config in immersive mode,
link button in panel/docs mode."
```

---

### Task 27: 编写新模块的 MDX 教程

**Files:**
- Create: 7 个新 MDX 文件（见 File Map）

- [ ] **Step 1: 为每个新模块编写对应的 MDX 教程**

每个 MDX 教程遵循现有格式：
1. 概念解释
2. 配置项说明 + YAML 示例
3. 常见搭配/用例
4. `<ConfigSlot module="xxx" />`

内容参考万象拼音 README 和 schema.yaml 中的注释。

- [ ] **Step 2: 在 tutorial-nav.ts 中添加新教程导航项**

更新 `src/data/tutorial-nav.ts`，在对应分组中添加新教程的导航入口。

- [ ] **Step 3: 在 TutorialPanel 和 ImmersiveView 的 MDX_LOADERS 中添加新条目**

（或者如果已提取到共享文件 `tutorial-loaders.ts`，更新该文件即可）

- [ ] **Step 4: Commit**

```bash
git add src/content/*.mdx src/data/tutorial-nav.ts
git commit -m "docs: add MDX tutorials for 7 new config modules

spelling-scheme, auxiliary-code-config, reverse-lookup,
special-input, lua-extensions, candidate-display, comment-hints."
```

---

## Phase 4: 收尾

### Task 28: 更新预设配置

**Files:**
- Modify: `src/data/presets.ts`

- [ ] **Step 1: 更新万象预设**

在万象预设的 `createProject` 中填充新配置字段：

```typescript
{
  id: 'wanxiang',
  name: '万象拼音推荐',
  description: '万象拼音方案 + 9候选 + 辅助码 + 推荐设置',
  createProject() {
    const p = createEmptyProject()
    p.defaultConfig.schemaList = [{ schema: 'wanxiang' }]
    p.defaultConfig.pageSize = 9
    p.defaultConfig.asciiComposer.switchKey.shiftL = 'commit_code'
    p.schemaConfigs['wanxiang'] = {
      schemaId: 'wanxiang',
      fuzzyRules: [],
      translator: {
        enableCompletion: true,
        enableUserDict: false,
        coreWordLength: 4,
        maxWordLength: 7,
        maxHomophones: 8,
        maxHomographs: 8,
        spellingHints: 30,
        alwaysShowComments: true,
      },
      auxiliaryCode: {
        scheme: 'zrm',
        triggerMode: 'direct',
        hintEnabled: true,
        hintLength: 1,
        splitHintEnabled: false,
      },
    }
    p.platformConfig.appOptions = {
      'com.apple.Terminal': { asciiMode: true },
      'com.microsoft.VSCode': { asciiMode: true },
    }
    return p
  },
},
```

- [ ] **Step 2: Commit**

```bash
git add src/data/presets.ts
git commit -m "feat(presets): enrich Wanxiang preset with translator and auxiliary code config"
```

---

### Task 29: 全量测试与验证

- [ ] **Step 1: 运行全部测试**

Run: `npx vitest run`

Expected: 所有测试通过。

- [ ] **Step 2: TypeScript 类型检查**

Run: `npx tsc --noEmit`

Expected: 无错误。

- [ ] **Step 3: 构建验证**

Run: `npm run build`

Expected: 构建成功。

- [ ] **Step 4: 手动功能验证**

Run: `npm run dev`

验证清单：
1. 选择朙月拼音预设 → 侧边栏只显示通用模块（约 10 个）
2. 选择万象拼音预设 → 侧边栏显示全部 15 个模块
3. 点击「查看所有模块」→ 显示锁定模块
4. 各模块配置表单功能正常，修改后 YAML Tab 同步
5. 教程面板跟随模块切换
6. 沉浸模式 ↔ 面板模式切换正常
7. 导入/导出功能不受影响

- [ ] **Step 5: 最终 Commit**

```bash
git commit -m "chore: verify all tests pass and build succeeds"
```
