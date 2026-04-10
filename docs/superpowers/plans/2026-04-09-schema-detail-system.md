# Schema Detail System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add comprehensive schema detail pages with external links, keyboard layouts, screenshots, and learning resources, while enhancing the existing wizard, schema manager, and compare page with richer information.

**Architecture:** A single JSON data file (`schemas-detail.json`) serves as the source of truth for all schema information. Existing data modules (`schema-registry.ts`, `schema-compare-data.ts`) are refactored to derive from this JSON. A new `/schema/:id` route renders detail pages with tabs. A reusable `KeyboardLayout` component renders interactive double-pinyin keymaps.

**Tech Stack:** React 18, React Router 7, Radix UI Tabs, Vitest, Tailwind CSS, TypeScript, Vite (native JSON imports)

**Design Spec:** `docs/superpowers/specs/2026-04-09-schema-detail-system-design.md`

---

## File Structure

### New Files

| File | Responsibility |
|------|---------------|
| `src/types/schema.ts` | Unified type definitions for schema detail data |
| `src/data/schemas-detail.json` | Single source of truth for all 13 schemas |
| `src/data/schema-data.ts` | Typed accessor module — imports JSON, exports typed arrays and lookup helpers |
| `src/features/schema-detail/SchemaDetailPage.tsx` | Route page — loads schema by URL param, renders tabs |
| `src/features/schema-detail/SchemaHeader.tsx` | Header area — name, badges, links, action buttons |
| `src/features/schema-detail/SchemaIntroTab.tsx` | Introduction tab — text, stat cards, feature tags, platforms |
| `src/features/schema-detail/SchemaFeaturesTab.tsx` | Features tab — detailed feature list |
| `src/features/schema-detail/SchemaScreenshotsTab.tsx` | Screenshots tab — image gallery with empty state |
| `src/features/schema-detail/SchemaResourcesTab.tsx` | Learning resources tab — link cards |
| `src/features/schema-detail/KeyboardLayout.tsx` | Interactive keyboard layout component for double-pinyin |
| `src/features/schema-detail/__tests__/KeyboardLayout.test.tsx` | Tests for keyboard layout component |
| `src/features/schema-detail/__tests__/SchemaDetailPage.test.tsx` | Tests for detail page routing and rendering |
| `public/screenshots/` | Directory for schema screenshot images (initially empty) |

### Modified Files

| File | Changes |
|------|---------|
| `src/data/schema-registry.ts` | Rewrite to derive from `schema-data.ts`, keep exported interface unchanged |
| `src/data/schema-compare-data.ts` | Rewrite to derive from `schema-data.ts`, keep exported interface unchanged |
| `src/App.tsx` | Add lazy-loaded `/schema/:id` route |
| `src/features/wizard/steps/SchemaStep.tsx` | Add author, difficulty badge, "了解更多" link, feature summary |
| `src/features/editor/modules/SchemaManager.tsx` | Richer dropdown items, "查看详情" button, external link icons |
| `src/features/compare/SchemaCompare.tsx` | Clickable schema names, external links row, new compare dimensions, "查看详情" button |

---

## Task 1: Type Definitions

**Files:**
- Create: `src/types/schema.ts`

- [ ] **Step 1: Create the schema types file**

