# Rime Craft Phase 1 MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working web-based Rime configuration editor that can import existing configs, visually edit the 5 highest-frequency settings modules, and export valid `.custom.yaml` file packages.

**Architecture:** Pure frontend SPA with zero backend. Internal TypeScript data model is the single source of truth — YAML files are parsed into this model on import, and serialized back on export. Zustand manages application state. A mapping layer handles the snake_case (Rime YAML) ↔ camelCase (TypeScript) conversion and Rime's `/`-path patch syntax.

**Tech Stack:** Vite 6, React 18, TypeScript 5, React Router v7, Zustand, Shadcn/ui + Tailwind CSS, yaml (eemeli/yaml), JSZip, file-saver, Vitest + Testing Library

---

## File Structure

```
rime-craft/
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── vitest.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── components.json                        # shadcn/ui config
├── public/
│   └── favicon.svg
├── src/
│   ├── main.tsx                           # React entry
│   ├── App.tsx                            # Router setup
│   ├── index.css                          # Tailwind directives + shadcn vars
│   ├── types/
│   │   └── config.ts                      # All data model interfaces
│   ├── lib/
│   │   ├── yaml/
│   │   │   ├── parser.ts                  # YAML string → patch object → typed model
│   │   │   ├── parser.test.ts
│   │   │   ├── serializer.ts              # Typed model → patch object → YAML string
│   │   │   └── serializer.test.ts
│   │   └── config/
│   │       ├── defaults.ts                # Default config values
│   │       └── defaults.test.ts
│   ├── data/
│   │   ├── schema-registry.ts             # Schema metadata (names, descriptions)
│   │   ├── fuzzy-rules.ts                 # Fuzzy pinyin rule definitions
│   │   └── presets.ts                     # 3 preset configurations
│   ├── stores/
│   │   ├── config-store.ts                # Zustand store
│   │   └── config-store.test.ts
│   ├── components/
│   │   ├── ui/                            # shadcn/ui primitives (auto-generated)
│   │   └── shared/
│   │       └── CandidatePreview.tsx        # Static candidate box preview
│   ├── app/
│   │   ├── layout/
│   │   │   └── AppLayout.tsx              # Shell: header + content area
│   │   ├── home/
│   │   │   └── HomePage.tsx               # Landing page
│   │   └── editor/
│   │       └── EditorPage.tsx             # Editor layout: sidebar + content
│   └── features/
│       ├── editor/
│       │   ├── EditorSidebar.tsx           # Left nav for 5 modules
│       │   ├── EditorContent.tsx           # Module router
│       │   └── modules/
│       │       ├── SchemaManager.tsx       # 1. Input schema management
│       │       ├── CandidateSettings.tsx   # 2. Candidate word settings
│       │       ├── KeyBindings.tsx         # 3. Key binding configuration
│       │       ├── FuzzyPinyin.tsx         # 4. Fuzzy pinyin rules
│       │       └── AsciiMode.tsx           # 5. ASCII mode & app settings
│       └── share/
│           ├── ImportDialog.tsx            # File upload + YAML paste
│           ├── ExportButton.tsx            # Zip download
│           └── importer.ts                # Import logic (parse files)
└── docs/                                  # (existing) design specs
```

---

## Task 1: Project Scaffold & Tooling

**Files:**
- Create: `package.json`, `index.html`, `vite.config.ts`, `vitest.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `tailwind.config.ts`, `postcss.config.js`, `src/main.tsx`, `src/index.css`, `src/App.tsx`

- [ ] **Step 1: Initialize project and install dependencies**

```bash
cd /Users/weibo/Code/rime-craft
npm init -y
npm install react@18 react-dom@18 react-router-dom@7 zustand yaml jszip file-saver
npm install -D vite @vitejs/plugin-react typescript @types/react @types/react-dom \
  @types/file-saver tailwindcss postcss autoprefixer \
  vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event \
  happy-dom @vitejs/plugin-react
```

- [ ] **Step 2: Create vite.config.ts**

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 3: Create vitest.config.ts**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 4: Create test setup file**

```typescript
// src/test-setup.ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 5: Create tsconfig files**

```json
// tsconfig.json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

```json
// tsconfig.app.json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"]
}
```

```json
// tsconfig.node.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true
  },
  "include": ["vite.config.ts", "vitest.config.ts"]
}
```

- [ ] **Step 6: Initialize Tailwind CSS**

```bash
npx tailwindcss init -p
```

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
}

export default config
```

- [ ] **Step 7: Create index.html and entry files**

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Rime Craft</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

```tsx
// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

```tsx
// src/App.tsx
export function App() {
  return <div className="min-h-screen bg-gray-50">Rime Craft</div>
}
```

- [ ] **Step 8: Initialize shadcn/ui**

```bash
npx shadcn@latest init
```

When prompted: style=default, base-color=neutral, CSS variables=yes.

Then install the components we need:

```bash
npx shadcn@latest add button card checkbox dialog input label select \
  separator switch tabs textarea tooltip badge scroll-area
```

- [ ] **Step 9: Add npm scripts to package.json**

Add to `package.json` scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 10: Verify scaffold works**

Run: `npm run dev`
Expected: Dev server starts, page shows "Rime Craft" text.

Run: `npm test`
Expected: No tests found (0 tests), exits cleanly.

- [ ] **Step 11: Create directory structure**

```bash
mkdir -p src/{types,lib/{yaml,config},data,stores,components/{ui,shared},app/{layout,home,editor},features/{editor/modules,share}}
```

- [ ] **Step 12: Commit**

```bash
git init
echo "node_modules\ndist\n.DS_Store" > .gitignore
git add -A
git commit -m "chore: scaffold project with Vite, React, TypeScript, Tailwind, shadcn/ui"
```

---

## Task 2: TypeScript Data Model

**Files:**
- Create: `src/types/config.ts`

- [ ] **Step 1: Define all data model types**

```typescript
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

// ─── Editor UI state ────────────────────────────────────

export type EditorModule =
  | 'schema-manager'
  | 'candidate-settings'
  | 'key-bindings'
  | 'fuzzy-pinyin'
  | 'ascii-mode';
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/types/config.ts
git commit -m "feat: define TypeScript data model for Rime config"
```

---

## Task 3: Static Data & Default Values

**Files:**
- Create: `src/data/schema-registry.ts`, `src/data/fuzzy-rules.ts`, `src/lib/config/defaults.ts`, `src/lib/config/defaults.test.ts`

- [ ] **Step 1: Create schema registry**

```typescript
// src/data/schema-registry.ts
export interface SchemaInfo {
  id: string;
  name: string;
  description: string;
  type: 'full_pinyin' | 'double_pinyin' | 'shape' | 'mixed';
}

export const SCHEMA_REGISTRY: SchemaInfo[] = [
  {
    id: 'rime_ice',
    name: '雾凇拼音',
    description: '功能齐全的全拼方案，词库丰富，社区活跃',
    type: 'full_pinyin',
  },
  {
    id: 'double_pinyin_flypy',
    name: '小鹤双拼',
    description: '最流行的双拼方案之一，键位分布合理',
    type: 'double_pinyin',
  },
  {
    id: 'wanxiang',
    name: '万象拼音',
    description: '新一代拼音方案，支持直接辅助码',
    type: 'full_pinyin',
  },
  {
    id: 'luna_pinyin',
    name: '朙月拼音',
    description: 'Rime 内置全拼方案，轻量稳定',
    type: 'full_pinyin',
  },
  {
    id: 'double_pinyin',
    name: '自然码双拼',
    description: '经典双拼方案',
    type: 'double_pinyin',
  },
  {
    id: 'double_pinyin_mspy',
    name: '微软双拼',
    description: '微软拼音使用的双拼方案',
    type: 'double_pinyin',
  },
  {
    id: 'wubi86',
    name: '五笔86',
    description: '经典五笔字型方案',
    type: 'shape',
  },
  {
    id: 'cangjie5',
    name: '仓颉五代',
    description: '经典形码方案',
    type: 'shape',
  },
]
```

- [ ] **Step 2: Create fuzzy pinyin rule definitions**

```typescript
// src/data/fuzzy-rules.ts
export interface FuzzyRuleDefinition {
  id: string;
  label: string;
  description: string;
  category: 'initial' | 'final';
  /** Rime speller/algebra expressions to add when this rule is enabled */
  algebraRules: string[];
}

