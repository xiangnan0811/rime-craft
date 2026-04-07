# Rime Craft Phase 2 Implementation Plan

## Context

Phase 1 MVP is complete: 5 editor modules (schema, candidates, keys, fuzzy, ascii-mode), import/export, 3 presets, home page. 25 tests, 535KB bundle, clean build. Phase 2 adds the remaining 3 editor modules, CodeMirror YAML editing with dual-sync, MDX tutorial system with bidirectional linking, config diff marking, and more presets.

## Phase 2 Scope (design spec section 11)

1. 3 remaining editor modules: 标点符号映射, 词典管理, 开关与杂项
2. CodeMirror 6 YAML editing mode with form↔YAML dual-sync
3. MDX tutorial content (入门指南 + 配置详解)
4. Editor ↔ tutorial bidirectional linking
5. Config merge strategy (diff markers for modified fields)
6. More presets

---

## Task 1: Extend Data Model + Static Data

**Why:** 3 new modules need new types and static data definitions before any UI.

**Files to modify:**
- `src/types/config.ts`

**Files to create:**
- `src/data/switch-definitions.ts` — predefined switch items (emoji, simplification, etc.)
- `src/data/punctuation-defaults.ts` — default Chinese punctuation mappings

### Type changes in `src/types/config.ts`

```typescript
// Extend EditorModule with 3 new values:
export type EditorModule =
  | 'schema-manager' | 'candidate-settings' | 'key-bindings'
  | 'fuzzy-pinyin' | 'ascii-mode'
  | 'punctuation' | 'dictionary' | 'switches';

// Add punctuator config:
export interface PunctuatorConfig {
  halfShape: Record<string, string | string[]>;
  // fullShape omitted for MVP — halfShape covers 99% of use cases
}

// Add switch item (matches Rime's switches YAML structure):
export interface SwitchItem {
  name: string;           // e.g., 'emoji', 'simplification'
  reset: number;          // default state: 0=off, 1=on
  states?: [string, string]; // [off_label, on_label], e.g., ['中', '英']
}

// Extend SchemaConfig (new fields OPTIONAL for backward compat):
export interface SchemaConfig {
  schemaId: string;
  fuzzyRules: FuzzyRuleState[];
  switches?: SwitchItem[];
  punctuator?: PunctuatorConfig;
}
```

### `src/data/switch-definitions.ts`

Predefined switches with display info (like `FUZZY_RULE_DEFINITIONS` for fuzzy pinyin):

```typescript
export interface SwitchDefinition {
  name: string;
  label: string;        // UI display name
  description: string;
  defaultReset: number;
  states: [string, string];
}

export const SWITCH_DEFINITIONS: SwitchDefinition[] = [
  { name: 'emoji', label: 'Emoji', description: '输入时显示 Emoji 候选', defaultReset: 1, states: ['关', '开'] },
  { name: 'simplification', label: '简繁转换', description: '输出简体/繁体中文', defaultReset: 1, states: ['漢字', '汉字'] },
  { name: 'full_shape', label: '全角/半角', description: '全角模式输出全角字符', defaultReset: 0, states: ['半角', '全角'] },
  { name: 'ascii_punct', label: '中英标点', description: '切换中文标点和英文标点', defaultReset: 0, states: ['中文', '英文'] },
]
```

### `src/data/punctuation-defaults.ts`

Default half-shape punctuation mapping (standard Chinese):

```typescript
export const DEFAULT_HALF_SHAPE: Record<string, string | string[]> = {
  ',': '，', '.': '。', '<': '《', '>': '》',
  '/': ['/', '÷'], '?': '？', ';': '；', ':': '：',
  "'": [''', '''], '"': ['\u201c', '\u201d'],
  '\\': ['、', '\\'], '|': ['·', '|', '｜'],
  '!': '！', '@': '@', '#': '#',
  '%': ['%', '％'], '^': '……', '&': '&',
  '*': ['*', '×'], '(': '（', ')': '）',
  '-': '-', '_': '——', '+': '+', '=': '=',
  '[': ['「', '【'], ']': ['」', '】'],
  '{': '『', '}': '』',
}
```