```typescript
// src/types/schema.ts

export interface SchemaDetail {
  id: string
  name: string
  type: 'full_pinyin' | 'double_pinyin' | 'shape' | 'mixed'
  description: string
  introduction: string
  author: string
  links: SchemaLinks
  compare: SchemaCompareInfo
  visuals: SchemaVisuals
  community: SchemaCommunity
  learningResources: LearningResource[]
  integration: SchemaIntegration
}

export interface SchemaLinks {
  official: string | null
  repository: string | null
  documentation: string | null
  community: CommunityLink[]
}

export interface CommunityLink {
  label: string
  url: string
}

export interface SchemaCompareInfo {
  dictSize: string
  smartLevel: '基础' | '中等' | '高'
  auxiliaryCode: string
  features: string[]
  platforms: string[]
  difficulty: '简单' | '中等' | '困难'
  recommendation: string
}

export interface SchemaVisuals {
  screenshots: string[]
  keyboardLayout: KeyboardLayoutData | null
}

export interface KeyboardLayoutData {
  name: string
  rows: KeyMapping[][]
}

export interface KeyMapping {
  key: string
  initial: string | null
  final: string
  isSpecial?: boolean
  isDualRole?: boolean
}

export interface SchemaCommunity {
  updateFrequency: string
  stars: string
  reputation: string
}

export interface LearningResource {
  title: string
  url: string
}

export interface SchemaIntegration {
  presetId: string | null
  capabilities: string[]
  availableSpellingSchemes: string[] | null
  availableAuxiliaryCodes: string[] | null
  customSwitchNames: string[] | null
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to `src/types/schema.ts`

- [ ] **Step 3: Commit**

```bash
git add src/types/schema.ts
git commit -m "feat: add SchemaDetail type definitions"
```

---

## Task 2: JSON Data File

**Files:**
- Create: `src/data/schemas-detail.json`

This is the largest single task — populating all 13 schemas with real data. The JSON structure follows the `SchemaDetail` type exactly.

- [ ] **Step 1: Create the JSON file with all 13 schemas**

Create `src/data/schemas-detail.json`. Below are 3 representative schemas (one full_pinyin, one double_pinyin, one shape). The remaining 10 schemas follow the same structure — populate them with their specific data by researching each schema's repository and documentation.

```jsonc
{
  "schemas": [
    {
      "id": "rime_ice",
      "name": "雾凇拼音",
      "type": "full_pinyin",
      "description": "功能齐全的全拼方案，词库丰富，社区活跃",
      "introduction": "雾凇拼音是目前 Rime 社区最活跃、功能最齐全的全拼方案。由 Dvel 维护，提供了丰富的词库（200万+词条）、完善的 Emoji 支持、符号快速输入、反查功能、日期时间输入、计算器等实用功能。方案开箱即用，适合希望快速上手 Rime 的新用户，同时也支持深度自定义。\n\n雾凇拼音基于 Rime 的 Lua 扩展体系，实现了许多传统输入法才有的功能，如智能日期时间输入（输入 rq 自动联想日期）、计算器（输入 = 开头的表达式）等。社区活跃，问题反馈响应迅速，是目前 GitHub 上 Star 数最多的 Rime 方案仓库。",
      "author": "Dvel",
      "links": {
        "official": "https://dvel.me/posts/rime-ice/",
        "repository": "https://github.com/iDvel/rime-ice",
        "documentation": "https://dvel.me/posts/rime-ice/",
        "community": [
          { "label": "QQ 群", "url": "https://github.com/iDvel/rime-ice#%E4%BA%A4%E6%B5%81" }
        ]
      },
      "compare": {
        "dictSize": "200万+",
        "smartLevel": "高",
        "auxiliaryCode": "不支持",
        "features": ["Emoji", "符号输入", "反查", "日期时间", "计算器", "Lua 扩展"],
        "platforms": ["macOS", "Windows", "Linux", "Android", "iOS"],
        "difficulty": "简单",
        "recommendation": "功能最全的全拼方案，新手首选"
      },
      "visuals": {
        "screenshots": [],
        "keyboardLayout": null
      },
      "community": {
        "updateFrequency": "活跃（月更）",
        "stars": "10k+",
        "reputation": "社区最受欢迎的全拼方案"
      },
      "learningResources": [
        { "title": "雾凇拼音官方文档", "url": "https://dvel.me/posts/rime-ice/" },
        { "title": "GitHub 仓库", "url": "https://github.com/iDvel/rime-ice" }
      ],
      "integration": {
        "presetId": "rime-ice",
        "capabilities": ["special-input"],
        "availableSpellingSchemes": null,
        "availableAuxiliaryCodes": null,
        "customSwitchNames": null
      }
    },
    {
      "id": "double_pinyin_flypy",
      "name": "小鹤双拼",
      "type": "double_pinyin",
      "description": "最流行的双拼方案之一，键位分布合理",
      "introduction": "小鹤双拼是目前使用人数最多的双拼方案，由何海峰设计。其键位分布经过精心设计，左右手负担均衡，常用韵母分布在容易按到的位置，学习曲线相对平缓。\n\n小鹤双拼的设计理念是兼顾效率和舒适度，避免了一些双拼方案中同指连击的问题。配合小鹤音形可以实现更高效的输入，但单独使用双拼也完全可以。在 Rime 中使用小鹤双拼非常简单，也可以通过万象拼音方案内置的双拼支持来使用。",
      "author": "何海峰",
      "links": {
        "official": "https://flypy.com/",
        "repository": null,
        "documentation": "https://flypy.com/",
        "community": [
          { "label": "官方论坛", "url": "https://bbs.flypy.com/" }
        ]
      },
      "compare": {
        "dictSize": "取决于基础方案",
        "smartLevel": "中等",
        "auxiliaryCode": "小鹤音形（可选）",
        "features": ["双拼输入", "可搭配音形"],
        "platforms": ["macOS", "Windows", "Linux", "Android", "iOS"],
        "difficulty": "中等",
        "recommendation": "最流行的双拼方案，键位分布合理"
      },
      "visuals": {
        "screenshots": [],
        "keyboardLayout": {
          "name": "小鹤双拼",
          "rows": [
            [
              { "key": "Q", "initial": "q", "final": "iu" },
              { "key": "W", "initial": "w", "final": "ei" },
              { "key": "E", "initial": null, "final": "e" },
              { "key": "R", "initial": "r", "final": "uan" },
              { "key": "T", "initial": "t", "final": "ue" },
              { "key": "Y", "initial": "y", "final": "un" },
              { "key": "U", "initial": "sh", "final": "u", "isDualRole": true },
              { "key": "I", "initial": "ch", "final": "i", "isDualRole": true },
              { "key": "O", "initial": null, "final": "uo" },
              { "key": "P", "initial": "p", "final": "ie" }
            ],
            [
              { "key": "A", "initial": null, "final": "a" },
              { "key": "S", "initial": "s", "final": "ong" },
              { "key": "D", "initial": "d", "final": "ai" },
              { "key": "F", "initial": "f", "final": "en" },
              { "key": "G", "initial": "g", "final": "eng" },
              { "key": "H", "initial": "h", "final": "ang" },
              { "key": "J", "initial": "j", "final": "an" },
              { "key": "K", "initial": "k", "final": "ao" },
              { "key": "L", "initial": "l", "final": "ing" }
            ],
            [
              { "key": "Z", "initial": "z", "final": "ou" },
              { "key": "X", "initial": "x", "final": "ia" },
              { "key": "C", "initial": "c", "final": "iao" },
              { "key": "V", "initial": "zh", "final": "ui", "isDualRole": true },
              { "key": "B", "initial": "b", "final": "in" },
              { "key": "N", "initial": "n", "final": "iang" },
              { "key": "M", "initial": "m", "final": "ian" }
            ]
          ]
        }
      },
      "community": {
        "updateFrequency": "稳定",
        "stars": "N/A",
        "reputation": "最流行的双拼方案"
      },
      "learningResources": [
        { "title": "小鹤双拼官网", "url": "https://flypy.com/" },
        { "title": "小鹤入门指南", "url": "https://flypy.com/pin.html" }
      ],
      "integration": {
        "presetId": "double-pinyin",
        "capabilities": [],
        "availableSpellingSchemes": null,
        "availableAuxiliaryCodes": null,
        "customSwitchNames": null
      }
    },
    {
      "id": "wubi86",
      "name": "五笔86",
      "type": "shape",
      "description": "经典五笔字型方案",
      "introduction": "五笔字型是王永民于1983年发明的汉字输入法，以字根组合的方式输入汉字，完全不依赖拼音。86版是最经典、使用最广泛的版本。\n\n五笔输入法的优势在于重码率极低，熟练后打字速度快，且不受方言影响。但学习曲线较陡，需要记忆字根表和拆字规则。对于追求极致输入效率、经常需要输入生僻字的用户来说，五笔仍然是最佳选择之一。",
      "author": "王永民",
      "links": {
        "official": null,
        "repository": "https://github.com/rime/rime-wubi",
        "documentation": null,
        "community": []
      },
      "compare": {
        "dictSize": "10万+",
        "smartLevel": "基础",
        "auxiliaryCode": "不适用",
        "features": ["形码输入", "反查"],
        "platforms": ["macOS", "Windows", "Linux", "Android", "iOS"],
        "difficulty": "困难",
        "recommendation": "经典五笔方案，打字速度快"
      },
      "visuals": {
        "screenshots": [],
        "keyboardLayout": null
      },
      "community": {
        "updateFrequency": "稳定",
        "stars": "N/A",
        "reputation": "历史最悠久的形码方案"
      },
      "learningResources": [
        { "title": "Rime 五笔仓库", "url": "https://github.com/rime/rime-wubi" }
      ],
      "integration": {
        "presetId": "wubi",
        "capabilities": [],
        "availableSpellingSchemes": null,
        "availableAuxiliaryCodes": null,
        "customSwitchNames": null
      }
    }
  ]
}
```

**For the remaining 10 schemas**, follow this exact structure. The schemas to populate are:
- `wanxiang` — repo: `https://github.com/amzxyz/rime-wanxiang-pinyin`
- `wanxiang_pro` — same author as wanxiang
- `double_pinyin` (自然码) — keyboard layout needed, `;` maps to `ing`
- `double_pinyin_mspy` (微软双拼) — keyboard layout needed, `;` maps to `ing`
- `double_pinyin_sogou` (搜狗双拼) — keyboard layout needed
- `luna_pinyin` — repo: `https://github.com/rime/rime-luna-pinyin`
- `terra_pinyin` — repo: `https://github.com/rime/rime-terra-pinyin`
- `wubi98` — repo: `https://github.com/rime/rime-wubi`
- `cangjie5` — repo: `https://github.com/rime/rime-cangjie`
- `zhengma` — search for official repository