export const FUZZY_RULE_DEFINITIONS: FuzzyRuleDefinition[] = [
  // ── Initials (声母) ──
  {
    id: 'z_zh',
    label: 'z ↔ zh',
    description: '平翘舌：子/知不分',
    category: 'initial',
    algebraRules: [
      'derive/^([zcs])h/$1/',
      'derive/^([zcs])([^h])/$1h$2/',
    ],
  },
  {
    id: 'c_ch',
    label: 'c ↔ ch',
    description: '平翘舌：此/吃不分',
    category: 'initial',
    algebraRules: [
      'derive/^([zcs])h/$1/',
      'derive/^([zcs])([^h])/$1h$2/',
    ],
  },
  {
    id: 's_sh',
    label: 's ↔ sh',
    description: '平翘舌：思/诗不分',
    category: 'initial',
    algebraRules: [
      'derive/^([zcs])h/$1/',
      'derive/^([zcs])([^h])/$1h$2/',
    ],
  },
  {
    id: 'l_n',
    label: 'l ↔ n',
    description: '南/兰不分',
    category: 'initial',
    algebraRules: ['derive/^l/n/', 'derive/^n/l/'],
  },
  {
    id: 'f_h',
    label: 'f ↔ h',
    description: '飞/灰不分',
    category: 'initial',
    algebraRules: ['derive/^f/h/', 'derive/^h/f/'],
  },
  {
    id: 'r_l',
    label: 'r ↔ l',
    description: '人/林不分',
    category: 'initial',
    algebraRules: ['derive/^r/l/', 'derive/^l/r/'],
  },
  // ── Finals (韵母) ──
  {
    id: 'an_ang',
    label: 'an ↔ ang',
    description: '前后鼻音：安/昂不分',
    category: 'final',
    algebraRules: ['derive/([ei])n$/$1ng/', 'derive/([ei])ng$/$1n/'],
  },
  {
    id: 'en_eng',
    label: 'en ↔ eng',
    description: '前后鼻音：恩/鞥不分',
    category: 'final',
    algebraRules: ['derive/([ei])n$/$1ng/', 'derive/([ei])ng$/$1n/'],
  },
  {
    id: 'in_ing',
    label: 'in ↔ ing',
    description: '前后鼻音：因/英不分',
    category: 'final',
    algebraRules: ['derive/([ei])n$/$1ng/', 'derive/([ei])ng$/$1n/'],
  },
  {
    id: 'ian_iang',
    label: 'ian ↔ iang',
    description: '前后鼻音：烟/央不分',
    category: 'final',
    algebraRules: ['derive/ian$/iang/', 'derive/iang$/ian/'],
  },
  {
    id: 'uan_uang',
    label: 'uan ↔ uang',
    description: '前后鼻音：弯/王不分',
    category: 'final',
    algebraRules: ['derive/uan$/uang/', 'derive/uang$/uan/'],
  },
]
```

- [ ] **Step 3: Create default config values**

```typescript
// src/lib/config/defaults.ts
import type { DefaultConfig, PlatformConfig, RimeProject } from '@/types/config'

export const DEFAULT_CONFIG: DefaultConfig = {
  schemaList: [{ schema: 'luna_pinyin' }],
  pageSize: 5,
  selectKeys: '1234567890',
  asciiComposer: {
    goodOldCapsLock: true,
    switchKey: {
      shiftL: 'inline_ascii',
      shiftR: 'commit_text',
      controlL: 'noop',
      controlR: 'noop',
      capsLock: 'clear',
    },
  },
  keyBinder: {
    bindings: [],
  },
}

export const DEFAULT_PLATFORM_CONFIG: PlatformConfig = {
  platform: 'macos',
  appOptions: {},
}

export function createEmptyProject(): RimeProject {
  return {
    targetPlatform: 'macos',
    defaultConfig: structuredClone(DEFAULT_CONFIG),
    platformConfig: structuredClone(DEFAULT_PLATFORM_CONFIG),
    schemaConfigs: {},
    customPhrases: [],
    preserved: {},
  }
}
```

- [ ] **Step 4: Write test for defaults**

```typescript
// src/lib/config/defaults.test.ts
import { describe, it, expect } from 'vitest'
import { createEmptyProject, DEFAULT_CONFIG } from './defaults'

describe('createEmptyProject', () => {
  it('returns a valid project with default values', () => {
    const project = createEmptyProject()
    expect(project.targetPlatform).toBe('macos')
    expect(project.defaultConfig.pageSize).toBe(5)
    expect(project.defaultConfig.schemaList).toHaveLength(1)
    expect(project.customPhrases).toEqual([])
  })

  it('returns a fresh copy each time (no shared references)', () => {
    const a = createEmptyProject()
    const b = createEmptyProject()
    a.defaultConfig.pageSize = 9
    expect(b.defaultConfig.pageSize).toBe(5)
  })
})
```

- [ ] **Step 5: Run test**

Run: `npx vitest run src/lib/config/defaults.test.ts`
Expected: 2 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/data/ src/lib/config/defaults.ts src/lib/config/defaults.test.ts
git commit -m "feat: add schema registry, fuzzy rule definitions, and default config values"
```

---

## Task 4: YAML Parsing (YAML → Model)

**Files:**
- Create: `src/lib/yaml/parser.ts`, `src/lib/yaml/parser.test.ts`

- [ ] **Step 1: Write failing tests for YAML parser**

```typescript
// src/lib/yaml/parser.test.ts
import { describe, it, expect } from 'vitest'
import {
  parseCustomYaml,
  expandPatchPaths,
  mapToDefaultConfig,
  mapToPlatformConfig,
  extractPreservedFields,
} from './parser'
import { DEFAULT_CONFIG, DEFAULT_PLATFORM_CONFIG } from '@/lib/config/defaults'

describe('parseCustomYaml', () => {
  it('extracts patch from valid custom yaml', () => {
    const yaml = `
patch:
  schema_list:
    - schema: luna_pinyin
    - schema: double_pinyin_flypy
  "menu/page_size": 9
`
    const result = parseCustomYaml(yaml)
    expect(result.patch).toBeDefined()
    expect(result.patch.schema_list).toHaveLength(2)
  })

  it('returns empty patch for invalid yaml', () => {
    const result = parseCustomYaml('not: valid: yaml: {{')
    expect(result.patch).toEqual({})
    expect(result.error).toBeDefined()
  })

  it('returns empty patch when no patch key', () => {
    const result = parseCustomYaml('some_key: value')
    expect(result.patch).toEqual({})
  })
})

describe('expandPatchPaths', () => {
  it('expands slash-delimited keys into nested objects', () => {
    const patch = { 'menu/page_size': 9, 'menu/alternative_select_keys': '123456789' }
    const expanded = expandPatchPaths(patch)
    expect(expanded).toEqual({
      menu: { page_size: 9, alternative_select_keys: '123456789' },
    })
  })

  it('preserves non-slash keys as-is', () => {
    const patch = { schema_list: [{ schema: 'luna_pinyin' }] }
    const expanded = expandPatchPaths(patch)
    expect(expanded).toEqual({ schema_list: [{ schema: 'luna_pinyin' }] })
  })

  it('merges flat path keys with nested object keys', () => {
    const patch = {
      ascii_composer: { good_old_caps_lock: true },
      'ascii_composer/switch_key/Shift_L': 'commit_code',
    }
    const expanded = expandPatchPaths(patch)
    expect(expanded.ascii_composer).toEqual({
      good_old_caps_lock: true,
      switch_key: { Shift_L: 'commit_code' },
    })
  })
})

describe('mapToDefaultConfig', () => {
  it('maps a full patch to DefaultConfig', () => {
    const patch = {
      schema_list: [{ schema: 'rime_ice' }, { schema: 'double_pinyin_flypy' }],
      menu: { page_size: 9, alternative_select_keys: 'ASDFGHJKL' },
      ascii_composer: {
        good_old_caps_lock: true,
        switch_key: {
          Shift_L: 'commit_code',
          Shift_R: 'inline_ascii',
          Control_L: 'noop',
          Control_R: 'noop',
          Caps_Lock: 'clear',
        },
      },
    }
    const config = mapToDefaultConfig(patch, DEFAULT_CONFIG)
    expect(config.schemaList).toEqual([
      { schema: 'rime_ice' },
      { schema: 'double_pinyin_flypy' },
    ])
    expect(config.pageSize).toBe(9)
    expect(config.selectKeys).toBe('ASDFGHJKL')
    expect(config.asciiComposer.switchKey.shiftL).toBe('commit_code')
  })

  it('falls back to defaults for missing fields', () => {
    const patch = { schema_list: [{ schema: 'rime_ice' }] }
    const config = mapToDefaultConfig(patch, DEFAULT_CONFIG)
    expect(config.pageSize).toBe(5) // default
    expect(config.asciiComposer.switchKey.shiftL).toBe('inline_ascii') // default
  })
})

describe('mapToPlatformConfig', () => {
  it('maps app_options to PlatformConfig', () => {
    const patch = {
      app_options: {
        'com.apple.Terminal': { ascii_mode: true },
        'com.microsoft.VSCode': { ascii_mode: true },
      },
    }
    const config = mapToPlatformConfig(patch, DEFAULT_PLATFORM_CONFIG)
    expect(config.appOptions['com.apple.Terminal']).toEqual({ asciiMode: true })
    expect(config.appOptions['com.microsoft.VSCode']).toEqual({ asciiMode: true })
  })
})

describe('extractPreservedFields', () => {
  it('extracts keys not in the known set', () => {
    const patch = {
      schema_list: [{ schema: 'luna_pinyin' }],
      menu: { page_size: 9 },
      some_unknown_key: 'value',
      'another/unknown': 42,
    }
    const knownBaseKeys = ['schema_list', 'menu', 'ascii_composer', 'key_binder', 'switcher']
    const preserved = extractPreservedFields(patch, knownBaseKeys)
    expect(preserved).toEqual({
      some_unknown_key: 'value',
      'another/unknown': 42,
    })
    expect(preserved.schema_list).toBeUndefined()
    expect(preserved.menu).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/yaml/parser.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement the parser**

```typescript
// src/lib/yaml/parser.ts
import { parse } from 'yaml'
import type {
  DefaultConfig,
  PlatformConfig,
  AsciiComposerConfig,
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
    const key = path[i]
    if (current[key] === undefined || typeof current[key] !== 'object') {
      current[key] = {}
    }
    current = current[key] as Record<string, unknown>
  }
  current[path[path.length - 1]] = value
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
    const baseKey = key.split('/')[0]
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
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/lib/yaml/parser.test.ts`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/yaml/parser.ts src/lib/yaml/parser.test.ts
git commit -m "feat: implement YAML parser with patch path expansion and config mapping"
```

