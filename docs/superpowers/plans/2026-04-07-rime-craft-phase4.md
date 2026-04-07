# Rime Craft Phase 4 Implementation Plan

## Context

Phases 1-3 complete: 8 editor modules, YAML editor, theme studio with 12 presets, input simulator, 17 tutorial articles, bidirectional linking. 76 tests, 25 commits. Phase 4 is the final phase — community features and user experience enhancements.

**Current state:** `/editor`, `/theme`, `/docs/*` routes exist. `lz-string` NOT installed. Schema registry has 8 schemas (need 10-15 for compare). No `/compare` or `/wizard` routes.

## Phase 4 Scope (design spec sections 7, 8.3, 11)

1. 方案对比工具 — side-by-side schema comparison
2. URL 分享 (lz-string) / JSON 文件分享
3. GitHub Gist 集成 (optional)
4. 配置展示画廊
5. 步骤向导 (新手引导入口)

---

## Task 1: Schema Compare Tool

**Why:** Users need to choose between input schemas — side-by-side comparison with rich data.

**Files to create:**
- `src/data/schema-compare-data.ts` — extended schema data with all comparison dimensions (10-15 schemas)
- `src/features/compare/SchemaCompare.tsx` — comparison table UI
- `src/features/compare/SchemaSelector.tsx` — schema selection (pick 2-4)
- `src/app/compare/ComparePage.tsx` — page layout

**Files to modify:**
- `src/App.tsx` — add `/compare` route (lazy)
- `src/app/layout/AppLayout.tsx` — add "方案对比" nav link

### Schema compare data format

```typescript
export interface SchemaCompareData {
  id: string;
  name: string;
  author: string;
  inputMethod: '全拼' | '双拼' | '形码' | '音形混合';
  dictSize: string;           // e.g., "200万+" 
  smartLevel: '基础' | '中等' | '高';
  auxiliaryCode: string;      // e.g., "直接辅助码" or "不支持"
  features: string[];         // e.g., ['Emoji', '符号输入', '反查']
  platforms: string[];        // e.g., ['macOS', 'Windows', 'Linux', 'Android', 'iOS']
  difficulty: '简单' | '中等' | '困难';
  recommendation: string;     // short description of who should use this
  presetId?: string;          // link to preset if available
}
```

10-15 schemas: 雾凇拼音, 万象拼音(标准), 万象拼音PRO, 小鹤音形, 自然码双拼, 微软双拼, 搜狗双拼, 朙月拼音, 地球拼音, 五笔86, 五笔98, 仓颉五代, 郑码.

### Compare UI

- Top: checkbox card grid to pick 2-4 schemas (not multi-select dropdown — shadcn Select is single-select only)
- Below: comparison table with rows = dimensions, columns = selected schemas
- Difference highlighting: cells that differ across selected schemas get highlighted
- "使用这个方案" button per column → creates minimal project with `createEmptyProject()` + sets schemaList, applies matching preset if one exists, navigates to `/editor`

---

## Task 2: URL Sharing + JSON Sharing

**Why:** Users need to share config snippets (URL) and full configs (JSON file).

**Install:** `npm install lz-string` (has built-in TypeScript types since v2, no separate @types needed)

**Files to create:**
- `src/lib/compress/share.ts` — compress/decompress config to/from URL params
- `src/lib/compress/share.test.ts`
- `src/features/share/ShareDialog.tsx` — share UI: URL copy + JSON download + JSON import
- `src/features/share/useShareUrl.ts` — hook to detect and apply shared URL on app load

**Files to modify:**
- `src/app/editor/EditorPage.tsx` — add "分享" button
- `src/App.tsx` — apply shared URL params on load

### URL sharing flow

```
User clicks "分享" → ShareDialog opens
  → "URL 分享" tab: generates lz-string compressed URL for current module's config
  → Shows URL + copy button
  → Warning if URL > 2000 chars: "URL 过长，建议使用文件分享"

Recipient opens URL → app detects `?share=...` param
  → decompresses → applies to store → shows notification
```

### JSON sharing flow

Use a versioned snapshot format for forward compatibility:
```typescript
interface ConfigSnapshot {
  version: 1;
  createdAt: string;
  project: RimeProject;
}
```

```
Export: wrap RimeProject in ConfigSnapshot → download as .json file
Import: upload .json → validate version + structure → extract project → loadProject()
```

### Key functions

```typescript
// share.ts
export function compressConfig(config: Record<string, unknown>): string
  // JSON.stringify → lz-string compressToEncodedURIComponent

export function decompressConfig(compressed: string): Record<string, unknown>
  // lz-string decompressFromEncodedURIComponent → JSON.parse

export function generateShareUrl(module: EditorModule, project: RimeProject): string
  // extract module config → compress → append to current URL as ?share=...&module=...

export function parseShareUrl(url: string): { module: EditorModule; config: Record<string, unknown> } | null
```

---

## Task 3: GitHub Gist Integration (Optional)

**Why:** Power users want to save/load configs via GitHub Gist for version history.