Copy the `integration` field from the existing `schema-registry.ts` for each schema (especially `wanxiang` which has extensive capabilities).

- [ ] **Step 2: Verify JSON is valid**

Run: `node -e "JSON.parse(require('fs').readFileSync('src/data/schemas-detail.json','utf8')); console.log('Valid JSON')"`
Expected: `Valid JSON`

- [ ] **Step 3: Commit**

```bash
git add src/data/schemas-detail.json
git commit -m "feat: add comprehensive schema detail data (JSON)"
```

---

## Task 3: Data Access Module

**Files:**
- Create: `src/data/schema-data.ts`

This module imports the JSON, exports typed data, and provides lookup helpers used by all consumers.

- [ ] **Step 1: Create the data access module**

```typescript
// src/data/schema-data.ts
import type { SchemaDetail } from '@/types/schema'
import rawData from './schemas-detail.json'

/** All schemas with full detail */
export const ALL_SCHEMAS: SchemaDetail[] = rawData.schemas as SchemaDetail[]

/** Lookup a schema by ID, returns undefined if not found */
export function getSchemaById(id: string): SchemaDetail | undefined {
  return ALL_SCHEMAS.find((s) => s.id === id)
}

/** Get all schema IDs */
export function getAllSchemaIds(): string[] {
  return ALL_SCHEMAS.map((s) => s.id)
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors. Vite supports JSON imports natively — if TS complains about the JSON import, add `"resolveJsonModule": true` to `tsconfig.json` `compilerOptions` (it's likely already there).

- [ ] **Step 3: Commit**

```bash
git add src/data/schema-data.ts
git commit -m "feat: add typed schema data access module"
```

---

## Task 4: Migrate schema-registry.ts

**Files:**
- Modify: `src/data/schema-registry.ts`

Rewrite to derive from JSON data while keeping the exact same exported interface.

- [ ] **Step 1: Rewrite schema-registry.ts**

```typescript
// src/data/schema-registry.ts
import type { SpellingScheme, AuxiliaryCodeScheme } from '@/types/config'
import { ALL_SCHEMAS } from './schema-data'

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

export const SCHEMA_REGISTRY: SchemaInfo[] = ALL_SCHEMAS.map((s) => ({
  id: s.id,
  name: s.name,
  description: s.description,
  type: s.type,
  capabilities: s.integration.capabilities,
  ...(s.integration.availableSpellingSchemes && {
    availableSpellingSchemes: s.integration.availableSpellingSchemes as SpellingScheme[],
  }),
  ...(s.integration.availableAuxiliaryCodes && {
    availableAuxiliaryCodes: s.integration.availableAuxiliaryCodes as AuxiliaryCodeScheme[],
  }),
  ...(s.integration.customSwitchNames && {
    customSwitchNames: s.integration.customSwitchNames,
  }),
}))

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

- [ ] **Step 2: Run existing tests to verify no regressions**

Run: `npx vitest run 2>&1 | tail -20`
Expected: All existing tests pass.

- [ ] **Step 3: Verify the app builds**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No type errors.

- [ ] **Step 4: Commit**

```bash
git add src/data/schema-registry.ts
git commit -m "refactor: derive schema-registry from JSON data source"
```

---

## Task 5: Migrate schema-compare-data.ts

**Files:**
- Modify: `src/data/schema-compare-data.ts`

- [ ] **Step 1: Rewrite schema-compare-data.ts**

```typescript
// src/data/schema-compare-data.ts
import { ALL_SCHEMAS } from './schema-data'

export interface SchemaCompareData {
  id: string;
  name: string;
  author: string;
  inputMethod: '全拼' | '双拼' | '形码' | '音形混合';
  dictSize: string;
  smartLevel: '基础' | '中等' | '高';
  auxiliaryCode: string;
  features: string[];
  platforms: string[];
  difficulty: '简单' | '中等' | '困难';
  recommendation: string;
  presetId?: string;
}

const TYPE_TO_INPUT_METHOD: Record<string, SchemaCompareData['inputMethod']> = {
  full_pinyin: '全拼',
  double_pinyin: '双拼',
  shape: '形码',
  mixed: '音形混合',
}

export const SCHEMA_COMPARE_DATA: SchemaCompareData[] = ALL_SCHEMAS.map((s) => ({
  id: s.id,
  name: s.name,
  author: s.author,
  inputMethod: TYPE_TO_INPUT_METHOD[s.type] ?? '全拼',
  dictSize: s.compare.dictSize,
  smartLevel: s.compare.smartLevel,
  auxiliaryCode: s.compare.auxiliaryCode,
  features: s.compare.features,
  platforms: s.compare.platforms,
  difficulty: s.compare.difficulty,
  recommendation: s.compare.recommendation,
  ...(s.integration.presetId && { presetId: s.integration.presetId }),
}))
```

- [ ] **Step 2: Run tests and type-check**

Run: `npx vitest run && npx tsc --noEmit --pretty 2>&1 | tail -10`
Expected: All tests pass, no type errors.

- [ ] **Step 3: Commit**

```bash
git add src/data/schema-compare-data.ts
git commit -m "refactor: derive schema-compare-data from JSON data source"
```

---

## Task 6: KeyboardLayout Component