---

## Task 5: YAML Serialization (Model → YAML)

**Files:**
- Create: `src/lib/yaml/serializer.ts`, `src/lib/yaml/serializer.test.ts`

- [ ] **Step 1: Write failing tests for serializer**

```typescript
// src/lib/yaml/serializer.test.ts
import { describe, it, expect } from 'vitest'
import { parse } from 'yaml'
import {
  serializeDefaultConfig,
  serializePlatformConfig,
  buildCustomYaml,
} from './serializer'
import { mapToDefaultConfig } from './parser'
import { DEFAULT_CONFIG, DEFAULT_PLATFORM_CONFIG } from '@/lib/config/defaults'

describe('serializeDefaultConfig', () => {
  it('serializes schema list and page size', () => {
    const config = {
      ...DEFAULT_CONFIG,
      schemaList: [{ schema: 'rime_ice' }, { schema: 'double_pinyin_flypy' }],
      pageSize: 9,
    }
    const patch = serializeDefaultConfig(config)
    expect(patch.schema_list).toEqual([
      { schema: 'rime_ice' },
      { schema: 'double_pinyin_flypy' },
    ])
    expect(patch['menu/page_size']).toBe(9)
  })

  it('serializes ascii composer switch keys', () => {
    const config = {
      ...DEFAULT_CONFIG,
      asciiComposer: {
        goodOldCapsLock: true,
        switchKey: {
          shiftL: 'commit_code' as const,
          shiftR: 'inline_ascii' as const,
          controlL: 'noop' as const,
          controlR: 'noop' as const,
          capsLock: 'clear' as const,
        },
      },
    }
    const patch = serializeDefaultConfig(config)
    expect(patch.ascii_composer).toEqual({
      good_old_caps_lock: true,
      switch_key: {
        Shift_L: 'commit_code',
        Shift_R: 'inline_ascii',
        Control_L: 'noop',
        Control_R: 'noop',
        Caps_Lock: 'clear',
      },
    })
  })
})

describe('serializePlatformConfig', () => {
  it('serializes app options', () => {
    const config = {
      ...DEFAULT_PLATFORM_CONFIG,
      appOptions: {
        'com.apple.Terminal': { asciiMode: true },
      },
    }
    const patch = serializePlatformConfig(config)
    expect(patch.app_options).toEqual({
      'com.apple.Terminal': { ascii_mode: true },
    })
  })
})

describe('buildCustomYaml', () => {
  it('wraps patch in a valid custom yaml structure', () => {
    const patch = { schema_list: [{ schema: 'rime_ice' }] }
    const yaml = buildCustomYaml(patch)
    const parsed = parse(yaml)
    expect(parsed.patch.schema_list).toEqual([{ schema: 'rime_ice' }])
  })
})

describe('round-trip: parse → serialize → parse', () => {
  it('preserves config through round-trip', () => {
    const original = {
      ...DEFAULT_CONFIG,
      schemaList: [{ schema: 'rime_ice' }],
      pageSize: 9,
      selectKeys: 'ASDFGHJKL',
    }
    const patch = serializeDefaultConfig(original)
    const yaml = buildCustomYaml(patch)
    const reparsed = parse(yaml)
    const { expandPatchPaths, mapToDefaultConfig: map } = require('./parser')
    const expanded = expandPatchPaths(reparsed.patch)
    const result = map(expanded, DEFAULT_CONFIG)
    expect(result.schemaList).toEqual(original.schemaList)
    expect(result.pageSize).toBe(original.pageSize)
    expect(result.selectKeys).toBe(original.selectKeys)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/yaml/serializer.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the serializer**

```typescript
// src/lib/yaml/serializer.ts
import { stringify } from 'yaml'
import type { DefaultConfig, PlatformConfig } from '@/types/config'

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

export function buildCustomYaml(
  patch: Record<string, unknown>,
  preserved?: Record<string, unknown>,
): string {
  const merged = preserved ? { ...preserved, ...patch } : patch
  return stringify({ patch: merged }, { lineWidth: 0 })
}
```

- [ ] **Step 4: Fix the round-trip test to use proper imports**

The round-trip test used `require()`. Replace it with a proper import-based test:

```typescript
// Replace the round-trip test block in serializer.test.ts with:
import { expandPatchPaths, mapToDefaultConfig } from './parser'

describe('round-trip: parse → serialize → parse', () => {
  it('preserves config through round-trip', () => {
    const original = {
      ...DEFAULT_CONFIG,
      schemaList: [{ schema: 'rime_ice' }],
      pageSize: 9,
      selectKeys: 'ASDFGHJKL',
    }
    const patch = serializeDefaultConfig(original)
    const yaml = buildCustomYaml(patch)
    const reparsed = parse(yaml)
    const expanded = expandPatchPaths(reparsed.patch)
    const result = mapToDefaultConfig(expanded, DEFAULT_CONFIG)
    expect(result.schemaList).toEqual(original.schemaList)
    expect(result.pageSize).toBe(original.pageSize)
    expect(result.selectKeys).toBe(original.selectKeys)
  })
})
```

- [ ] **Step 5: Run all YAML tests**

Run: `npx vitest run src/lib/yaml/`
Expected: All tests pass (parser + serializer).

- [ ] **Step 6: Commit**

```bash
git add src/lib/yaml/serializer.ts src/lib/yaml/serializer.test.ts
git commit -m "feat: implement YAML serializer with round-trip verification"
```

---

## Task 6: Zustand Config Store

**Files:**
- Create: `src/stores/config-store.ts`, `src/stores/config-store.test.ts`

- [ ] **Step 1: Write failing tests for the store**

```typescript
// src/stores/config-store.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useConfigStore } from './config-store'