**Files to create:**
- `src/features/share/GistDialog.tsx` — Gist export/import UI
- `src/lib/gist/client.ts` — GitHub Gist API client (fetch-based, no extra deps)

### Gist client

```typescript
// Uses fetch() directly — no GitHub SDK needed
export async function createGist(token: string, config: RimeProject, description: string): Promise<string>
  // POST https://api.github.com/gists → returns gist URL

export async function loadPublicGist(gistId: string): Promise<RimeProject>
  // GET https://api.github.com/gists/{gistId} → no auth needed for public gists
```

### UI

- "导出到 Gist" — prompts for PAT (stored in sessionStorage), creates gist, shows URL
- "从 Gist 导入" — paste gist URL, loads config (no auth needed for public gists)
- Security notice: explains minimal permissions, sessionStorage (not localStorage)

### Scope for Phase 4

Keep it simple:
- Export entire config as a single JSON file in the Gist
- Import by Gist URL or Gist ID
- No OAuth flow — just PAT input
- Clear security warnings

---

## Task 4: Configuration Gallery

**Why:** Curated community configs inspire users and provide starting points.

**Files to create:**
- `src/data/gallery.ts` — curated gallery entries (5-8 example configs)
- `src/features/gallery/GalleryCard.tsx` — individual config card
- `src/features/gallery/GalleryGrid.tsx` — gallery grid layout
- `src/app/gallery/GalleryPage.tsx` — gallery page

**Files to modify:**
- `src/App.tsx` — add `/gallery` route (lazy)
- `src/app/home/HomePage.tsx` — add gallery entry link (secondary, not in main nav to avoid crowding)

### Gallery data format

```typescript
export interface GalleryEntry {
  id: string;
  name: string;
  author: string;
  description: string;
  tags: string[];               // e.g., ['双拼', '小鹤', '简洁']
  presetId?: string;            // reference existing preset instead of duplicating data
  themePresetName?: string;     // reference existing theme preset
  configOverrides?: Partial<DefaultConfig>;  // only store diffs from preset
  config?: RimeProject;         // full config (only if no preset match)
}
```

### Gallery UI

- Grid of cards, each showing: name, author, tags, theme preview (mini CandidatePreview)
- Click card → shows detail dialog with full preview
- "使用此配置" button → loads config into store, navigates to `/editor`
- Filterable by tags

### Initial gallery entries (5-8)

Bundled in the app as static data. Examples:
- "极简全拼" — minimal setup for beginners
- "小鹤双拼 + Nord 主题" — popular combo
- "雾凇拼音全家桶" — feature-rich setup
- "五笔极客" — minimal wubi setup
- "macOS 原生风格" — native-looking theme

---

## Task 5: Step-by-Step Wizard

**Why:** New users need guided setup — the wizard walks them through key decisions.

**Files to create:**
- `src/features/wizard/WizardPage.tsx` — multi-step wizard container
- `src/features/wizard/steps/PlatformStep.tsx` — choose target platform
- `src/features/wizard/steps/SchemaStep.tsx` — choose input schema
- `src/features/wizard/steps/BasicConfigStep.tsx` — page size, select keys, key bindings
- `src/features/wizard/steps/ThemeStep.tsx` — pick a preset theme
- `src/features/wizard/steps/ExportStep.tsx` — review + export

**Files to modify:**
- `src/App.tsx` — add `/wizard` route
- `src/app/home/HomePage.tsx` — add "新手向导" entry point button

### Wizard flow

```
Step 1: 选择平台     → macOS / Windows / Linux / Android / iOS
Step 2: 选择方案     → show popular schemas with descriptions, let user pick
Step 3: 基础配置     → page size slider, shift key behavior, common app settings
Step 4: 选择主题     → preset theme grid (mini previews), pick one
Step 5: 完成导出     → summary of choices, two buttons: "导出配置"(download zip) + "继续编辑"(load into store, navigate to /editor)
```

Wizard uses **local state** (useState/useReducer) during the flow — does NOT write to the Zustand store until the user clicks "完成" on the final step. This avoids polluting the main store with half-configured state if the user abandons the wizard.

### Integration

- Home page: "新手？试试向导" button alongside existing "开始配置"
- Editor header: small "向导" link for users who want to restart

---

## Task Dependency Order

```
Task 1 (compare tool) — independent
Task 2 (URL + JSON sharing) — independent
Task 3 (Gist) — depends on Task 2 for sharing UI patterns
Task 4 (gallery) — independent
Task 5 (wizard) — independent, but best done last (uses all prior features)
```

Tasks 1, 2, 4 can be parallelized. Suggested execution: 1 → 2 → 4 → 3 → 5

---

## Verification

After all tasks:
1. `npx tsc -b` — clean
2. `npx vitest run` — all tests pass
3. `npx vite build` — succeeds
4. Manual: `/compare` — select schemas, compare side by side, click "使用方案"
5. Manual: share config via URL — copy URL, open in new tab, verify config loads
6. Manual: export/import JSON snapshot
7. Manual: Gist export (if PAT provided) and public Gist import
8. Manual: `/gallery` — browse configs, click "使用", verify loads in editor
9. Manual: `/wizard` — complete all 5 steps, export config