**Files:**
- Create: `src/features/schema-detail/KeyboardLayout.tsx`
- Create: `src/features/schema-detail/__tests__/KeyboardLayout.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// src/features/schema-detail/__tests__/KeyboardLayout.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { KeyboardLayout } from '../KeyboardLayout'
import type { KeyboardLayoutData } from '@/types/schema'

const MOCK_LAYOUT: KeyboardLayoutData = {
  name: '测试双拼',
  rows: [
    [
      { key: 'Q', initial: 'q', final: 'iu' },
      { key: 'W', initial: 'w', final: 'ei' },
    ],
    [
      { key: 'A', initial: null, final: 'a' },
      { key: ';', initial: null, final: 'ing', isSpecial: true },
    ],
    [
      { key: 'V', initial: 'zh', final: 'ui', isDualRole: true },
    ],
  ],
}

describe('KeyboardLayout', () => {
  it('renders all keys from the layout data', () => {
    render(<KeyboardLayout data={MOCK_LAYOUT} />)
    expect(screen.getByText('Q')).toBeInTheDocument()
    expect(screen.getByText('W')).toBeInTheDocument()
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText(';')).toBeInTheDocument()
    expect(screen.getByText('V')).toBeInTheDocument()
  })

  it('renders final mappings for each key', () => {
    render(<KeyboardLayout data={MOCK_LAYOUT} />)
    expect(screen.getByText('iu')).toBeInTheDocument()
    expect(screen.getByText('ei')).toBeInTheDocument()
    expect(screen.getByText('ing')).toBeInTheDocument()
  })

  it('renders the layout name', () => {
    render(<KeyboardLayout data={MOCK_LAYOUT} />)
    expect(screen.getByText('测试双拼')).toBeInTheDocument()
  })

  it('applies special style to isSpecial keys', () => {
    render(<KeyboardLayout data={MOCK_LAYOUT} />)
    const semicolonKey = screen.getByText(';').closest('[data-key]')
    expect(semicolonKey).toHaveAttribute('data-special', 'true')
  })

  it('applies dual-role style to isDualRole keys', () => {
    render(<KeyboardLayout data={MOCK_LAYOUT} />)
    const vKey = screen.getByText('V').closest('[data-key]')
    expect(vKey).toHaveAttribute('data-dual-role', 'true')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/schema-detail/__tests__/KeyboardLayout.test.tsx 2>&1 | tail -10`
Expected: FAIL — module not found

- [ ] **Step 3: Implement the KeyboardLayout component**

```tsx
// src/features/schema-detail/KeyboardLayout.tsx
import { cn } from '@/lib/utils'
import type { KeyboardLayoutData, KeyMapping } from '@/types/schema'

interface KeyboardLayoutProps {
  data: KeyboardLayoutData
}

const ROW_OFFSETS = ['ml-0', 'ml-5', 'ml-10']

export function KeyboardLayout({ data }: KeyboardLayoutProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-center text-sm font-medium text-gray-500">
        {data.name}
      </h3>
      <div className="flex flex-col items-center gap-1.5">
        {data.rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className={cn('flex gap-1', ROW_OFFSETS[rowIndex])}
          >
            {row.map((mapping) => (
              <Key key={mapping.key} mapping={mapping} />
            ))}
          </div>
        ))}
      </div>
      <Legend />
    </div>
  )
}

function Key({ mapping }: { mapping: KeyMapping }) {
  const { key, initial, final, isSpecial, isDualRole } = mapping
  const hasCustomInitial = initial !== null

  return (
    <div
      data-key={key}
      data-special={isSpecial ? 'true' : undefined}
      data-dual-role={isDualRole ? 'true' : undefined}
      className={cn(
        'flex h-14 w-16 flex-col items-center justify-center rounded-md border transition-colors',
        'hover:border-blue-400 hover:bg-blue-50',
        isSpecial && 'border-purple-400 bg-purple-50',
        isDualRole && 'border-yellow-400 bg-yellow-50',
        !isSpecial && !isDualRole && 'border-gray-300 bg-white',
      )}
      title={
        hasCustomInitial
          ? `声母: ${initial}　韵母: ${final}`
          : `韵母: ${final}`
      }
    >
      <span
        className={cn(
          'text-sm font-semibold',
          isSpecial ? 'text-purple-700' : 'text-gray-900',
        )}
      >
        {key}
      </span>
      <span
        className={cn(
          'text-xs font-medium',
          isSpecial
            ? 'text-purple-600'
            : hasCustomInitial
              ? 'text-blue-600'
              : 'text-gray-400',
        )}
      >
        {final}
      </span>
    </div>
  )
}

function Legend() {
  return (
    <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-500">
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-4 rounded border border-gray-300 bg-white" />
        字母键
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-4 rounded border border-purple-400 bg-purple-50" />
        非字母键
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-4 rounded border border-yellow-400 bg-yellow-50" />
        双角色键
      </span>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/schema-detail/__tests__/KeyboardLayout.test.tsx 2>&1 | tail -10`
Expected: All 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/schema-detail/KeyboardLayout.tsx src/features/schema-detail/__tests__/KeyboardLayout.test.tsx
git commit -m "feat: add interactive KeyboardLayout component for double-pinyin"
```

---

## Task 7: Schema Detail Page + Route

**Files:**
- Create: `src/features/schema-detail/SchemaDetailPage.tsx`
- Modify: `src/App.tsx`
- Create: `src/features/schema-detail/__tests__/SchemaDetailPage.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// src/features/schema-detail/__tests__/SchemaDetailPage.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { SchemaDetailPage } from '../SchemaDetailPage'