describe('useConfigStore', () => {
  beforeEach(() => {
    useConfigStore.getState().reset()
  })

  it('initializes with default project', () => {
    const state = useConfigStore.getState()
    expect(state.project.defaultConfig.pageSize).toBe(5)
    expect(state.activeModule).toBe('schema-manager')
  })

  it('setActiveModule changes the active module', () => {
    useConfigStore.getState().setActiveModule('fuzzy-pinyin')
    expect(useConfigStore.getState().activeModule).toBe('fuzzy-pinyin')
  })

  it('updateDefaultConfig merges partial updates', () => {
    useConfigStore.getState().updateDefaultConfig({ pageSize: 9 })
    const state = useConfigStore.getState()
    expect(state.project.defaultConfig.pageSize).toBe(9)
    expect(state.project.defaultConfig.schemaList).toHaveLength(1) // unchanged
  })

  it('setSchemaList replaces the schema list', () => {
    useConfigStore.getState().setSchemaList([
      { schema: 'rime_ice' },
      { schema: 'double_pinyin_flypy' },
    ])
    expect(useConfigStore.getState().project.defaultConfig.schemaList).toEqual([
      { schema: 'rime_ice' },
      { schema: 'double_pinyin_flypy' },
    ])
  })

  it('setAppOption adds or updates an app option', () => {
    useConfigStore.getState().setAppOption('com.apple.Terminal', true)
    const opts = useConfigStore.getState().project.platformConfig.appOptions
    expect(opts['com.apple.Terminal']).toEqual({ asciiMode: true })
  })

  it('removeAppOption removes an app option', () => {
    useConfigStore.getState().setAppOption('com.apple.Terminal', true)
    useConfigStore.getState().removeAppOption('com.apple.Terminal')
    const opts = useConfigStore.getState().project.platformConfig.appOptions
    expect(opts['com.apple.Terminal']).toBeUndefined()
  })

  it('loadProject replaces entire project state', () => {
    const { createEmptyProject } = require('@/lib/config/defaults')
    const newProject = createEmptyProject()
    newProject.defaultConfig.pageSize = 7
    useConfigStore.getState().loadProject(newProject)
    expect(useConfigStore.getState().project.defaultConfig.pageSize).toBe(7)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/stores/config-store.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the store**

```typescript
// src/stores/config-store.ts
import { create } from 'zustand'
import type {
  RimeProject,
  DefaultConfig,
  SchemaListItem,
  FuzzyRuleState,
  EditorModule,
} from '@/types/config'
import { createEmptyProject } from '@/lib/config/defaults'

interface ConfigState {
  project: RimeProject;
  activeModule: EditorModule;
  isDirty: boolean;

  // Navigation
  setActiveModule: (module: EditorModule) => void;

  // Project-level
  loadProject: (project: RimeProject) => void;
  reset: () => void;
  setTargetPlatform: (platform: RimeProject['targetPlatform']) => void;

  // Default config
  updateDefaultConfig: (partial: Partial<DefaultConfig>) => void;
  setSchemaList: (schemas: SchemaListItem[]) => void;

  // Platform config
  setAppOption: (bundleId: string, asciiMode: boolean) => void;
  removeAppOption: (bundleId: string) => void;

  // Schema config
  setFuzzyRules: (schemaId: string, rules: FuzzyRuleState[]) => void;
}

export const useConfigStore = create<ConfigState>((set) => ({
  project: createEmptyProject(),
  activeModule: 'schema-manager',
  isDirty: false,

  setActiveModule: (module) => set({ activeModule: module }),

  loadProject: (project) => set({ project, isDirty: false }),

  reset: () =>
    set({
      project: createEmptyProject(),
      activeModule: 'schema-manager',
      isDirty: false,
    }),

  setTargetPlatform: (platform) =>
    set((s) => ({
      project: { ...s.project, targetPlatform: platform },
      isDirty: true,
    })),

  updateDefaultConfig: (partial) =>
    set((s) => ({
      project: {
        ...s.project,
        defaultConfig: { ...s.project.defaultConfig, ...partial },
      },
      isDirty: true,
    })),

  setSchemaList: (schemas) =>
    set((s) => ({
      project: {
        ...s.project,
        defaultConfig: { ...s.project.defaultConfig, schemaList: schemas },
      },
      isDirty: true,
    })),

  setAppOption: (bundleId, asciiMode) =>
    set((s) => ({
      project: {
        ...s.project,
        platformConfig: {
          ...s.project.platformConfig,
          appOptions: {
            ...s.project.platformConfig.appOptions,
            [bundleId]: { asciiMode },
          },
        },
      },
      isDirty: true,
    })),

  removeAppOption: (bundleId) =>
    set((s) => {
      const { [bundleId]: _, ...rest } = s.project.platformConfig.appOptions
      return {
        project: {
          ...s.project,
          platformConfig: { ...s.project.platformConfig, appOptions: rest },
        },
        isDirty: true,
      }
    }),

  setFuzzyRules: (schemaId, rules) =>
    set((s) => ({
      project: {
        ...s.project,
        schemaConfigs: {
          ...s.project.schemaConfigs,
          [schemaId]: {
            ...(s.project.schemaConfigs[schemaId] ?? { schemaId }),
            schemaId,
            fuzzyRules: rules,
          },
        },
      },
      isDirty: true,
    })),
}))
```

- [ ] **Step 4: Fix test imports**

Replace the `require()` call in the test with a proper import:

```typescript
// At top of config-store.test.ts, add:
import { createEmptyProject } from '@/lib/config/defaults'
// Remove the require() line in the loadProject test
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run src/stores/config-store.test.ts`
Expected: All 7 tests pass.

- [ ] **Step 6: Run all tests**

Run: `npx vitest run`
Expected: All tests across all files pass.

- [ ] **Step 7: Commit**

```bash
git add src/stores/
git commit -m "feat: implement Zustand config store with project state management"
```

---

## Task 7: App Shell, Routing & Layout

**Files:**
- Create: `src/app/layout/AppLayout.tsx`, `src/app/home/HomePage.tsx`, `src/app/editor/EditorPage.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create AppLayout with header**

```tsx
// src/app/layout/AppLayout.tsx
import { Link, Outlet } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-white px-6 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link to="/" className="text-xl font-bold">
            Rime Craft
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/editor">
              <Button variant="ghost">配置编辑器</Button>
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Create placeholder HomePage**

```tsx
// src/app/home/HomePage.tsx
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function HomePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20 text-center">
      <h1 className="mb-4 text-4xl font-bold">Rime Craft</h1>
      <p className="mb-8 text-lg text-gray-600">
        Rime 输入法可视化配置编辑器
      </p>
      <Link to="/editor">
        <Button size="lg">开始配置</Button>
      </Link>
    </div>
  )
}
```

- [ ] **Step 3: Create placeholder EditorPage**

```tsx
// src/app/editor/EditorPage.tsx
export function EditorPage() {
  return (
    <div className="flex h-[calc(100vh-57px)]">
      <div className="w-60 border-r bg-gray-50 p-4">
        <p className="text-sm text-gray-500">侧边栏</p>
      </div>
      <div className="flex-1 p-6">
        <p className="text-gray-500">编辑区域</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Set up React Router in App.tsx**

```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppLayout } from '@/app/layout/AppLayout'
import { HomePage } from '@/app/home/HomePage'
import { EditorPage } from '@/app/editor/EditorPage'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="editor" element={<EditorPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 5: Verify in browser**

Run: `npm run dev`
Expected: Home page shows with "Rime Craft" title and "开始配置" button. Clicking button navigates to `/editor` with sidebar + content area layout.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/app/
git commit -m "feat: add app shell with routing, layout, and placeholder pages"
```

---

## Task 8: Editor Sidebar & Content Router

**Files:**
- Create: `src/features/editor/EditorSidebar.tsx`, `src/features/editor/EditorContent.tsx`
- Modify: `src/app/editor/EditorPage.tsx`

- [ ] **Step 1: Create EditorSidebar**

```tsx
// src/features/editor/EditorSidebar.tsx
import { cn } from '@/lib/utils'
import { useConfigStore } from '@/stores/config-store'
import type { EditorModule } from '@/types/config'

const MODULES: { id: EditorModule; label: string }[] = [
  { id: 'schema-manager', label: '输入方案管理' },
  { id: 'candidate-settings', label: '候选词设置' },
  { id: 'key-bindings', label: '按键绑定' },
  { id: 'fuzzy-pinyin', label: '模糊音规则' },
  { id: 'ascii-mode', label: '中英文切换' },
]

export function EditorSidebar() {
  const activeModule = useConfigStore((s) => s.activeModule)
  const setActiveModule = useConfigStore((s) => s.setActiveModule)

  return (
    <nav className="w-60 border-r bg-gray-50">
      <div className="p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-500">配置模块</h2>
        <ul className="space-y-1">
          {MODULES.map((mod) => (
            <li key={mod.id}>
              <button
                onClick={() => setActiveModule(mod.id)}
                className={cn(
                  'w-full rounded-md px-3 py-2 text-left text-sm transition-colors',
                  activeModule === mod.id
                    ? 'bg-white font-medium text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100',
                )}
              >
                {mod.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Create EditorContent router**

```tsx
// src/features/editor/EditorContent.tsx
import { useConfigStore } from '@/stores/config-store'

// Placeholder components — will be replaced in Tasks 9-13
function Placeholder({ name }: { name: string }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-400">
      {name} — 待实现
    </div>
  )
}

export function EditorContent() {
  const activeModule = useConfigStore((s) => s.activeModule)

  const content: Record<string, React.ReactNode> = {
    'schema-manager': <Placeholder name="输入方案管理" />,
    'candidate-settings': <Placeholder name="候选词设置" />,
    'key-bindings': <Placeholder name="按键绑定" />,
    'fuzzy-pinyin': <Placeholder name="模糊音规则" />,
    'ascii-mode': <Placeholder name="中英文切换" />,
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mx-auto max-w-2xl">
        {content[activeModule]}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Wire into EditorPage**

```tsx
// src/app/editor/EditorPage.tsx
import { EditorSidebar } from '@/features/editor/EditorSidebar'
import { EditorContent } from '@/features/editor/EditorContent'

export function EditorPage() {
  return (
    <div className="flex h-[calc(100vh-57px)]">
      <EditorSidebar />
      <EditorContent />
    </div>
  )
}
```

- [ ] **Step 4: Verify in browser**

Run: `npm run dev`, navigate to `/editor`.
Expected: Left sidebar shows 5 module names. Clicking each changes the right content area to show the corresponding placeholder.

- [ ] **Step 5: Commit**

```bash
git add src/features/editor/EditorSidebar.tsx src/features/editor/EditorContent.tsx src/app/editor/EditorPage.tsx
git commit -m "feat: add editor sidebar navigation and content router"
```

---

## Task 9: Schema Manager Module

**Files:**
- Create: `src/features/editor/modules/SchemaManager.tsx`
- Modify: `src/features/editor/EditorContent.tsx`

- [ ] **Step 1: Implement SchemaManager**

```tsx
// src/features/editor/modules/SchemaManager.tsx
import { useConfigStore } from '@/stores/config-store'
import { SCHEMA_REGISTRY } from '@/data/schema-registry'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useState } from 'react'

export function SchemaManager() {
  const schemaList = useConfigStore((s) => s.project.defaultConfig.schemaList)
  const setSchemaList = useConfigStore((s) => s.setSchemaList)
  const [addingSchema, setAddingSchema] = useState('')

  const enabledIds = new Set(schemaList.map((s) => s.schema))
  const availableSchemas = SCHEMA_REGISTRY.filter((s) => !enabledIds.has(s.id))

  function handleAdd() {
    if (!addingSchema) return
    setSchemaList([...schemaList, { schema: addingSchema }])
    setAddingSchema('')
  }

  function handleRemove(schemaId: string) {
    setSchemaList(schemaList.filter((s) => s.schema !== schemaId))
  }

  function handleMoveUp(index: number) {
    if (index === 0) return
    const next = [...schemaList]
    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
    setSchemaList(next)
  }

  function handleMoveDown(index: number) {
    if (index === schemaList.length - 1) return
    const next = [...schemaList]
    ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
    setSchemaList(next)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">输入方案管理</h3>
        <p className="mt-1 text-sm text-gray-500">
          管理已启用的输入方案及其优先顺序。列表中排在前面的方案为默认方案。
        </p>
      </div>

      <div className="space-y-2">
        {schemaList.map((item, index) => {
          const info = SCHEMA_REGISTRY.find((s) => s.id === item.schema)
          return (
            <Card key={item.schema} className="flex items-center justify-between p-3">
              <div>
                <p className="font-medium">{info?.name ?? item.schema}</p>
                {info && (
                  <p className="text-sm text-gray-500">{info.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                >
                  ↑
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMoveDown(index)}
                  disabled={index === schemaList.length - 1}
                >
                  ↓
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(item.schema)}
                >
                  删除
                </Button>
              </div>
            </Card>
          )
        })}
      </div>

      {availableSchemas.length > 0 && (
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium">添加方案</label>
            <Select value={addingSchema} onValueChange={setAddingSchema}>
              <SelectTrigger>
                <SelectValue placeholder="选择方案..." />
              </SelectTrigger>
              <SelectContent>
                {availableSchemas.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAdd} disabled={!addingSchema}>
            添加
          </Button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Wire into EditorContent**

In `src/features/editor/EditorContent.tsx`, replace the `schema-manager` placeholder:

```tsx
import { SchemaManager } from './modules/SchemaManager'

// In the content record:
'schema-manager': <SchemaManager />,
```

- [ ] **Step 3: Verify in browser**

Navigate to `/editor`. The Schema Manager should show the default schema (朙月拼音) with move/delete buttons and an "添加方案" dropdown to add more schemas.

- [ ] **Step 4: Commit**

```bash
git add src/features/editor/modules/SchemaManager.tsx src/features/editor/EditorContent.tsx
git commit -m "feat: implement schema manager module with add/remove/reorder"
```

---

## Task 10: Candidate Settings Module

**Files:**
- Create: `src/features/editor/modules/CandidateSettings.tsx`
- Modify: `src/features/editor/EditorContent.tsx`

- [ ] **Step 1: Implement CandidateSettings**

```tsx
// src/features/editor/modules/CandidateSettings.tsx
import { useConfigStore } from '@/stores/config-store'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const PAGE_SIZE_OPTIONS = [3, 4, 5, 6, 7, 8, 9]

const SELECT_KEY_PRESETS: { label: string; value: string }[] = [
  { label: '数字键 1-9', value: '123456789' },
  { label: '数字键 1-0', value: '1234567890' },
  { label: '字母键 ASDFGHJKL', value: 'ASDFGHJKL' },
]

export function CandidateSettings() {
  const pageSize = useConfigStore((s) => s.project.defaultConfig.pageSize)
  const selectKeys = useConfigStore((s) => s.project.defaultConfig.selectKeys)
  const updateDefaultConfig = useConfigStore((s) => s.updateDefaultConfig)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">候选词设置</h3>
        <p className="mt-1 text-sm text-gray-500">
          设置候选词每页显示数量和选词按键。
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label>每页候选词数量</Label>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => updateDefaultConfig({ pageSize: Number(v) })}
          >
            <SelectTrigger className="mt-1 w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} 个
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-1 text-sm text-gray-500">
            建议 5-9 个，数量越多翻页越少，但候选框越大。
          </p>
        </div>

        <div>
          <Label>选词按键</Label>
          <Select
            value={
              SELECT_KEY_PRESETS.find((p) => p.value === selectKeys)
                ? selectKeys
                : 'custom'
            }
            onValueChange={(v) => {
              if (v !== 'custom') updateDefaultConfig({ selectKeys: v })
            }}
          >
            <SelectTrigger className="mt-1 w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SELECT_KEY_PRESETS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
              <SelectItem value="custom">自定义...</SelectItem>
            </SelectContent>
          </Select>

          {!SELECT_KEY_PRESETS.find((p) => p.value === selectKeys) && (
            <Input
              className="mt-2 w-64"
              value={selectKeys}
              onChange={(e) =>
                updateDefaultConfig({ selectKeys: e.target.value })
              }
              placeholder="输入选词按键序列"
            />
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Wire into EditorContent**

```tsx
import { CandidateSettings } from './modules/CandidateSettings'

// In the content record:
'candidate-settings': <CandidateSettings />,
```

- [ ] **Step 3: Verify and commit**

Run: `npm run dev`, navigate to editor, click "候选词设置".
Expected: Page size dropdown and select keys dropdown render and update state.

```bash
git add src/features/editor/modules/CandidateSettings.tsx src/features/editor/EditorContent.tsx
git commit -m "feat: implement candidate settings module"
```

---

## Task 11: Key Bindings Module

**Files:**
- Create: `src/features/editor/modules/KeyBindings.tsx`
- Modify: `src/features/editor/EditorContent.tsx`

- [ ] **Step 1: Implement KeyBindings**

```tsx
// src/features/editor/modules/KeyBindings.tsx
import { useConfigStore } from '@/stores/config-store'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type { SwitchKeyAction } from '@/types/config'

const SWITCH_KEY_OPTIONS: { value: SwitchKeyAction; label: string }[] = [
  { value: 'inline_ascii', label: '行内切换英文' },
  { value: 'commit_code', label: '提交编码并切换英文' },
  { value: 'commit_text', label: '提交文本并切换英文' },
  { value: 'clear', label: '清除编码并切换英文' },
  { value: 'noop', label: '无操作' },
]

const KEY_NAMES: {
  key: keyof ReturnType<typeof useConfigStore.getState>['project']['defaultConfig']['asciiComposer']['switchKey']
  label: string
  description: string
}[] = [
  { key: 'shiftL', label: '左 Shift', description: '按下左 Shift 键时的行为' },
  { key: 'shiftR', label: '右 Shift', description: '按下右 Shift 键时的行为' },
  { key: 'controlL', label: '左 Control', description: '按下左 Control 键时的行为' },
  { key: 'controlR', label: '右 Control', description: '按下右 Control 键时的行为' },
  { key: 'capsLock', label: 'Caps Lock', description: '按下 Caps Lock 键时的行为' },
]

export function KeyBindings() {
  const asciiComposer = useConfigStore(
    (s) => s.project.defaultConfig.asciiComposer,
  )
  const updateDefaultConfig = useConfigStore((s) => s.updateDefaultConfig)

  function handleSwitchKeyChange(
    key: keyof typeof asciiComposer.switchKey,
    value: SwitchKeyAction,
  ) {
    updateDefaultConfig({
      asciiComposer: {
        ...asciiComposer,
        switchKey: { ...asciiComposer.switchKey, [key]: value },
      },
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">按键绑定</h3>
        <p className="mt-1 text-sm text-gray-500">
          配置修饰键的中英文切换行为。
        </p>
      </div>

      <div className="space-y-4">
        {KEY_NAMES.map(({ key, label, description }) => (
          <div key={key}>
            <Label>{label}</Label>
            <Select
              value={asciiComposer.switchKey[key]}
              onValueChange={(v) =>
                handleSwitchKeyChange(key, v as SwitchKeyAction)
              }
            >
              <SelectTrigger className="mt-1 w-72">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SWITCH_KEY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          </div>
        ))}

        <div className="flex items-center gap-3 pt-2">
          <Switch
            checked={asciiComposer.goodOldCapsLock}
            onCheckedChange={(checked) =>
              updateDefaultConfig({
                asciiComposer: { ...asciiComposer, goodOldCapsLock: checked },
              })
            }
          />
          <div>
            <Label>传统 Caps Lock 行为</Label>
            <p className="text-sm text-gray-500">
              启用后 Caps Lock 切换大写锁定而非中英切换
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Wire into EditorContent**

```tsx
import { KeyBindings } from './modules/KeyBindings'

'key-bindings': <KeyBindings />,
```

- [ ] **Step 3: Verify and commit**

```bash
git add src/features/editor/modules/KeyBindings.tsx src/features/editor/EditorContent.tsx
git commit -m "feat: implement key bindings module for switch key behavior"
```

---

## Task 12: Fuzzy Pinyin Module

**Files:**
- Create: `src/features/editor/modules/FuzzyPinyin.tsx`
- Modify: `src/features/editor/EditorContent.tsx`

- [ ] **Step 1: Implement FuzzyPinyin**

```tsx
// src/features/editor/modules/FuzzyPinyin.tsx
import { useConfigStore } from '@/stores/config-store'
import { FUZZY_RULE_DEFINITIONS } from '@/data/fuzzy-rules'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import type { FuzzyRuleState } from '@/types/config'

export function FuzzyPinyin() {
  const schemaList = useConfigStore((s) => s.project.defaultConfig.schemaList)
  const schemaConfigs = useConfigStore((s) => s.project.schemaConfigs)
  const setFuzzyRules = useConfigStore((s) => s.setFuzzyRules)

  // Apply fuzzy rules to the first schema in the list (primary schema)
  const primarySchemaId = schemaList[0]?.schema ?? ''
  const currentRules = schemaConfigs[primarySchemaId]?.fuzzyRules ?? []

  function isEnabled(ruleId: string): boolean {
    return currentRules.some((r) => r.ruleId === ruleId && r.enabled)
  }

  function handleToggle(ruleId: string, enabled: boolean) {
    const existing = currentRules.filter((r) => r.ruleId !== ruleId)
    const updated: FuzzyRuleState[] = [...existing, { ruleId, enabled }]
    setFuzzyRules(primarySchemaId, updated)
  }

  const initials = FUZZY_RULE_DEFINITIONS.filter((r) => r.category === 'initial')
  const finals = FUZZY_RULE_DEFINITIONS.filter((r) => r.category === 'final')

  if (!primarySchemaId) {
    return (
      <div className="text-gray-500">
        请先在「输入方案管理」中添加至少一个方案。
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">模糊音规则</h3>
        <p className="mt-1 text-sm text-gray-500">
          启用模糊音后，发音相近的声母或韵母会被视为相同，可以减少输入错误。
          当前配置应用于方案：{primarySchemaId}
        </p>
      </div>

      <div>
        <h4 className="mb-3 font-medium">声母模糊</h4>
        <div className="space-y-3">
          {initials.map((rule) => (
            <div key={rule.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{rule.label}</p>
                <p className="text-sm text-gray-500">{rule.description}</p>
              </div>
              <Switch
                checked={isEnabled(rule.id)}
                onCheckedChange={(checked) => handleToggle(rule.id, checked)}
              />
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <h4 className="mb-3 font-medium">韵母模糊</h4>
        <div className="space-y-3">
          {finals.map((rule) => (
            <div key={rule.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{rule.label}</p>
                <p className="text-sm text-gray-500">{rule.description}</p>
              </div>
              <Switch
                checked={isEnabled(rule.id)}
                onCheckedChange={(checked) => handleToggle(rule.id, checked)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Wire into EditorContent**

```tsx
import { FuzzyPinyin } from './modules/FuzzyPinyin'

'fuzzy-pinyin': <FuzzyPinyin />,
```

- [ ] **Step 3: Verify and commit**

```bash
git add src/features/editor/modules/FuzzyPinyin.tsx src/features/editor/EditorContent.tsx
git commit -m "feat: implement fuzzy pinyin module with toggle switches"
```

---

## Task 13: ASCII Mode & App Settings Module

**Files:**
- Create: `src/features/editor/modules/AsciiMode.tsx`
- Modify: `src/features/editor/EditorContent.tsx`

- [ ] **Step 1: Implement AsciiMode**

```tsx
// src/features/editor/modules/AsciiMode.tsx
import { useState } from 'react'
import { useConfigStore } from '@/stores/config-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card } from '@/components/ui/card'

const COMMON_APPS: { bundleId: string; name: string }[] = [
  { bundleId: 'com.apple.Terminal', name: 'Terminal' },
  { bundleId: 'com.microsoft.VSCode', name: 'VS Code' },
  { bundleId: 'com.googlecode.iterm2', name: 'iTerm2' },
  { bundleId: 'com.jetbrains.intellij', name: 'IntelliJ IDEA' },
  { bundleId: 'com.sublimetext.4', name: 'Sublime Text' },
]

export function AsciiMode() {
  const appOptions = useConfigStore((s) => s.project.platformConfig.appOptions)
  const targetPlatform = useConfigStore((s) => s.project.targetPlatform)
  const setAppOption = useConfigStore((s) => s.setAppOption)
  const removeAppOption = useConfigStore((s) => s.removeAppOption)
  const [customBundleId, setCustomBundleId] = useState('')

  const configuredApps = Object.entries(appOptions)
  const unconfiguredCommonApps = COMMON_APPS.filter(
    (app) => !(app.bundleId in appOptions),
  )

  function handleAddCustom() {
    if (!customBundleId.trim()) return
    setAppOption(customBundleId.trim(), true)
    setCustomBundleId('')
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">中英文切换与应用设置</h3>
        <p className="mt-1 text-sm text-gray-500">
          为特定应用设置默认输入模式。例如终端和代码编辑器通常默认英文模式。
          {targetPlatform === 'macos' && ' (macOS: 使用 Bundle Identifier)'}
          {targetPlatform === 'windows' && ' (Windows: 使用程序文件名)'}
        </p>
      </div>

      {configuredApps.length > 0 && (
        <div className="space-y-2">
          <Label>已配置的应用</Label>
          {configuredApps.map(([bundleId, opt]) => {
            const appInfo = COMMON_APPS.find((a) => a.bundleId === bundleId)
            return (
              <Card key={bundleId} className="flex items-center justify-between p-3">
                <div>
                  <p className="font-medium">{appInfo?.name ?? bundleId}</p>
                  {appInfo && (
                    <p className="text-xs text-gray-400">{bundleId}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">默认英文</span>
                    <Switch
                      checked={opt.asciiMode}
                      onCheckedChange={(checked) =>
                        setAppOption(bundleId, checked)
                      }
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAppOption(bundleId)}
                  >
                    删除
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {unconfiguredCommonApps.length > 0 && (
        <div>
          <Label>快速添加常用应用</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {unconfiguredCommonApps.map((app) => (
              <Button
                key={app.bundleId}
                variant="outline"
                size="sm"
                onClick={() => setAppOption(app.bundleId, true)}
              >
                + {app.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div>
        <Label>手动添加应用</Label>
        <div className="mt-1 flex gap-2">
          <Input
            value={customBundleId}
            onChange={(e) => setCustomBundleId(e.target.value)}
            placeholder={
              targetPlatform === 'macos'
                ? 'com.example.app'
                : 'app.exe'
            }
            className="w-72"
            onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
          />
          <Button onClick={handleAddCustom} disabled={!customBundleId.trim()}>
            添加
          </Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Wire into EditorContent and replace all remaining placeholders**

```tsx
// src/features/editor/EditorContent.tsx — final version
import { useConfigStore } from '@/stores/config-store'
import { SchemaManager } from './modules/SchemaManager'
import { CandidateSettings } from './modules/CandidateSettings'
import { KeyBindings } from './modules/KeyBindings'
import { FuzzyPinyin } from './modules/FuzzyPinyin'
import { AsciiMode } from './modules/AsciiMode'
import type { EditorModule } from '@/types/config'

const MODULE_COMPONENTS: Record<EditorModule, React.ReactNode> = {
  'schema-manager': <SchemaManager />,
  'candidate-settings': <CandidateSettings />,
  'key-bindings': <KeyBindings />,
  'fuzzy-pinyin': <FuzzyPinyin />,
  'ascii-mode': <AsciiMode />,
}

export function EditorContent() {
  const activeModule = useConfigStore((s) => s.activeModule)

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mx-auto max-w-2xl">
        {MODULE_COMPONENTS[activeModule]}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify and commit**

```bash
git add src/features/editor/modules/AsciiMode.tsx src/features/editor/EditorContent.tsx
git commit -m "feat: implement ASCII mode & app settings module, complete all 5 editor modules"
```

---

## Task 14: Config Import

**Files:**
- Create: `src/features/share/importer.ts`, `src/features/share/ImportDialog.tsx`
- Modify: `src/app/editor/EditorPage.tsx`

- [ ] **Step 1: Implement import logic**

```typescript
// src/features/share/importer.ts
import type { RimeProject, Platform } from '@/types/config'
import { createEmptyProject } from '@/lib/config/defaults'
import { DEFAULT_CONFIG, DEFAULT_PLATFORM_CONFIG } from '@/lib/config/defaults'
import {
  parseCustomYaml,
  expandPatchPaths,
  mapToDefaultConfig,
  mapToPlatformConfig,
  extractPreservedFields,
  KNOWN_DEFAULT_KEYS,
  KNOWN_PLATFORM_KEYS,
} from '@/lib/yaml/parser'

export interface ImportResult {
  project: RimeProject;
  summary: {
    filesProcessed: number;
    customSettings: number;
    errors: string[];
  };
}

export function importFromYamlString(
  yamlString: string,
  fileName: string,
): ImportResult {
  const project = createEmptyProject()
  const errors: string[] = []
  let customSettings = 0

  const { patch, error } = parseCustomYaml(yamlString)
  if (error) {
    errors.push(`${fileName}: ${error}`)
    return { project, summary: { filesProcessed: 1, customSettings: 0, errors } }
  }

  const expanded = expandPatchPaths(patch)
  customSettings = Object.keys(patch).length

  if (fileName.includes('default')) {
    project.defaultConfig = mapToDefaultConfig(expanded, DEFAULT_CONFIG)
    project.preserved['default.custom.yaml'] = extractPreservedFields(
      patch,
      KNOWN_DEFAULT_KEYS,
    )
  } else if (fileName.includes('squirrel')) {
    project.targetPlatform = 'macos'
    project.platformConfig = mapToPlatformConfig(expanded, {
      ...DEFAULT_PLATFORM_CONFIG,
      platform: 'macos',
    })
    project.preserved['squirrel.custom.yaml'] = extractPreservedFields(
      patch,
      KNOWN_PLATFORM_KEYS,
    )
  } else if (fileName.includes('weasel')) {
    project.targetPlatform = 'windows'
    project.platformConfig = mapToPlatformConfig(expanded, {
      ...DEFAULT_PLATFORM_CONFIG,
      platform: 'windows',
    })
    project.preserved['weasel.custom.yaml'] = extractPreservedFields(
      patch,
      KNOWN_PLATFORM_KEYS,
    )
  }

  return {
    project,
    summary: { filesProcessed: 1, customSettings, errors },
  }
}

export function importFromFiles(
  files: { name: string; content: string }[],
): ImportResult {
  const project = createEmptyProject()
  const errors: string[] = []
  let totalCustomSettings = 0

  for (const file of files) {
    const result = importFromYamlString(file.content, file.name)
    totalCustomSettings += result.summary.customSettings
    errors.push(...result.summary.errors)

    // Merge into project
    if (file.name.includes('default')) {
      project.defaultConfig = result.project.defaultConfig
    }
    if (file.name.includes('squirrel') || file.name.includes('weasel')) {
      project.targetPlatform = result.project.targetPlatform
      project.platformConfig = result.project.platformConfig
    }
    Object.assign(project.preserved, result.project.preserved)
  }

  return {
    project,
    summary: {
      filesProcessed: files.length,
      customSettings: totalCustomSettings,
      errors,
    },
  }
}
```

- [ ] **Step 2: Create ImportDialog component**

```tsx
// src/features/share/ImportDialog.tsx
import { useState, useCallback } from 'react'
import { useConfigStore } from '@/stores/config-store'
import { importFromYamlString, importFromFiles } from './importer'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

export function ImportDialog() {
  const loadProject = useConfigStore((s) => s.loadProject)
  const [open, setOpen] = useState(false)
  const [yamlText, setYamlText] = useState('')
  const [feedback, setFeedback] = useState('')

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = e.target.files
      if (!fileList?.length) return

      const files: { name: string; content: string }[] = []
      for (const file of Array.from(fileList)) {
        const content = await file.text()
        files.push({ name: file.name, content })
      }

      const result = importFromFiles(files)
      loadProject(result.project)

      const msg = `已导入 ${result.summary.filesProcessed} 个文件，识别到 ${result.summary.customSettings} 项自定义配置。`
      setFeedback(
        result.summary.errors.length > 0
          ? `${msg}\n错误：${result.summary.errors.join('; ')}`
          : msg,
      )
    },
    [loadProject],
  )

  function handlePasteImport() {
    if (!yamlText.trim()) return
    const result = importFromYamlString(yamlText, 'default.custom.yaml')
    loadProject(result.project)
    setFeedback(
      `已导入 ${result.summary.customSettings} 项自定义配置。`,
    )
    setYamlText('')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          导入配置
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>导入 Rime 配置</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="file">
          <TabsList className="mb-4">
            <TabsTrigger value="file">上传文件</TabsTrigger>
            <TabsTrigger value="paste">粘贴 YAML</TabsTrigger>
          </TabsList>

          <TabsContent value="file">
            <input
              type="file"
              accept=".yaml,.yml,.txt"
              multiple
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-medium hover:file:bg-gray-200"
            />
            <p className="mt-2 text-sm text-gray-500">
              支持 .custom.yaml 和 custom_phrase.txt 文件，可多选。
            </p>
          </TabsContent>

          <TabsContent value="paste">
            <Textarea
              value={yamlText}
              onChange={(e) => setYamlText(e.target.value)}
              placeholder="粘贴 .custom.yaml 文件内容..."
              rows={10}
              className="font-mono text-sm"
            />
            <Button onClick={handlePasteImport} className="mt-3" disabled={!yamlText.trim()}>
              导入
            </Button>
          </TabsContent>
        </Tabs>

        {feedback && (
          <p className="mt-3 rounded-md bg-green-50 p-3 text-sm text-green-700">
            {feedback}
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 3: Add ImportDialog to the editor header**

```tsx
// src/app/editor/EditorPage.tsx
import { EditorSidebar } from '@/features/editor/EditorSidebar'
import { EditorContent } from '@/features/editor/EditorContent'
import { ImportDialog } from '@/features/share/ImportDialog'

export function EditorPage() {
  return (
    <div className="flex h-[calc(100vh-57px)] flex-col">
      <div className="flex items-center justify-between border-b px-6 py-2">
        <span className="text-sm text-gray-500">配置编辑器</span>
        <div className="flex gap-2">
          <ImportDialog />
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <EditorSidebar />
        <EditorContent />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify and commit**

Test by uploading a real `default.custom.yaml` file — the editor should populate with the imported settings.

```bash
git add src/features/share/importer.ts src/features/share/ImportDialog.tsx src/app/editor/EditorPage.tsx
git commit -m "feat: implement config import from file upload and YAML paste"
```

---

## Task 15: Config Export

**Files:**
- Create: `src/features/share/ExportButton.tsx`
- Modify: `src/app/editor/EditorPage.tsx`

- [ ] **Step 1: Implement ExportButton**

```tsx
// src/features/share/ExportButton.tsx
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { useConfigStore } from '@/stores/config-store'
import {
  serializeDefaultConfig,
  serializePlatformConfig,
  buildCustomYaml,
} from '@/lib/yaml/serializer'
import { Button } from '@/components/ui/button'

export function ExportButton() {
  const project = useConfigStore((s) => s.project)

  async function handleExport() {
    const zip = new JSZip()

    // default.custom.yaml
    const defaultPatch = serializeDefaultConfig(project.defaultConfig)
    const defaultPreserved = project.preserved['default.custom.yaml']
    zip.file(
      'default.custom.yaml',
      buildCustomYaml(defaultPatch, defaultPreserved as Record<string, unknown>),
    )

    // Platform config
    const platformPatch = serializePlatformConfig(project.platformConfig)
    if (Object.keys(platformPatch).length > 0) {
      const platformFile =
        project.targetPlatform === 'windows'
          ? 'weasel.custom.yaml'
          : 'squirrel.custom.yaml'
      const platformPreserved = project.preserved[platformFile]
      zip.file(
        platformFile,
        buildCustomYaml(platformPatch, platformPreserved as Record<string, unknown>),
      )
    }

    // Schema-specific configs (fuzzy rules)
    for (const [schemaId, schemaConfig] of Object.entries(
      project.schemaConfigs,
    )) {
      const enabledRules = schemaConfig.fuzzyRules.filter((r) => r.enabled)
      if (enabledRules.length === 0) continue

      // Import fuzzy rule definitions to get algebra expressions
      const { FUZZY_RULE_DEFINITIONS } = await import('@/data/fuzzy-rules')
      const algebraRules: string[] = []
      const seenRules = new Set<string>()
      for (const rule of enabledRules) {
        const def = FUZZY_RULE_DEFINITIONS.find((d) => d.id === rule.ruleId)
        if (!def) continue
        for (const expr of def.algebraRules) {
          if (!seenRules.has(expr)) {
            seenRules.add(expr)
            algebraRules.push(expr)
          }
        }
      }

      if (algebraRules.length > 0) {
        const patch: Record<string, unknown> = {
          'speller/algebra/@before 0': algebraRules,
        }
        zip.file(`${schemaId}.custom.yaml`, buildCustomYaml(patch))
      }
    }

    const blob = await zip.generateAsync({ type: 'blob' })
    saveAs(blob, 'rime-config.zip')
  }

  return (
    <Button size="sm" onClick={handleExport}>
      导出配置
    </Button>
  )
}
```

- [ ] **Step 2: Add ExportButton to editor header**

In `src/app/editor/EditorPage.tsx`, add alongside ImportDialog:

```tsx
import { ExportButton } from '@/features/share/ExportButton'

// In the header div, after <ImportDialog />:
<ExportButton />
```

- [ ] **Step 3: Verify export**

1. Navigate to `/editor`, add a schema, change page size, enable some fuzzy rules
2. Click "导出配置"
3. Download should produce `rime-config.zip`
4. Unzip and verify `default.custom.yaml` contains the correct patch

- [ ] **Step 4: Commit**

```bash
git add src/features/share/ExportButton.tsx src/app/editor/EditorPage.tsx
git commit -m "feat: implement config export as zip with default, platform, and schema configs"
```

---

## Task 16: Preset Configurations

**Files:**
- Create: `src/data/presets.ts`
- Modify: `src/app/editor/EditorPage.tsx`

- [ ] **Step 1: Define 3 presets**

```typescript
// src/data/presets.ts
import type { RimeProject } from '@/types/config'
import { createEmptyProject } from '@/lib/config/defaults'

export interface Preset {
  id: string;
  name: string;
  description: string;
  createProject: () => RimeProject;
}

export const PRESETS: Preset[] = [
  {
    id: 'minimal-pinyin',
    name: '极简拼音',
    description: '默认全拼，最少配置，适合快速上手',
    createProject() {
      const p = createEmptyProject()
      p.defaultConfig.schemaList = [{ schema: 'luna_pinyin' }]
      p.defaultConfig.pageSize = 5
      return p
    },
  },
  {
    id: 'double-pinyin',
    name: '双拼快手',
    description: '小鹤双拼 + 常用模糊音（前后鼻音），打字更快',
    createProject() {
      const p = createEmptyProject()
      p.defaultConfig.schemaList = [{ schema: 'double_pinyin_flypy' }]
      p.defaultConfig.pageSize = 9
      p.defaultConfig.selectKeys = '123456789'
      p.defaultConfig.asciiComposer.switchKey.shiftL = 'commit_code'
      p.schemaConfigs['double_pinyin_flypy'] = {
        schemaId: 'double_pinyin_flypy',
        fuzzyRules: [
          { ruleId: 'an_ang', enabled: true },
          { ruleId: 'en_eng', enabled: true },
          { ruleId: 'in_ing', enabled: true },
        ],
      }
      // Common apps default to English
      p.platformConfig.appOptions = {
        'com.apple.Terminal': { asciiMode: true },
        'com.microsoft.VSCode': { asciiMode: true },
      }
      return p
    },
  },
  {
    id: 'rime-ice',
    name: '雾凇拼音推荐',
    description: '雾凇拼音方案 + 9候选 + 推荐按键设置',
    createProject() {
      const p = createEmptyProject()
      p.defaultConfig.schemaList = [{ schema: 'rime_ice' }]
      p.defaultConfig.pageSize = 9
      p.defaultConfig.asciiComposer.switchKey.shiftL = 'commit_code'
      p.defaultConfig.asciiComposer.switchKey.capsLock = 'clear'
      p.platformConfig.appOptions = {
        'com.apple.Terminal': { asciiMode: true },
        'com.microsoft.VSCode': { asciiMode: true },
        'com.googlecode.iterm2': { asciiMode: true },
      }
      return p
    },
  },
]
```

- [ ] **Step 2: Add preset selector to editor header**

In `src/app/editor/EditorPage.tsx`, add a preset dropdown:

```tsx
import { PRESETS } from '@/data/presets'
import { useConfigStore } from '@/stores/config-store'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Inside the EditorPage component, in the header:
function EditorPage() {
  const loadProject = useConfigStore((s) => s.loadProject)

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
                <SelectItem key={p.id} value={p.id}>
                  <div>
                    <p>{p.name}</p>
                    <p className="text-xs text-gray-400">{p.description}</p>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <ImportDialog />
          <ExportButton />
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <EditorSidebar />
        <EditorContent />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify presets work**

Select "双拼快手" preset — should populate 小鹤双拼 schema, 9 candidates, 3 fuzzy rules enabled, Terminal and VS Code in app settings.

- [ ] **Step 4: Commit**

```bash
git add src/data/presets.ts src/app/editor/EditorPage.tsx
git commit -m "feat: add 3 preset configurations (minimal, double pinyin, rime-ice)"
```

---

## Task 17: Home Page & Candidate Preview

**Files:**
- Create: `src/components/shared/CandidatePreview.tsx`
- Modify: `src/app/home/HomePage.tsx`

- [ ] **Step 1: Create static CandidatePreview component**

```tsx
// src/components/shared/CandidatePreview.tsx
import { cn } from '@/lib/utils'

interface CandidatePreviewProps {
  candidates?: string[];
  labels?: string[];
  input?: string;
  horizontal?: boolean;
  className?: string;
}

export function CandidatePreview({
  candidates = ['你好', '你', '尼', '泥', '拟'],
  labels = ['1', '2', '3', '4', '5'],
  input = 'nihao',
  horizontal = true,
  className,
}: CandidatePreviewProps) {
  return (
    <div
      className={cn(
        'inline-block rounded-lg border bg-white p-3 shadow-lg',
        className,
      )}
    >
      <div className="mb-2 text-sm text-blue-600">{input}</div>
      <div
        className={cn(
          'gap-3',
          horizontal ? 'flex' : 'flex flex-col',
        )}
      >
        {candidates.map((text, i) => (
          <span
            key={i}
            className={cn(
              'whitespace-nowrap text-sm',
              i === 0
                ? 'rounded bg-blue-100 px-1.5 py-0.5 font-medium text-blue-800'
                : 'text-gray-700',
            )}
          >
            <span className="mr-1 text-xs text-gray-400">{labels[i]}</span>
            {text}
          </span>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Enhance HomePage with features and preview**

```tsx
// src/app/home/HomePage.tsx
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CandidatePreview } from '@/components/shared/CandidatePreview'

const FEATURES = [
  {
    title: '可视化配置',
    description: '无需手动编辑 YAML，通过表单直观配置 Rime 各项参数',
  },
  {
    title: '全平台支持',
    description: '鼠须管、小狼毫、ibus-rime、同文、仓输入法一站覆盖',
  },
  {
    title: '导入导出',
    description: '上传已有配置快速编辑，一键导出为可用的配置文件包',
  },
  {
    title: '预设方案',
    description: '提供多种开箱即用的配置组合，快速上手',
  },
]

export function HomePage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">Rime Craft</h1>
        <p className="mb-6 text-lg text-gray-600">
          Rime 输入法可视化配置编辑器 — 告别手动编辑 YAML
        </p>
        <div className="mb-12 flex justify-center">
          <CandidatePreview />
        </div>
        <Link to="/editor">
          <Button size="lg">开始配置</Button>
        </Link>
      </div>

      <div className="mt-20 grid grid-cols-2 gap-6">
        {FEATURES.map((f) => (
          <Card key={f.title} className="p-5">
            <h3 className="mb-2 font-semibold">{f.title}</h3>
            <p className="text-sm text-gray-600">{f.description}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify home page**

Run: `npm run dev`, visit `/`.
Expected: Landing page with title, candidate preview mockup, "开始配置" button, and 4 feature cards.

- [ ] **Step 4: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass.

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: Build completes without errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/shared/CandidatePreview.tsx src/app/home/HomePage.tsx
git commit -m "feat: add home page with candidate preview and feature cards"
```

---

## Post-Implementation Checklist

After completing all tasks, verify the full MVP workflow:

- [ ] **End-to-end: fresh start → preset → edit → export → verify**
  1. Open `/`, click "开始配置"
  2. Select "双拼快手" preset
  3. Go to "候选词设置", change page size to 7
  4. Go to "模糊音规则", toggle a few rules
  5. Go to "中英文切换", add an app
  6. Click "导出配置"
  7. Unzip `rime-config.zip`, verify `default.custom.yaml` and `double_pinyin_flypy.custom.yaml` have correct content

- [ ] **End-to-end: import existing config → edit → export**
  1. Prepare a real `default.custom.yaml` file
  2. Click "导入配置", upload the file
  3. Verify settings populate correctly in each module
  4. Make edits, export, verify output

- [ ] **Run all tests pass:** `npx vitest run`
- [ ] **Build succeeds:** `npm run build`