---

## Task 2: Extend Parser, Serializer, Store

**Why:** Parsing/serializing the new config sections, handling custom_phrase.txt (TSV format), and new store actions.

**Files to modify:**
- `src/lib/yaml/parser.ts` — add `mapToSchemaConfig`
- `src/lib/yaml/parser.test.ts` — new tests
- `src/lib/yaml/serializer.ts` — add `serializeSchemaConfig`
- `src/lib/yaml/serializer.test.ts` — new tests
- `src/stores/config-store.ts` — new actions
- `src/stores/config-store.test.ts` — new tests
- `src/features/share/importer.ts` — handle schema YAML + custom_phrase.txt
- `src/features/share/ExportButton.tsx` — export switches/punctuator + custom_phrase.txt

**Files to create:**
- `src/lib/config/custom-phrase.ts` — parse/serialize `custom_phrase.txt` (TSV format)
- `src/lib/config/custom-phrase.test.ts`

### custom_phrase.txt format

```
# Rime custom phrase
# <text>\t<code>\t<weight>
直接	zhijie	1
输入法	shurufa	2
```

Parser: split lines, skip `#` comments and empty lines, split by `\t`.
Serializer: join with `\t`, prepend header comment.

### New parser function: `mapToSchemaConfig`

Extracts `switches` and `punctuator` from expanded schema patch. (Fuzzy rules are already handled via `FuzzyRuleState` — that logic stays separate since it's algebra expressions, not structured data.)

### New store actions

```typescript
// Switches
setSwitches(schemaId: string, switches: SwitchItem[]): void
// Punctuation
setPunctuator(schemaId: string, punctuator: PunctuatorConfig): void
// Custom phrases
addCustomPhrase(phrase: CustomPhrase): void
removeCustomPhrase(index: number): void
updateCustomPhrase(index: number, phrase: CustomPhrase): void
setCustomPhrases(phrases: CustomPhrase[]): void  // for bulk import
```

### Import flow update

`importFromFiles` needs to:
- Detect `custom_phrase.txt` by filename → parse TSV → `project.customPhrases`
- Detect `<schema>.custom.yaml` (not default/squirrel/weasel) → extract switches + punctuator into `project.schemaConfigs`

### Export flow update

`ExportButton` needs to:
- Export `custom_phrase.txt` if `project.customPhrases.length > 0`
- Export switches + punctuator alongside fuzzy rules in schema YAML

---

## Task 3: Three New Editor Modules + Sidebar Update

**Why:** Complete the 8-module editor coverage.

**Files to create:**
- `src/features/editor/modules/Punctuation.tsx`
- `src/features/editor/modules/Dictionary.tsx`
- `src/features/editor/modules/Switches.tsx`

**Files to modify:**
- `src/features/editor/EditorSidebar.tsx` — add 3 entries
- `src/features/editor/EditorContent.tsx` — wire 3 new components

### Punctuation module

Table UI: left column = key (e.g., `,`), right column = mapped output(s) (e.g., `，`). Each row editable. "重置为默认" button to restore `DEFAULT_HALF_SHAPE`.

### Dictionary module

- Table of custom phrases: text, code, weight columns
- Add row button
- Inline editing (click to edit)
- Delete button per row
- Search/filter input
- Bulk import: paste TSV text or upload custom_phrase.txt file
- Bulk export: download as custom_phrase.txt

### Switches module

Toggle list (like fuzzy pinyin module) using `SWITCH_DEFINITIONS`. Each toggle controls the `reset` value (0 or 1) for the primary schema.

---

## Task 4: CodeMirror YAML Editor + Dual-Sync

**Why:** Advanced users need raw YAML editing; form↔YAML sync is a design spec requirement.

**Install:** `@uiw/react-codemirror @codemirror/lang-yaml`

**Files to create:**
- `src/components/shared/YamlEditor.tsx` — CodeMirror 6 wrapper
- `src/features/editor/ModuleWrapper.tsx` — form/YAML mode tabs wrapping each module
- `src/lib/yaml/module-yaml.ts` — per-module YAML extract/apply
- `src/lib/yaml/module-yaml.test.ts`

### YamlEditor component

Props: `value: string`, `onChange: (value: string) => void`, `error?: string`

Key details:
- Use `@uiw/react-codemirror` which handles the controlled↔uncontrolled bridge
- 300ms debounce on `onChange` (internal to the component)
- Display error message below editor when YAML is invalid
- **Lazy loaded** via `React.lazy()` — CodeMirror is ~150KB, don't load until user switches to YAML mode

### ModuleWrapper

```tsx
<Tabs defaultValue="form">
  <TabsList>
    <TabsTrigger value="form">表单模式</TabsTrigger>
    <TabsTrigger value="yaml">YAML 模式</TabsTrigger>
  </TabsList>
  <TabsContent value="form">{children}</TabsContent>
  <TabsContent value="yaml">
    <Suspense fallback={<div>加载编辑器...</div>}>
      <YamlEditor value={yamlValue} onChange={handleYamlChange} error={parseError} />
    </Suspense>
  </TabsContent>
</Tabs>
```

### module-yaml.ts — per-module YAML mapping

Each module manages specific config keys. Define the mapping:

```typescript
const MODULE_KEY_MAP: Record<EditorModule, { file: string; keys: string[] }> = {
  'schema-manager': { file: 'default', keys: ['schema_list'] },
  'candidate-settings': { file: 'default', keys: ['menu'] },
  'key-bindings': { file: 'default', keys: ['ascii_composer', 'key_binder'] },
  'fuzzy-pinyin': { file: 'schema', keys: ['speller'] },
  'ascii-mode': { file: 'platform', keys: ['app_options'] },
  'punctuation': { file: 'schema', keys: ['punctuator'] },
  'dictionary': { file: 'custom_phrase', keys: [] }, // special: TSV, not YAML
  'switches': { file: 'schema', keys: ['switches'] },
}
```

Functions:
- `extractModuleYaml(module, project)` → YAML string for that module's section
- `applyModuleYaml(module, yamlString, project)` → updated project (or error)

### Sync flow with anti-loop guard

```
Form edit → store.update() → extractModuleYaml() → set yamlValue
                                                      ↕ (guard: skip if source is yaml)
YAML edit → 300ms debounce → parse → applyModuleYaml() → store.update()
                                                      ↕ (guard: skip if source is form)
```

Use a `sourceRef` to track which mode triggered the last update, preventing infinite loops.

---

## Task 5: MDX Tutorial Framework

**Why:** Tutorial system with routing, layout, and interactive MDX components.

**Install:** `@mdx-js/rollup @mdx-js/react remark-gfm`

**Files to create:**
- `src/mdx.d.ts` — TypeScript declaration for `.mdx` imports
- `src/app/docs/DocsLayout.tsx` — sidebar nav + content area
- `src/app/docs/DocsPage.tsx` — dynamic MDX loader
- `src/data/tutorial-nav.ts` — tutorial navigation structure
- `src/components/shared/mdx-components.tsx` — MDX component overrides

**Files to modify:**
- `vite.config.ts` — add MDX plugin
- `src/App.tsx` — add `/docs/*` route with lazy loading

### Tutorial routing strategy

Use a data-driven approach with dynamic imports:

```typescript
// src/data/tutorial-nav.ts
export const TUTORIAL_NAV = [
  {
    title: '入门指南',
    items: [
      { slug: 'what-is-rime', title: 'Rime 是什么' },
      { slug: 'installation', title: '安装教程' },
      { slug: 'first-deploy', title: '第一次部署' },
      { slug: 'config-structure', title: '配置文件结构' },
    ],
  },
  {
    title: '配置详解',
    items: [
      { slug: 'schema-manager', title: '输入方案管理' },
      // ... one per module
    ],
  },
]
```

MDX files loaded via `import(`@/content/${slug}.mdx`)` with `React.lazy()` for per-page code splitting.

---

## Task 6: Tutorial Content

**Why:** Core educational content. Phase 2 focuses on 入门指南 (4 articles) + 配置详解 (8 articles).

**Files to create under `src/content/`:**
- `what-is-rime.mdx` — Rime 介绍, 为什么选择 Rime
- `installation.mdx` — 各平台安装 (鼠须管/小狼毫/ibus-rime/fcitx-rime/同文/仓)
- `first-deploy.mdx` — 第一次部署和基本使用
- `config-structure.mdx` — 配置文件在哪里, 目录结构, .custom.yaml 机制
- `schema-manager.mdx` — 输入方案管理详解
- `candidate-settings.mdx` — 候选词设置详解
- `key-bindings.mdx` — 按键绑定详解
- `fuzzy-pinyin.mdx` — 模糊音配置详解
- `ascii-mode.mdx` — 中英文切换详解
- `punctuation.mdx` — 标点映射详解
- `dictionary.mdx` — 自定义词库详解
- `switches.mdx` — 开关与杂项详解

Each config-guide article structure: 概念解释 → 配置项说明 → 常见搭配 → `<GoToConfig>` 按钮。

Skeleton content (200-400 words per article) with key sections filled in. Full content can be iteratively improved.

---

## Task 7: Editor ↔ Tutorial Linking

**Why:** Key differentiator — seamless navigation between learning and configuring.

**Files to create:**
- `src/components/shared/LearnMoreLink.tsx` — "📖 了解更多" used in editor modules
- `src/components/shared/GoToConfigButton.tsx` — "🔧 去配置" used in tutorials
- `src/features/editor/TutorialDrawer.tsx` — slide-out drawer showing tutorial content

### LearnMoreLink

Renders a small link. Click → opens TutorialDrawer with the relevant tutorial section. Props: `module: EditorModule`.

### TutorialDrawer

Uses shadcn `Dialog` or a custom slide-over panel. Loads the relevant MDX content via dynamic import. Shows on the right side, doesn't disrupt editor state.

### GoToConfigButton

Renders a button in tutorials. Click → navigates to `/editor` and sets `activeModule` via store. Props: `module: EditorModule`.

**Files to modify:**
- All 8 editor module files — add `<LearnMoreLink>` near section headers
- Tutorial MDX files — add `<GoToConfigButton>` components

---

## Task 8: Config Diff Marking + More Presets

**Why:** Visual feedback for modified settings; more presets for common user profiles.

**Files to create:**
- `src/lib/config/diff.ts` — `getModifiedFields(config, defaults)` → `Set<string>` of changed field paths
- `src/lib/config/diff.test.ts`
- `src/components/shared/ModifiedBadge.tsx` — small dot/badge indicating "differs from default"

**Files to modify:**
- `src/data/presets.ts` — add 2 more presets:
  - 万象拼音推荐 (wanxiang + 辅助码 + 9 candidates)
  - 五笔经典 (wubi86 + 标准设置)
- Select editor modules — add `<ModifiedBadge>` next to key fields

### Diff logic

```typescript
export function getModifiedFields(
  current: DefaultConfig,
  defaults: DefaultConfig,
): Set<string> {
  // Compare each field, return paths like 'pageSize', 'asciiComposer.switchKey.shiftL'
}
```

The `ModifiedBadge` shows a small blue dot next to fields that differ from the default. Driven by the diff set from the store.

---

## Task Dependency Order

```
Task 1 (types + data) → Task 2 (parser/serializer/store) → Task 3 (3 modules)
                                                           ↘
Task 4 (CodeMirror + dual-sync) — depends on Task 2 for module-yaml mapping
                                                           
Task 5 (MDX framework) → Task 6 (content) → Task 7 (linking)

Task 8 (diff + presets) — independent, can go anywhere after Task 2
```

Suggested execution order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

---

## Verification

After all tasks:
1. `npx tsc -b` — clean
2. `npx vitest run` — all tests pass (old + new)
3. `npx vite build` — succeeds (check bundle size with lazy loading)
4. Manual: navigate all 8 modules, verify form editing works
5. Manual: toggle YAML mode, edit YAML, verify form syncs back
6. Manual: browse tutorials at `/docs/*`, click "了解更多" from editor, click "去配置" from tutorial
7. Manual: import config → see modified badges → export with all config types
8. Manual: load preset → see switches/punctuation populated