function renderWithRouter(schemaId: string) {
  return render(
    <MemoryRouter initialEntries={[`/schema/${schemaId}`]}>
      <Routes>
        <Route path="/schema/:id" element={<SchemaDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('SchemaDetailPage', () => {
  it('renders schema name for a valid schema', () => {
    renderWithRouter('rime_ice')
    expect(screen.getByText('雾凇拼音')).toBeInTheDocument()
  })

  it('shows not-found message for an invalid schema', () => {
    renderWithRouter('nonexistent_schema')
    expect(screen.getByText(/找不到该方案/)).toBeInTheDocument()
  })

  it('renders tab navigation', () => {
    renderWithRouter('rime_ice')
    expect(screen.getByText('方案介绍')).toBeInTheDocument()
    expect(screen.getByText('功能特性')).toBeInTheDocument()
    expect(screen.getByText('学习资源')).toBeInTheDocument()
  })

  it('renders keyboard layout tab for double-pinyin schemas', () => {
    renderWithRouter('double_pinyin_flypy')
    expect(screen.getByText('键位图')).toBeInTheDocument()
  })

  it('does not render keyboard layout tab for non-double-pinyin schemas', () => {
    renderWithRouter('rime_ice')
    expect(screen.queryByText('键位图')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/schema-detail/__tests__/SchemaDetailPage.test.tsx 2>&1 | tail -10`
Expected: FAIL — module not found

- [ ] **Step 3: Create SchemaDetailPage**

```tsx
// src/features/schema-detail/SchemaDetailPage.tsx
import { useParams, Link } from 'react-router-dom'
import { getSchemaById } from '@/data/schema-data'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { SchemaHeader } from './SchemaHeader'
import { SchemaIntroTab } from './SchemaIntroTab'
import { SchemaFeaturesTab } from './SchemaFeaturesTab'
import { SchemaScreenshotsTab } from './SchemaScreenshotsTab'
import { SchemaResourcesTab } from './SchemaResourcesTab'
import { KeyboardLayout } from './KeyboardLayout'

export function SchemaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const schema = id ? getSchemaById(id) : undefined

  if (!schema) {
    return (
      <div className="mx-auto max-w-3xl p-8 text-center">
        <h2 className="mb-4 text-xl font-semibold">找不到该方案</h2>
        <p className="mb-6 text-gray-500">
          请检查方案 ID 是否正确，或返回方案对比页浏览所有方案。
        </p>
        <Link to="/compare">
          <Button>浏览所有方案</Button>
        </Link>
      </div>
    )
  }

  const hasKeyboard = schema.visuals.keyboardLayout !== null

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <SchemaHeader schema={schema} />

      <Tabs defaultValue="intro" className="mt-6">
        <TabsList>
          <TabsTrigger value="intro">方案介绍</TabsTrigger>
          <TabsTrigger value="features">功能特性</TabsTrigger>
          <TabsTrigger value="screenshots">截图预览</TabsTrigger>
          <TabsTrigger value="resources">学习资源</TabsTrigger>
          {hasKeyboard && (
            <TabsTrigger value="keyboard">键位图</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="intro">
          <SchemaIntroTab schema={schema} />
        </TabsContent>
        <TabsContent value="features">
          <SchemaFeaturesTab features={schema.compare.features} />
        </TabsContent>
        <TabsContent value="screenshots">
          <SchemaScreenshotsTab
            schemaId={schema.id}
            screenshots={schema.visuals.screenshots}
          />
        </TabsContent>
        <TabsContent value="resources">
          <SchemaResourcesTab resources={schema.learningResources} />
        </TabsContent>
        {hasKeyboard && (
          <TabsContent value="keyboard">
            <KeyboardLayout data={schema.visuals.keyboardLayout!} />
          </TabsContent>
        )}
      </Tabs>

      {/* Bottom CTA */}
      <div className="mt-8 flex items-center justify-between rounded-lg border bg-gray-50 p-4">
        <div>
          <p className="font-medium">想和其他方案对比？</p>
          <p className="text-sm text-gray-500">
            查看方案横向对比，帮你做出更好的选择
          </p>
        </div>
        <Link to="/compare">
          <Button variant="outline">前往方案对比</Button>
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create stub components so the page compiles**

Create minimal stubs for `SchemaHeader`, `SchemaIntroTab`, `SchemaFeaturesTab`, `SchemaScreenshotsTab`, `SchemaResourcesTab`. Each is a placeholder returning its name — they'll be implemented in subsequent tasks.

```tsx
// src/features/schema-detail/SchemaHeader.tsx
import type { SchemaDetail } from '@/types/schema'
export function SchemaHeader({ schema }: { schema: SchemaDetail }) {
  return <div>{schema.name}</div>
}

// src/features/schema-detail/SchemaIntroTab.tsx
import type { SchemaDetail } from '@/types/schema'
export function SchemaIntroTab({ schema }: { schema: SchemaDetail }) {
  return <div>{schema.introduction}</div>
}

// src/features/schema-detail/SchemaFeaturesTab.tsx
export function SchemaFeaturesTab({ features }: { features: string[] }) {
  return <ul>{features.map((f) => <li key={f}>{f}</li>)}</ul>
}

// src/features/schema-detail/SchemaScreenshotsTab.tsx
export function SchemaScreenshotsTab({ schemaId, screenshots }: { schemaId: string; screenshots: string[] }) {
  if (screenshots.length === 0) return <p className="text-gray-500">暂无截图</p>
  return <div>{screenshots.map((s) => <img key={s} src={`/screenshots/${schemaId}/${s}`} alt="" />)}</div>
}

// src/features/schema-detail/SchemaResourcesTab.tsx
import type { LearningResource } from '@/types/schema'
export function SchemaResourcesTab({ resources }: { resources: LearningResource[] }) {
  return <ul>{resources.map((r) => <li key={r.url}><a href={r.url} target="_blank" rel="noreferrer">{r.title}</a></li>)}</ul>
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/features/schema-detail/__tests__/SchemaDetailPage.test.tsx 2>&1 | tail -15`
Expected: All 5 tests PASS

- [ ] **Step 6: Add route to App.tsx**

Add the lazy-loaded route to `src/App.tsx`. Insert the lazy import at the top alongside existing lazy imports:

```typescript
const SchemaDetailPage = lazy(() =>
  import('@/features/schema-detail/SchemaDetailPage').then((m) => ({
    default: m.SchemaDetailPage,
  }))
)
```

Add the route inside the `<Route element={<AppLayout />}>` block, after the `gallery` route:

```tsx
<Route
  path="schema/:id"
  element={
    <Suspense fallback={<div className="p-8 text-gray-400">加载中...</div>}>
      <SchemaDetailPage />
    </Suspense>
  }
/>
```

- [ ] **Step 7: Verify the app builds**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No type errors.

- [ ] **Step 8: Commit**

```bash
git add src/features/schema-detail/ src/App.tsx
git commit -m "feat: add schema detail page with route and tab navigation"
```

---

## Task 8: SchemaHeader Component

**Files:**
- Modify: `src/features/schema-detail/SchemaHeader.tsx`

Replace the stub with the full implementation.

- [ ] **Step 1: Implement SchemaHeader**

```tsx
// src/features/schema-detail/SchemaHeader.tsx
import { useNavigate } from 'react-router-dom'
import { ExternalLink, Github, BookOpen, MessageCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useConfigStore } from '@/stores/config-store'
import { PRESETS } from '@/data/presets'
import { createEmptyProject } from '@/lib/config/defaults'
import type { SchemaDetail } from '@/types/schema'

const TYPE_LABELS: Record<string, string> = {
  full_pinyin: '全拼',
  double_pinyin: '双拼',
  shape: '形码',
  mixed: '混合',
}

const DIFFICULTY_COLORS: Record<string, string> = {
  '简单': 'bg-green-100 text-green-800',
  '中等': 'bg-yellow-100 text-yellow-800',
  '困难': 'bg-red-100 text-red-800',
}

export function SchemaHeader({ schema }: { schema: SchemaDetail }) {
  const navigate = useNavigate()
  const loadProject = useConfigStore((s) => s.loadProject)

  function handleUseSchema() {
    const preset = schema.integration.presetId
      ? PRESETS.find((p) => p.id === schema.integration.presetId)
      : undefined
    if (preset) {
      loadProject(preset.createProject())
    } else {
      const project = createEmptyProject()
      project.defaultConfig.schemaList = [{ schema: schema.id }]
      loadProject(project)
    }
    navigate('/editor')
  }

  return (
    <div className="rounded-lg border bg-gradient-to-br from-blue-50 to-sky-50 p-6">
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{schema.name}</h1>
            <Badge variant="secondary">{TYPE_LABELS[schema.type] ?? schema.type}</Badge>
            <Badge className={DIFFICULTY_COLORS[schema.compare.difficulty]}>
              {schema.compare.difficulty}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            by {schema.author} · {schema.compare.dictSize} 词库 · {schema.community.updateFrequency}
          </p>
          <p className="mt-2 text-sm text-gray-700">{schema.description}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          {schema.community.stars !== 'N/A' && (
            <Button variant="outline" size="sm" asChild>
              <a
                href={schema.links.repository ?? '#'}
                target="_blank"
                rel="noreferrer"
              >
                ⭐ {schema.community.stars}
              </a>
            </Button>
          )}
          <Button size="sm" onClick={handleUseSchema}>
            使用此方案
          </Button>
        </div>
      </div>

      {/* Links bar */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        {schema.links.official && (
          <a
            href={schema.links.official}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-blue-600 hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            官方网站
          </a>
        )}
        {schema.links.repository && (
          <a
            href={schema.links.repository}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-blue-600 hover:underline"
          >
            <Github className="h-3.5 w-3.5" />
            GitHub 仓库
          </a>
        )}
        {schema.links.documentation && schema.links.documentation !== schema.links.official && (
          <a
            href={schema.links.documentation}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-blue-600 hover:underline"
          >
            <BookOpen className="h-3.5 w-3.5" />
            官方文档
          </a>
        )}
        {schema.links.community.map((link) => (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-blue-600 hover:underline"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            {link.label}
          </a>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/schema-detail/SchemaHeader.tsx
git commit -m "feat: implement SchemaHeader with badges, links, and use-schema action"
```

---

## Task 9: SchemaIntroTab Component

**Files:**
- Modify: `src/features/schema-detail/SchemaIntroTab.tsx`

- [ ] **Step 1: Implement SchemaIntroTab**

```tsx
// src/features/schema-detail/SchemaIntroTab.tsx
import { Badge } from '@/components/ui/badge'
import type { SchemaDetail } from '@/types/schema'

const PLATFORM_ICONS: Record<string, string> = {
  macOS: '🍎',
  Windows: '🪟',
  Linux: '🐧',
  Android: '🤖',
  iOS: '📱',
}

export function SchemaIntroTab({ schema }: { schema: SchemaDetail }) {
  const paragraphs = schema.introduction.split('\n\n')
  const { compare, community } = schema

  return (
    <div className="space-y-6 py-4">
      {/* Introduction text */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold">简介</h3>
        {paragraphs.map((p, i) => (
          <p key={i} className="text-sm leading-relaxed text-gray-700">
            {p}
          </p>
        ))}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="词库规模" value={compare.dictSize} />
        <StatCard label="智能程度" value={compare.smartLevel} />
        <StatCard label="上手难度" value={compare.difficulty} />
        <StatCard label="更新频率" value={community.updateFrequency} />
      </div>

      {/* Features */}
      <div>
        <h3 className="mb-2 text-base font-semibold">功能特性</h3>
        <div className="flex flex-wrap gap-2">
          {compare.features.map((f) => (
            <Badge key={f} variant="secondary">
              {f}
            </Badge>
          ))}
        </div>
      </div>

      {/* Platforms */}
      <div>
        <h3 className="mb-2 text-base font-semibold">平台支持</h3>
        <div className="flex flex-wrap gap-2">
          {compare.platforms.map((p) => (
            <span
              key={p}
              className="rounded-md bg-gray-100 px-3 py-1.5 text-sm"
            >
              {PLATFORM_ICONS[p] ?? ''} {p}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 p-4 text-center">
      <div className="text-lg font-bold text-gray-900">{value}</div>
      <div className="mt-1 text-xs text-gray-500">{label}</div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/schema-detail/SchemaIntroTab.tsx
git commit -m "feat: implement SchemaIntroTab with stats, features, and platforms"
```

---

## Task 10: SchemaFeaturesTab + SchemaScreenshotsTab + SchemaResourcesTab

**Files:**
- Modify: `src/features/schema-detail/SchemaFeaturesTab.tsx`
- Modify: `src/features/schema-detail/SchemaScreenshotsTab.tsx`
- Modify: `src/features/schema-detail/SchemaResourcesTab.tsx`

- [ ] **Step 1: Implement SchemaFeaturesTab**

```tsx
// src/features/schema-detail/SchemaFeaturesTab.tsx
import { Badge } from '@/components/ui/badge'

export function SchemaFeaturesTab({ features }: { features: string[] }) {
  if (features.length === 0) {
    return <p className="py-4 text-sm text-gray-500">该方案暂无扩展功能信息。</p>
  }

  return (
    <div className="py-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {features.map((feature) => (
          <div
            key={feature}
            className="flex items-center gap-3 rounded-lg border p-3"
          >
            <Badge variant="secondary" className="shrink-0">
              {feature}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Implement SchemaScreenshotsTab**

```tsx
// src/features/schema-detail/SchemaScreenshotsTab.tsx
import { ImageOff } from 'lucide-react'

interface SchemaScreenshotsTabProps {
  schemaId: string
  screenshots: string[]
}

export function SchemaScreenshotsTab({
  schemaId,
  screenshots,
}: SchemaScreenshotsTabProps) {
  if (screenshots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <ImageOff className="mb-3 h-10 w-10" />
        <p className="text-sm">暂无截图</p>
        <p className="mt-1 text-xs">
          欢迎通过 PR 为该方案贡献截图
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 py-4 sm:grid-cols-2">
      {screenshots.map((filename) => (
        <img
          key={filename}
          src={`/screenshots/${schemaId}/${filename}`}
          alt={`${schemaId} screenshot`}
          className="rounded-lg border"
          loading="lazy"
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Implement SchemaResourcesTab**

```tsx
// src/features/schema-detail/SchemaResourcesTab.tsx
import { ExternalLink } from 'lucide-react'
import type { LearningResource } from '@/types/schema'

export function SchemaResourcesTab({
  resources,
}: {
  resources: LearningResource[]
}) {
  if (resources.length === 0) {
    return (
      <p className="py-4 text-sm text-gray-500">暂无学习资源。</p>
    )
  }

  return (
    <div className="grid gap-3 py-4 sm:grid-cols-2">
      {resources.map((resource) => (
        <a
          key={resource.url}
          href={resource.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-gray-50"
        >
          <span className="text-sm font-medium">{resource.title}</span>
          <ExternalLink className="h-4 w-4 shrink-0 text-gray-400" />
        </a>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Verify everything compiles and tests pass**

Run: `npx tsc --noEmit && npx vitest run 2>&1 | tail -15`
Expected: No type errors, all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/schema-detail/SchemaFeaturesTab.tsx src/features/schema-detail/SchemaScreenshotsTab.tsx src/features/schema-detail/SchemaResourcesTab.tsx
git commit -m "feat: implement features, screenshots, and resources tabs"
```

---

## Task 11: Enhance SchemaStep (Wizard)

**Files:**
- Modify: `src/features/wizard/steps/SchemaStep.tsx`

- [ ] **Step 1: Update SchemaStep to show richer cards**

Replace the current content of `src/features/wizard/steps/SchemaStep.tsx`:

```tsx
// src/features/wizard/steps/SchemaStep.tsx
import { Link } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { ALL_SCHEMAS } from '@/data/schema-data'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const TYPE_LABELS: Record<string, string> = {
  full_pinyin: '全拼',
  double_pinyin: '双拼',
  shape: '形码',
  mixed: '混合',
}

const DIFFICULTY_COLORS: Record<string, string> = {
  '简单': 'bg-green-100 text-green-800',
  '中等': 'bg-yellow-100 text-yellow-800',
  '困难': 'bg-red-100 text-red-800',
}

interface SchemaStepProps {
  value: string
  onChange: (schemaId: string) => void
}

export function SchemaStep({ value, onChange }: SchemaStepProps) {
  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold">选择输入方案</h2>
      <p className="mb-4 text-sm text-gray-500">
        选择一个输入方案作为默认方案，后续可在编辑器中添加更多方案。
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ALL_SCHEMAS.map((schema) => {
          const topFeatures = schema.compare.features.slice(0, 3).join(' · ')
          return (
            <Card
              key={schema.id}
              onClick={() => onChange(schema.id)}
              className={cn(
                'relative cursor-pointer p-4 transition-colors',
                value === schema.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'hover:border-gray-300',
              )}
            >
              {/* Top-right "了解更多" link */}
              <Link
                to={`/schema/${schema.id}`}
                target="_blank"
                onClick={(e) => e.stopPropagation()}
                className="absolute right-3 top-3 text-gray-400 hover:text-blue-600"
                title="了解更多"
              >
                <ExternalLink className="h-4 w-4" />
              </Link>

              <div className="flex items-center gap-2">
                <p className="font-semibold">{schema.name}</p>
                <Badge variant="secondary" className="text-xs">
                  {TYPE_LABELS[schema.type] ?? schema.type}
                </Badge>
                <Badge className={cn('text-xs', DIFFICULTY_COLORS[schema.compare.difficulty])}>
                  {schema.compare.difficulty}
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-gray-500">by {schema.author}</p>
              <p className="mt-1 text-sm text-gray-500">{schema.description}</p>
              {topFeatures && (
                <p className="mt-2 text-xs text-gray-400">
                  {schema.compare.dictSize} 词库 · {topFeatures}
                </p>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/wizard/steps/SchemaStep.tsx
git commit -m "feat: enhance wizard SchemaStep with author, difficulty, links, and features"
```

---

## Task 12: Enhance SchemaManager (Editor)

**Files:**
- Modify: `src/features/editor/modules/SchemaManager.tsx`

- [ ] **Step 1: Update SchemaManager with richer UI**

Replace the content of `src/features/editor/modules/SchemaManager.tsx`:

```tsx
// src/features/editor/modules/SchemaManager.tsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Github, Info } from 'lucide-react'
import { useConfigStore } from '@/stores/config-store'
import { ALL_SCHEMAS } from '@/data/schema-data'
import { SCHEMA_REGISTRY } from '@/data/schema-registry'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { LearnMoreLink } from '@/components/shared/LearnMoreLink'
import type { SchemaDetail } from '@/types/schema'

function getDetail(id: string): SchemaDetail | undefined {
  return ALL_SCHEMAS.find((s) => s.id === id)
}

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
    ;[next[index - 1], next[index]] = [next[index]!, next[index - 1]!]
    setSchemaList(next)
  }

  function handleMoveDown(index: number) {
    if (index === schemaList.length - 1) return
    const next = [...schemaList]
    ;[next[index], next[index + 1]] = [next[index + 1]!, next[index]!]
    setSchemaList(next)
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">输入方案管理</h3>
          <LearnMoreLink module="schema-manager" />
        </div>
        <p className="mt-1 text-sm text-gray-500">
          管理已启用的输入方案及其优先顺序。列表中排在前面的方案为默认方案。
        </p>
      </div>
      <div className="space-y-2">
        {schemaList.map((item, index) => {
          const detail = getDetail(item.schema)
          const info = SCHEMA_REGISTRY.find((s) => s.id === item.schema)
          return (
            <Card key={item.schema} className="flex items-center justify-between p-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{info?.name ?? item.schema}</p>
                  {detail && (
                    <Link
                      to={`/schema/${item.schema}`}
                      className="text-gray-400 hover:text-blue-600"
                      title="查看详情"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </Link>
                  )}
                  {/* External quick links */}
                  {detail?.links.repository && (
                    <a
                      href={detail.links.repository}
                      target="_blank"
                      rel="noreferrer"
                      className="text-gray-300 hover:text-gray-600"
                      title="GitHub"
                    >
                      <Github className="h-3.5 w-3.5" />
                    </a>
                  )}
                  {detail?.links.official && (
                    <a
                      href={detail.links.official}
                      target="_blank"
                      rel="noreferrer"
                      className="text-gray-300 hover:text-gray-600"
                      title="官网"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
                {info && <p className="text-sm text-gray-500">{info.description}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => handleMoveUp(index)} disabled={index === 0}>↑</Button>
                <Button variant="ghost" size="sm" onClick={() => handleMoveDown(index)} disabled={index === schemaList.length - 1}>↓</Button>
                <Button variant="ghost" size="sm" onClick={() => handleRemove(item.schema)}>删除</Button>
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
              <SelectTrigger><SelectValue placeholder="选择方案..." /></SelectTrigger>
              <SelectContent>
                {availableSchemas.map((s) => {
                  const detail = getDetail(s.id)
                  return (
                    <SelectItem key={s.id} value={s.id}>
                      <div>
                        <span>{s.name}</span>
                        {detail && (
                          <span className="ml-2 text-xs text-gray-400">
                            {detail.compare.difficulty} · {detail.compare.recommendation}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAdd} disabled={!addingSchema}>添加</Button>
        </div>
      )}
      <div className="text-center">
        <Link to="/compare" className="text-sm text-blue-600 hover:underline">
          浏览所有方案 →
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify it compiles and tests pass**

Run: `npx tsc --noEmit && npx vitest run 2>&1 | tail -15`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/editor/modules/SchemaManager.tsx
git commit -m "feat: enhance SchemaManager with detail links, external links, and richer dropdown"
```

---

## Task 13: Enhance SchemaCompare (Compare Page)

**Files:**
- Modify: `src/features/compare/SchemaCompare.tsx`

- [ ] **Step 1: Update SchemaCompare with links and new dimensions**

Replace the content of `src/features/compare/SchemaCompare.tsx`:

```tsx
// src/features/compare/SchemaCompare.tsx
import { Link, useNavigate } from 'react-router-dom'
import { ExternalLink, Github } from 'lucide-react'
import { useConfigStore } from '@/stores/config-store'
import { createEmptyProject } from '@/lib/config/defaults'
import { PRESETS } from '@/data/presets'
import { ALL_SCHEMAS } from '@/data/schema-data'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { SchemaCompareData } from '@/data/schema-compare-data'

interface SchemaCompareProps {
  schemas: SchemaCompareData[];
}

interface CompareRow {
  label: string;
  getValue: (s: SchemaCompareData) => string | string[];
}

const COMPARE_ROWS: CompareRow[] = [
  { label: '作者', getValue: (s) => s.author },
  { label: '输入方式', getValue: (s) => s.inputMethod },
  { label: '词库规模', getValue: (s) => s.dictSize },
  { label: '智能程度', getValue: (s) => s.smartLevel },
  { label: '辅助码', getValue: (s) => s.auxiliaryCode },
  { label: '扩展功能', getValue: (s) => s.features },
  { label: '平台支持', getValue: (s) => s.platforms },
  { label: '上手难度', getValue: (s) => s.difficulty },
  { label: '推荐人群', getValue: (s) => s.recommendation },
  // New dimensions
  {
    label: '更新活跃度',
    getValue: (s) => {
      const detail = ALL_SCHEMAS.find((d) => d.id === s.id)
      return detail?.community.updateFrequency ?? '未知'
    },
  },
  {
    label: '社区规模',
    getValue: (s) => {
      const detail = ALL_SCHEMAS.find((d) => d.id === s.id)
      return detail?.community.stars ?? 'N/A'
    },
  },
]

export function SchemaCompare({ schemas }: SchemaCompareProps) {
  const navigate = useNavigate()
  const loadProject = useConfigStore((s) => s.loadProject)

  function handleUseSchema(schema: SchemaCompareData) {
    const preset = schema.presetId ? PRESETS.find((p) => p.id === schema.presetId) : undefined
    if (preset) {
      loadProject(preset.createProject())
    } else {
      const project = createEmptyProject()
      project.defaultConfig.schemaList = [{ schema: schema.id }]
      loadProject(project)
    }
    navigate('/editor')
  }

  function isDifferent(row: CompareRow): boolean {
    if (schemas.length < 2) return false
    const values = schemas.map((s) => JSON.stringify(row.getValue(s)))
    return new Set(values).size > 1
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 bg-gray-50 px-4 py-3 text-left font-medium" />
            {schemas.map((s) => {
              const detail = ALL_SCHEMAS.find((d) => d.id === s.id)
              return (
                <th key={s.id} className="min-w-[200px] px-4 py-3 text-center">
                  <Link
                    to={`/schema/${s.id}`}
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    {s.name}
                  </Link>
                  {/* External links */}
                  <div className="mt-1 flex justify-center gap-2">
                    {detail?.links.repository && (
                      <a
                        href={detail.links.repository}
                        target="_blank"
                        rel="noreferrer"
                        className="text-gray-400 hover:text-gray-600"
                        title="GitHub"
                      >
                        <Github className="h-3.5 w-3.5" />
                      </a>
                    )}
                    {detail?.links.official && (
                      <a
                        href={detail.links.official}
                        target="_blank"
                        rel="noreferrer"
                        className="text-gray-400 hover:text-gray-600"
                        title="官网"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {COMPARE_ROWS.map((row) => {
            const diff = isDifferent(row)
            return (
              <tr key={row.label} className={cn(diff && 'bg-yellow-50')}>
                <td className="sticky left-0 bg-inherit px-4 py-2 font-medium text-gray-600">
                  {row.label}
                </td>
                {schemas.map((s) => {
                  const value = row.getValue(s)
                  return (
                    <td key={s.id} className="px-4 py-2 text-center">
                      {Array.isArray(value) ? (
                        <div className="flex flex-wrap justify-center gap-1">
                          {value.map((v) => (
                            <Badge key={v} variant="secondary" className="text-xs">
                              {v}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        value
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
          <tr>
            <td className="sticky left-0 px-4 py-3" />
            {schemas.map((s) => (
              <td key={s.id} className="px-4 py-3 text-center">
                <div className="flex justify-center gap-2">
                  <Button size="sm" onClick={() => handleUseSchema(s)}>
                    使用这个方案
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/schema/${s.id}`}>查看详情</Link>
                  </Button>
                </div>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Verify it compiles and tests pass**

Run: `npx tsc --noEmit && npx vitest run 2>&1 | tail -15`
Expected: No errors, all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/features/compare/SchemaCompare.tsx
git commit -m "feat: enhance SchemaCompare with clickable names, external links, and new dimensions"
```

---

## Task 14: Final Verification

- [ ] **Step 1: Full type check**

Run: `npx tsc --noEmit --pretty`
Expected: No errors.

- [ ] **Step 2: Run all tests**

Run: `npx vitest run`
Expected: All tests pass.

- [ ] **Step 3: Dev server smoke test**

Run: `npx vite --open` and manually verify:
1. Navigate to `/schema/rime_ice` — detail page loads with all tabs
2. Navigate to `/schema/double_pinyin_flypy` — keyboard layout tab visible and interactive
3. Navigate to `/wizard` — cards show author, difficulty, features, "了解更多" link
4. Navigate to `/editor` — schema manager shows detail links, external link icons
5. Navigate to `/compare` — schema names are clickable links, new rows visible, "查看详情" buttons work
6. Navigate to `/schema/nonexistent` — 404 page shows correctly

- [ ] **Step 4: Commit any final fixes, then create a summary commit**

```bash
git add -A
git commit -m "feat: complete schema detail system — detail pages, keyboard layout, enhanced UI"
```
