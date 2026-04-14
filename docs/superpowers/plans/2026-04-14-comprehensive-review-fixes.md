# Comprehensive Review Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all issues identified in the full-project review: security vulnerabilities, code duplication, loose types, runtime inefficiencies, oversized module, and missing test coverage.

**Architecture:** Six sequential batches organized by domain. Batches 1/3/4 are independent and can run in parallel. Batch 2 must precede Batch 5. Batch 6 (tests) runs last after all code changes stabilize.

**Tech Stack:** React 18 + TypeScript (strict) + Zustand + Vite + Vitest + Testing Library

**Spec:** `docs/superpowers/specs/2026-04-14-comprehensive-review-fixes-design.md`

---

## Batch 1: Security Hardening

### Task 1: Prototype pollution guard in setNestedValue

**Files:**
- Modify: `src/lib/yaml/parser.ts:68-82`
- Test: `src/lib/yaml/parser.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `src/lib/yaml/parser.test.ts`:

```typescript
describe('prototype pollution protection', () => {
  it('ignores __proto__ in slash-delimited paths', () => {
    const before = ({} as Record<string, unknown>).__proto__
    const result = expandPatchPaths({ '__proto__/polluted': 'yes' })
    expect(result).toEqual({})
    expect(({} as Record<string, unknown>).__proto__).toBe(before)
  })

  it('ignores constructor in slash-delimited paths', () => {
    const result = expandPatchPaths({ 'constructor/prototype/polluted': 'yes' })
    expect(result).toEqual({})
  })

  it('ignores prototype as a final key segment', () => {
    const result = expandPatchPaths({ 'foo/prototype': 'yes' })
    expect(result).toEqual({})
  })

  it('allows safe keys that are substrings of dangerous keys', () => {
    const result = expandPatchPaths({ 'proto/value': 42 })
    expect(result).toEqual({ proto: { value: 42 } })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/yaml/parser.test.ts`
Expected: FAIL — `__proto__` pollution tests fail because `setNestedValue` writes to `__proto__`.

- [ ] **Step 3: Implement the fix**

In `src/lib/yaml/parser.ts`, replace the existing `setNestedValue` function (lines 68-82) with:

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/yaml/parser.test.ts`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/yaml/parser.ts src/lib/yaml/parser.test.ts
git commit -m "fix(security): guard setNestedValue against prototype pollution"
```

---

### Task 2: URL decompression size limits

**Files:**
- Modify: `src/lib/compress/share.ts:66-78`
- Test: `src/lib/compress/share.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `src/lib/compress/share.test.ts`:

```typescript
describe('decompressConfig size limits', () => {
  it('rejects compressed input longer than 50KB', () => {
    const oversized = 'a'.repeat(50_001)
    expect(decompressConfig(oversized)).toBeNull()
  })

  it('accepts compressed input at exactly 50KB', () => {
    // This will likely return null because 'a'.repeat(50000) is not valid LZ,
    // but the function should not throw
    const atLimit = 'a'.repeat(50_000)
    expect(() => decompressConfig(atLimit)).not.toThrow()
  })
})
```

- [ ] **Step 2: Run tests to verify the first test fails**

Run: `npx vitest run src/lib/compress/share.test.ts`
Expected: FAIL — currently decompressConfig attempts to decompress any length.

- [ ] **Step 3: Implement size limits**

In `src/lib/compress/share.ts`, add constants and modify `decompressConfig`:

```typescript
const MAX_COMPRESSED_LENGTH = 50_000
const MAX_DECOMPRESSED_LENGTH = 500_000

export function decompressConfig(compressed: string): Record<string, unknown> | null {
  if (compressed.length > MAX_COMPRESSED_LENGTH) return null
  try {
    const json = LZString.decompressFromEncodedURIComponent(compressed)
    if (!json || json.length > MAX_DECOMPRESSED_LENGTH) return null
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return null
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/compress/share.test.ts`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/compress/share.ts src/lib/compress/share.test.ts
git commit -m "fix(security): add size limits to URL decompression"
```

---

### Task 3: File upload size limits

**Files:**
- Modify: `src/features/share/ImportDialog.tsx:15-30`

- [ ] **Step 1: Add size check to ImportDialog**

In `src/features/share/ImportDialog.tsx`, modify `handleFileUpload` to add a size check before reading:

```typescript
const MAX_FILE_SIZE = 5 * 1024 * 1024

const handleFileUpload = useCallback(
  async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (!fileList?.length) return
    const files: { name: string; content: string }[] = []
    for (const file of Array.from(fileList)) {
      if (file.size > MAX_FILE_SIZE) {
        setFeedback('文件过大，最大支持 5MB')
        return
      }
      const content = await file.text()
      files.push({ name: file.name, content })
    }
    const result = importFromFiles(files)
    replaceWorkspace(result.project, result.sourceFiles)
    const msg = `已导入 ${result.summary.filesProcessed} 个文件，识别到 ${result.summary.customSettings} 项自定义配置。`
    setFeedback(result.summary.errors.length > 0 ? `${msg}\n错误：${result.summary.errors.join('; ')}` : msg)
  },
  [replaceWorkspace],
)
```

- [ ] **Step 2: Verify build passes**

Run: `npx tsc -b && npm run build`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/share/ImportDialog.tsx
git commit -m "fix(security): reject file uploads larger than 5MB"
```

---

### Task 4: Gist ID validation

**Files:**
- Modify: `src/lib/gist/client.ts:100-109`

- [ ] **Step 1: Implement the validation**

In `src/lib/gist/client.ts`, replace the `extractGistId` function:

```typescript
function extractGistId(input: string): string {
  const trimmed = input.trim()
  // Handle full URL: https://gist.github.com/username/gistid
  const urlMatch = trimmed.match(/gist\.github\.com\/[^/]+\/([a-f0-9]+)/i)
  if (urlMatch?.[1]) return urlMatch[1]
  // Handle API URL: https://api.github.com/gists/gistid
  const apiMatch = trimmed.match(/api\.github\.com\/gists\/([a-f0-9]+)/i)
  if (apiMatch?.[1]) return apiMatch[1]
  // Validate raw ID is hex only
  if (/^[a-f0-9]+$/i.test(trimmed)) return trimmed
  throw new Error('无效的 Gist ID 格式')
}
```

- [ ] **Step 2: Verify build passes**

Run: `npx tsc -b`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/gist/client.ts
git commit -m "fix(security): validate Gist ID format before URL interpolation"
```

---

### Task 5: Remove GitHub PAT from sessionStorage

**Files:**
- Modify: `src/features/share/GistDialog.tsx:17,35`

- [ ] **Step 1: Remove sessionStorage usage**

In `src/features/share/GistDialog.tsx`:

1. Change line 17 from:
```typescript
const [token, setToken] = useState(() => sessionStorage.getItem('gh_gist_token') ?? '')
```
to:
```typescript
const [token, setToken] = useState('')
```

2. Remove line 35:
```typescript
sessionStorage.setItem('gh_gist_token', token)
```

3. Update the info text (line 81) from:
```
Token 仅在当前会话中保存，关闭页面后自动清除。
```
to:
```
Token 仅在当前对话框中使用，不会被存储。
```

- [ ] **Step 2: Verify build passes**

Run: `npx tsc -b`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/share/GistDialog.tsx
git commit -m "fix(security): keep GitHub PAT in component state only"
```

---

### Task 6: Add Content-Security-Policy

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add CSP meta tag**

In `index.html`, add after the `<meta name="viewport" ...>` line:

```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://api.github.com; img-src 'self' data:;" />
```

- [ ] **Step 2: Verify the app still loads**

Run: `npm run build && npm run preview`
Manually verify the app loads without CSP violations in the browser console.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "fix(security): add Content-Security-Policy meta tag"
```

---

### Task 7: Batch 1 verification

- [ ] **Step 1: Run full validation**

```bash
npx tsc -b && npm test && npm run build
```

Expected: Zero errors, all 225+ tests pass, build succeeds.

---

## Batch 2: Shared Module Extraction

### Task 8: Extract patch-utils.ts

**Files:**
- Create: `src/lib/yaml/patch-utils.ts`
- Modify: `src/lib/yaml/module-yaml.ts:429-477`
- Modify: `src/lib/workspace/source-files.ts:108-166`

- [ ] **Step 1: Create the shared module**

Create `src/lib/yaml/patch-utils.ts`:

```typescript
import { parseDocument } from 'yaml'

export function flattenPatchEntries(
  value: Record<string, unknown>,
  path: string[] = [],
): Array<{ path: string[]; value: unknown }> {
  const entries: Array<{ path: string[]; value: unknown }> = []

  for (const [key, child] of Object.entries(value)) {
    const nextPath = [...path, key]

    if (
      child &&
      typeof child === 'object' &&
      !Array.isArray(child) &&
      Object.keys(child as Record<string, unknown>).length > 0
    ) {
      entries.push(...flattenPatchEntries(child as Record<string, unknown>, nextPath))
      continue
    }

    entries.push({ path: nextPath, value: child })
  }

  return entries
}

export function isYamlMapNodeEmpty(node: unknown): node is { items: unknown[] } {
  return (
    typeof node === 'object' &&
    node !== null &&
    'items' in node &&
    Array.isArray((node as { items: unknown[] }).items) &&
    (node as { items: unknown[] }).items.length === 0
  )
}

export function pruneEmptyParents(
  doc: ReturnType<typeof parseDocument>,
  path: string[],
): void {
  for (let depth = path.length - 1; depth > 0; depth -= 1) {
    const currentPath = ['patch', ...path.slice(0, depth)]
    const node = doc.getIn(currentPath, true)
    if (!isYamlMapNodeEmpty(node)) {
      break
    }
    doc.deleteIn(currentPath)
  }
}
```

- [ ] **Step 2: Update module-yaml.ts to import from patch-utils**

In `src/lib/yaml/module-yaml.ts`:
1. Add import at top: `import { flattenPatchEntries, isYamlMapNodeEmpty, pruneEmptyParents } from './patch-utils'`
2. Delete the local `flattenPatchEntries` function (lines ~429-452)
3. Delete the local `isYamlMapNodeEmpty` function (lines ~458-466)
4. Delete the local `pruneEmptyParents` function (lines ~468-477)
5. Keep `pathKey` — it is module-yaml-specific.

- [ ] **Step 3: Update source-files.ts to import from patch-utils**

In `src/lib/workspace/source-files.ts`:
1. Add import: `import { flattenPatchEntries, isYamlMapNodeEmpty, pruneEmptyParents } from '@/lib/yaml/patch-utils'`
2. Delete the local `flattenPatchEntries` function (lines ~108-133)
3. Delete the local `isYamlMapNodeEmpty` function (lines ~147-152)
4. Delete the local `pruneEmptyParents` function (lines ~154-166)
5. Keep `normalizePathSegment`, `normalizePatchPath`, `normalizedPathKey`, `getBasePathKey` — they are source-files-specific.

- [ ] **Step 4: Run tests to verify nothing broke**

Run: `npx vitest run`
Expected: ALL 225 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/yaml/patch-utils.ts src/lib/yaml/module-yaml.ts src/lib/workspace/source-files.ts
git commit -m "refactor: extract shared patch-utils from module-yaml and source-files"
```

---

### Task 9: Extract validators.ts

**Files:**
- Create: `src/lib/workspace/validators.ts`
- Modify: `src/lib/workspace/storage.ts:4-67`
- Modify: `src/lib/compress/share.ts:21-48`

- [ ] **Step 1: Create the shared validators module**

Create `src/lib/workspace/validators.ts`:

```typescript
export const SOURCE_FILE_KINDS = new Set<string>([
  'default',
  'platform',
  'schema',
  'custom_phrase',
])

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const hasRequiredKey = (
  value: Record<string, unknown>,
  key: string,
): boolean => Object.prototype.hasOwnProperty.call(value, key)

export const isValidSourceFile = (value: unknown): boolean => {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.id === 'string' &&
    typeof value.fileName === 'string' &&
    typeof value.kind === 'string' &&
    SOURCE_FILE_KINDS.has(value.kind) &&
    typeof value.content === 'string' &&
    typeof value.updatedAt === 'string' &&
    (value.platform === undefined ||
      value.platform === 'macos' ||
      value.platform === 'windows') &&
    (value.schemaId === undefined || typeof value.schemaId === 'string')
  )
}

export const isValidProject = (value: unknown): boolean => {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.targetPlatform === 'string' &&
    hasRequiredKey(value, 'defaultConfig') &&
    hasRequiredKey(value, 'platformConfig') &&
    value.defaultConfig !== null &&
    value.defaultConfig !== undefined &&
    value.platformConfig !== null &&
    value.platformConfig !== undefined &&
    isRecord(value.schemaConfigs) &&
    Array.isArray(value.customPhrases) &&
    isRecord(value.preserved)
  )
}
```

- [ ] **Step 2: Update storage.ts to import from validators**

In `src/lib/workspace/storage.ts`:
1. Add import: `import { isRecord, isValidSourceFile, isValidProject } from './validators'`
2. Delete the local `SOURCE_FILE_KINDS` constant (line 4-8)
3. Delete the local `isRecord` function (line 11-12)
4. Delete the local `hasRequiredKey` function (line 14-17)
5. Delete the local `isValidProject` function (line 19-36)
6. Delete the local `isValidSourceFile` function (line 50-67)
7. Keep `isValidEditorUI` and `isWorkspaceSnapshot` — they are storage-specific.

- [ ] **Step 3: Update share.ts to import from validators**

In `src/lib/compress/share.ts`:
1. Add import: `import { isRecord, isValidSourceFile, isValidProject } from '@/lib/workspace/validators'`
2. Delete the local `SOURCE_FILE_KINDS` constant (line 21-26)
3. Delete the local `isRecord` function (line 28-29)
4. Delete the local `isPersistedSourceFile` function (line 31-48)
5. In `normalizeSnapshotSourceFiles`, replace `isPersistedSourceFile` with `isValidSourceFile`.

- [ ] **Step 4: Add project validation to parseConfigSnapshot**

In `src/lib/compress/share.ts`, in the `parseConfigSnapshot` function, add the `isValidProject` check after the `typeof` check:

Replace:
```typescript
if (!parsed.project || typeof parsed.project !== 'object') {
  return { error: '无效的配置快照：缺少 project 字段' }
}

const project = structuredClone(parsed.project as RimeProject)
```

With:
```typescript
if (!parsed.project || typeof parsed.project !== 'object') {
  return { error: '无效的配置快照：缺少 project 字段' }
}
if (!isValidProject(parsed.project)) {
  return { error: '无效的配置快照：project 结构不完整' }
}

const project = structuredClone(parsed.project as RimeProject)
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run`
Expected: ALL PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/workspace/validators.ts src/lib/workspace/storage.ts src/lib/compress/share.ts
git commit -m "refactor: extract shared validators from storage and share modules"
```

---

### Task 10: Batch 2 verification

- [ ] **Step 1: Run full validation**

```bash
npx tsc -b && npm test && npm run build
```

Expected: Zero errors, all tests pass, build succeeds.

---

## Batch 3: Type System Strengthening

### Task 11: EditorModule literal union type

**Files:**
- Modify: `src/types/config.ts:264`
- Modify: `src/data/module-registry.ts:14,146`
- Modify: `src/lib/yaml/module-yaml.ts:46`
- Modify: `src/lib/compress/share.ts:101-113`

- [ ] **Step 1: Change EditorModule to literal union**

In `src/types/config.ts`, replace line 264:

```typescript
export type EditorModule = string;
```

with:

```typescript
export type EditorModule =
  | 'schema-manager'
  | 'candidate-settings'
  | 'key-bindings'
  | 'switches'
  | 'fuzzy-pinyin'
  | 'spelling-scheme'
  | 'auxiliary-code'
  | 'reverse-lookup'
  | 'punctuation'
  | 'dictionary'
  | 'lua-extensions'
  | 'ascii-mode'
  | 'candidate-display'
  | 'comment-hints'
```

- [ ] **Step 2: Update ModuleDefinition.id type**

In `src/data/module-registry.ts`, change `ModuleDefinition` interface (line 14):

```typescript
export interface ModuleDefinition {
  id: EditorModule
  label: string
  group: ModuleGroup
  tutorialSlug?: string
  applicability: SchemaApplicability
  getModifiedCount?: (project: RimeProject) => number
}
```

Add the import if not present: `import type { EditorModule } from '@/types/config'` (it's already imported via `RimeProject`).

- [ ] **Step 3: Update MODULE_COMPONENTS type**

In `src/data/module-registry.ts`, change line 146:

```typescript
export const MODULE_COMPONENTS: Record<EditorModule, React.LazyExoticComponent<React.ComponentType>> = {
```

- [ ] **Step 4: Fix MODULE_KEY_MAP type in module-yaml.ts**

In `src/lib/yaml/module-yaml.ts`, line 46, the type is already `Record<EditorModule, ModuleKeyMapping[]>`. Since `EditorModule` was `string`, this will now properly constrain keys. No code change needed if all 14 modules are present. Verify with `tsc`.

- [ ] **Step 5: Add runtime validation in parseShareUrl**

In `src/lib/compress/share.ts`, add a module validation set and use it in `parseShareUrl`:

```typescript
const VALID_MODULES: Set<string> = new Set<EditorModule>([
  'schema-manager', 'candidate-settings', 'key-bindings', 'switches',
  'fuzzy-pinyin', 'spelling-scheme', 'auxiliary-code', 'reverse-lookup',
  'punctuation', 'dictionary', 'lua-extensions', 'ascii-mode',
  'candidate-display', 'comment-hints',
])

export function parseShareUrl(
  search: string,
): { module: EditorModule; yaml: string } | null {
  const params = new URLSearchParams(search)
  const shareParam = params.get('share')
  if (!shareParam) return null

  const data = decompressConfig(shareParam)
  if (!data || typeof data.module !== 'string' || typeof data.yaml !== 'string')
    return null

  if (!VALID_MODULES.has(data.module)) return null

  return { module: data.module as EditorModule, yaml: data.yaml }
}
```

- [ ] **Step 6: Fix any remaining type errors**

Run: `npx tsc -b 2>&1 | head -30`

If there are errors where `string` is passed where `EditorModule` is expected, fix them. Common locations:
- `config-store.ts`: `activeModule` field initialization uses `'schema-manager'` literal — should be fine.
- Any place that casts `string` to `EditorModule` needs a runtime check or the caller needs to be typed correctly.

- [ ] **Step 7: Run tests**

Run: `npx vitest run`
Expected: ALL PASS.

- [ ] **Step 8: Commit**

```bash
git add src/types/config.ts src/data/module-registry.ts src/lib/yaml/module-yaml.ts src/lib/compress/share.ts
git commit -m "refactor: narrow EditorModule to string literal union type"
```

---

## Batch 4: Store & Runtime Optimization

### Task 12: Extract updateSchemaField helper

**Files:**
- Modify: `src/stores/config-store.ts:108-305`

- [ ] **Step 1: Add helper and simplify actions**

In `src/stores/config-store.ts`, inside the `create()` callback, after the `updateProjectWorkspace` function, add:

```typescript
const updateSchemaField = <K extends keyof SchemaConfig>(
  schemaId: string,
  field: K,
  value: SchemaConfig[K],
): void => {
  const state = get()
  const project = {
    ...state.project,
    schemaConfigs: {
      ...state.project.schemaConfigs,
      [schemaId]: {
        ...(state.project.schemaConfigs[schemaId] ?? { schemaId, fuzzyRules: [] }),
        schemaId,
        [field]: value,
      },
    },
  }
  updateProjectWorkspace(project)
}
```

Then replace the three action bodies:

```typescript
setFuzzyRules: (schemaId, rules) => updateSchemaField(schemaId, 'fuzzyRules', rules),

setSwitches: (schemaId, switches) => updateSchemaField(schemaId, 'switches', switches),

setPunctuator: (schemaId, punctuator) => updateSchemaField(schemaId, 'punctuator', punctuator),
```

Add `SchemaConfig` to the imports if not already there (it is already imported).

- [ ] **Step 2: Run tests**

Run: `npx vitest run src/stores/config-store.test.ts`
Expected: ALL PASS.

- [ ] **Step 3: Commit**

```bash
git add src/stores/config-store.ts
git commit -m "refactor: extract updateSchemaField helper in config store"
```

---

### Task 13: Debounce localStorage persistence

**Files:**
- Modify: `src/stores/config-store.ts:38-55`

- [ ] **Step 1: Implement debounce**

In `src/stores/config-store.ts`, replace the `persistCurrentState` function:

```typescript
let persistTimer: ReturnType<typeof setTimeout> | undefined

const persistCurrentState = (
  project: RimeProject,
  activeModule: EditorModule,
  editorUI: EditorUIState,
  sourceFiles: Record<string, PersistedSourceFile>,
): void => {
  clearTimeout(persistTimer)
  persistTimer = setTimeout(() => {
    saveWorkspaceSnapshot({
      version: 1,
      savedAt: new Date().toISOString(),
      project,
      editorUI: {
        activeModule,
        viewMode: editorUI.viewMode,
        tutorialCollapsed: editorUI.tutorialCollapsed,
      },
      sourceFiles,
    })
  }, 500)
}
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run`
Expected: ALL PASS. (Existing tests don't depend on synchronous persist timing.)

- [ ] **Step 3: Commit**

```bash
git add src/stores/config-store.ts
git commit -m "perf: debounce localStorage persistence to reduce UI jank"
```

---

### Task 14: Eliminate duplicate initial project creation

**Files:**
- Modify: `src/stores/config-store.ts:124-129`

- [ ] **Step 1: Reuse single initial project**

In `src/stores/config-store.ts`, inside the `create()` callback `return` block, replace:

```typescript
project: createInitialProject(),
activeModule: 'schema-manager',
isDirty: false,
editorUI: createDefaultEditorUI(),
sourceFiles: createSourceFilesFromProject(createInitialProject()),
```

with:

```typescript
project: initialProject,
activeModule: 'schema-manager',
isDirty: false,
editorUI: createDefaultEditorUI(),
sourceFiles: createSourceFilesFromProject(initialProject),
```

And add before the `return`:

```typescript
const initialProject = createInitialProject()
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run src/stores/config-store.test.ts`
Expected: ALL PASS.

- [ ] **Step 3: Commit**

```bash
git add src/stores/config-store.ts
git commit -m "refactor: eliminate duplicate createInitialProject call in store init"
```

---

### Task 15: Add ModuleErrorBoundary

**Files:**
- Create: `src/components/shared/ModuleErrorBoundary.tsx`
- Modify: `src/features/editor/EditorContent.tsx`

- [ ] **Step 1: Create ModuleErrorBoundary component**

Create `src/components/shared/ModuleErrorBoundary.tsx`:

```typescript
import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'

interface Props {
  moduleName: string
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ModuleErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`模块「${this.props.moduleName}」渲染出错:`, error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-md border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
          模块「{this.props.moduleName}」加载出错，请刷新页面重试。
        </div>
      )
    }
    return this.props.children
  }
}
```

- [ ] **Step 2: Wrap Suspense in EditorContent**

In `src/features/editor/EditorContent.tsx`, add the import:

```typescript
import { ModuleErrorBoundary } from '@/components/shared/ModuleErrorBoundary'
```

Then wrap the Suspense:

```tsx
return (
  <div className="flex-1 overflow-y-auto p-6">
    <div className="mx-auto max-w-2xl">
      <ModuleWrapper module={activeModule}>
        <ModuleErrorBoundary moduleName={activeModule}>
          <Suspense fallback={<div className="text-gray-400">加载中...</div>}>
            <Component />
          </Suspense>
        </ModuleErrorBoundary>
      </ModuleWrapper>
    </div>
  </div>
)
```

- [ ] **Step 3: Verify build**

Run: `npx tsc -b`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/shared/ModuleErrorBoundary.tsx src/features/editor/EditorContent.tsx
git commit -m "feat: add ErrorBoundary around lazy-loaded editor modules"
```

---

### Task 16: DarkModeToggle safe localStorage access

**Files:**
- Modify: `src/components/shared/DarkModeToggle.tsx:10-18`

- [ ] **Step 1: Wrap localStorage in try-catch**

In `src/components/shared/DarkModeToggle.tsx`, replace the `useEffect`:

```typescript
useEffect(() => {
  document.documentElement.classList.toggle('dark', dark)
  try {
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  } catch {
    // Silently ignore in restricted environments
  }
}, [dark])
```

- [ ] **Step 2: Verify build**

Run: `npx tsc -b`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/shared/DarkModeToggle.tsx
git commit -m "fix: wrap DarkModeToggle localStorage access in try-catch"
```

---

### Task 17: Improve key bindings diff comparison

**Files:**
- Modify: `src/lib/config/diff.ts:38-41`
- Test: `src/lib/config/diff.test.ts`

- [ ] **Step 1: Write a failing test**

Add to `src/lib/config/diff.test.ts`:

```typescript
it('detects changed key bindings with same length', () => {
  const config: DefaultConfig = {
    ...DEFAULT_CONFIG,
    keyBinder: {
      bindings: [{ when: 'composing', accept: 'Tab', send: 'Page_Down' }],
    },
  }
  const modified = getModifiedFields(config)
  expect(modified.has('keyBinder.bindings')).toBe(true)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/config/diff.test.ts`
Expected: FAIL if default bindings is also length 1 with different content. (Currently default bindings is `[]`, so adding any binding changes length and this test would pass. Adjust the test to use the actual default length scenario.)

Since `DEFAULT_CONFIG.keyBinder.bindings` is `[]` (length 0), any addition changes length. The real improvement protects against future default bindings. Implement the fix anyway for correctness:

- [ ] **Step 3: Implement content comparison**

In `src/lib/config/diff.ts`, replace lines 38-41:

```typescript
// Key bindings: compare content
if (JSON.stringify(current.keyBinder.bindings) !== JSON.stringify(DEFAULT_CONFIG.keyBinder.bindings)) {
  modified.add('keyBinder.bindings')
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/lib/config/diff.test.ts`
Expected: ALL PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/config/diff.ts src/lib/config/diff.test.ts
git commit -m "fix: use content comparison for key bindings diff"
```

---

### Task 18: Batch 4 verification

- [ ] **Step 1: Run full validation**

```bash
npx tsc -b && npm test && npm run build
```

Expected: Zero errors, all tests pass, build succeeds.

---

## Batch 5: Architecture Refactoring — module-yaml.ts Split

### Task 19: Create module-key-map.ts

**Files:**
- Create: `src/lib/yaml/module-key-map.ts`
- Modify: `src/lib/yaml/module-yaml.ts`

- [ ] **Step 1: Create module-key-map.ts**

Extract from `src/lib/yaml/module-yaml.ts` into a new file `src/lib/yaml/module-key-map.ts`:

1. The `ModuleKeyMapping` interface (lines ~39-44)
2. The `MODULE_KEY_MAP` constant (lines ~46-90)
3. The `CANDIDATE_SETTINGS_TRANSLATOR_FIELDS` constant (lines ~92-101)
4. The `COMMENT_HINTS_TRANSLATOR_FIELDS` constant (nearby)
5. `getModuleMappings` function (line ~479-481)
6. `getModuleSourceFileName` function (lines ~483-504)
7. `mappingMatchesSourceFile` function (lines ~506-519)
8. `createEmptySourceFile` function (lines ~521-544)
9. `resolveModuleSourceFile` function (lines ~546-557)
10. `filterModulePatch` function (if present)

The file should have all necessary imports from `@/types/config`, `@/lib/product/support-contract`, `@/lib/yaml/serializer`, `@/lib/workspace/types`, and `@/lib/config/defaults`.

Export all public functions and types.

- [ ] **Step 2: Update module-yaml.ts to import from module-key-map**

Replace all deleted definitions with imports from `'./module-key-map'`.

- [ ] **Step 3: Run tests**

Run: `npx vitest run src/lib/yaml/module-yaml.test.ts`
Expected: ALL PASS.

- [ ] **Step 4: Commit**

```bash
git add src/lib/yaml/module-key-map.ts src/lib/yaml/module-yaml.ts
git commit -m "refactor: extract module-key-map from module-yaml"
```

---

### Task 20: Create module-yaml-extract.ts

**Files:**
- Create: `src/lib/yaml/module-yaml-extract.ts`
- Modify: `src/lib/yaml/module-yaml.ts`

- [ ] **Step 1: Create module-yaml-extract.ts**

Extract from `module-yaml.ts` all extraction-direction functions:

1. `parseModuleYamlString` (internal helper)
2. `extractRawModuleYamlSlice` (internal helper)
3. `extractMissingExactPathEntries` (internal helper)
4. `extractModuleYamlFromMappingSourceFile` (internal helper)
5. `extractModuleYaml` (public)
6. `extractModuleYamlFromWorkspace` (public)

Import dependencies from `'./module-key-map'`, `'./patch-utils'`, `'./serializer'`, `'@/lib/config/custom-phrase'`, `'@/lib/config/defaults'`.

Export public functions.

- [ ] **Step 2: Update module-yaml.ts to import from module-yaml-extract**

Replace deleted definitions with imports.

- [ ] **Step 3: Run tests**

Run: `npx vitest run src/lib/yaml/module-yaml.test.ts`
Expected: ALL PASS.

- [ ] **Step 4: Commit**

```bash
git add src/lib/yaml/module-yaml-extract.ts src/lib/yaml/module-yaml.ts
git commit -m "refactor: extract module-yaml-extract from module-yaml"
```

---

### Task 21: Create module-yaml-apply.ts

**Files:**
- Create: `src/lib/yaml/module-yaml-apply.ts`
- Modify: `src/lib/yaml/module-yaml.ts`

- [ ] **Step 1: Create module-yaml-apply.ts**

Extract from `module-yaml.ts` all apply-direction functions:

1. `applyParsedModulePatchToSourceFile` (internal helper)
2. `getPrimarySchemaContext` (internal helper)
3. `replacePrimarySchemaConfig` (internal helper)
4. `replaceDefaultConfigFields` (internal helper)
5. `replaceOwnedObjectFields` (internal helper)
6. `getPlatformDefaults` (internal helper)
7. `applyModuleYaml` (public — the large switch statement)
8. `applyModuleYamlToWorkspace` (public)

Import from `'./module-key-map'`, `'./module-yaml-extract'` (for `parseModuleYamlString`, `extractModuleYamlFromMappingSourceFile`), `'./patch-utils'`, `'@/lib/yaml/parser'`, `'@/lib/config/custom-phrase'`, `'@/lib/config/defaults'`, `'@/types/config'`.

Export public functions.

- [ ] **Step 2: Convert module-yaml.ts to barrel**

Replace the entire content of `src/lib/yaml/module-yaml.ts` with re-exports:

```typescript
// Barrel re-exports — all existing import paths continue to work.
export type { ModuleKeyMapping } from './module-key-map'
export {
  MODULE_KEY_MAP,
  getModuleMappings,
  getModuleSourceFileName,
  resolveModuleSourceFile,
  createEmptySourceFile,
  mappingMatchesSourceFile,
  CANDIDATE_SETTINGS_TRANSLATOR_FIELDS,
} from './module-key-map'
export {
  extractModuleYaml,
  extractModuleYamlFromWorkspace,
  parseModuleYamlString,
} from './module-yaml-extract'
export {
  applyModuleYaml,
  applyModuleYamlToWorkspace,
} from './module-yaml-apply'
```

Note: Include only the names actually imported by consumers. Check with `grep -r "from '@/lib/yaml/module-yaml'" src/ --include='*.ts' --include='*.tsx'` to find all consumers and ensure every imported name is re-exported.

- [ ] **Step 3: Run all tests**

Run: `npx vitest run`
Expected: ALL PASS — barrel ensures backward compatibility.

- [ ] **Step 4: Verify build**

Run: `npx tsc -b && npm run build`
Expected: Zero errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/yaml/module-yaml-apply.ts src/lib/yaml/module-yaml.ts
git commit -m "refactor: extract module-yaml-apply and convert module-yaml to barrel"
```

---

### Task 22: Batch 5 verification

- [ ] **Step 1: Run full validation**

```bash
npx tsc -b && npm test && npm run build
```

- [ ] **Step 2: Verify file sizes**

```bash
wc -l src/lib/yaml/module-key-map.ts src/lib/yaml/module-yaml-extract.ts src/lib/yaml/module-yaml-apply.ts src/lib/yaml/module-yaml.ts
```

Expected: Each new file ~150-400 lines. `module-yaml.ts` barrel ~20 lines.

---

## Batch 6: Comprehensive Test Coverage

### Task 23: Critical tests — parser security & patch-utils & validators

**Files:**
- Create: `src/lib/yaml/parser-security.test.ts`
- Create: `src/lib/yaml/patch-utils.test.ts`
- Create: `src/lib/workspace/validators.test.ts`

- [ ] **Step 1: Create parser-security.test.ts**

```typescript
import { describe, it, expect } from 'vitest'
import { expandPatchPaths } from './parser'

describe('expandPatchPaths security', () => {
  it('blocks __proto__ pollution at intermediate path', () => {
    const before = ({} as Record<string, unknown>).__proto__
    expandPatchPaths({ '__proto__/polluted': true })
    expect(({} as Record<string, unknown>).__proto__).toBe(before)
  })

  it('blocks __proto__ pollution at final path', () => {
    const result = expandPatchPaths({ 'safe/__proto__': true })
    expect(result).toEqual({})
  })

  it('blocks constructor pollution', () => {
    expandPatchPaths({ 'constructor/prototype/polluted': true })
    expect(Object.prototype).not.toHaveProperty('polluted')
  })

  it('allows safe keys similar to dangerous ones', () => {
    const result = expandPatchPaths({ 'proto/value': 42 })
    expect(result).toEqual({ proto: { value: 42 } })
  })

  it('allows deeply nested safe paths', () => {
    const result = expandPatchPaths({ 'a/b/c/d': 'ok' })
    expect(result).toEqual({ a: { b: { c: { d: 'ok' } } } })
  })
})
```

- [ ] **Step 2: Create patch-utils.test.ts**

```typescript
import { describe, it, expect } from 'vitest'
import { parseDocument } from 'yaml'
import { flattenPatchEntries, isYamlMapNodeEmpty, pruneEmptyParents } from './patch-utils'

describe('flattenPatchEntries', () => {
  it('flattens nested object into path/value pairs', () => {
    const result = flattenPatchEntries({ a: { b: 'v1', c: 'v2' } })
    expect(result).toEqual([
      { path: ['a', 'b'], value: 'v1' },
      { path: ['a', 'c'], value: 'v2' },
    ])
  })

  it('treats arrays as leaf values', () => {
    const result = flattenPatchEntries({ a: [1, 2] })
    expect(result).toEqual([{ path: ['a'], value: [1, 2] }])
  })

  it('treats empty objects as leaf values', () => {
    const result = flattenPatchEntries({ a: {} })
    expect(result).toEqual([{ path: ['a'], value: {} }])
  })

  it('returns empty array for empty input', () => {
    expect(flattenPatchEntries({})).toEqual([])
  })

  it('handles deeply nested structures', () => {
    const result = flattenPatchEntries({ a: { b: { c: 'deep' } } })
    expect(result).toEqual([{ path: ['a', 'b', 'c'], value: 'deep' }])
  })
})

describe('isYamlMapNodeEmpty', () => {
  it('returns true for node with empty items array', () => {
    expect(isYamlMapNodeEmpty({ items: [] })).toBe(true)
  })

  it('returns false for node with items', () => {
    expect(isYamlMapNodeEmpty({ items: ['something'] })).toBe(false)
  })

  it('returns false for non-object', () => {
    expect(isYamlMapNodeEmpty('string')).toBe(false)
  })

  it('returns false for null', () => {
    expect(isYamlMapNodeEmpty(null)).toBe(false)
  })

  it('returns false for object without items', () => {
    expect(isYamlMapNodeEmpty({ other: [] })).toBe(false)
  })
})

describe('pruneEmptyParents', () => {
  it('removes empty parent map nodes from yaml document', () => {
    const doc = parseDocument('patch:\n  a:\n    b: 1')
    doc.deleteIn(['patch', 'a', 'b'])
    pruneEmptyParents(doc, ['a', 'b'])
    expect(doc.getIn(['patch', 'a'])).toBeUndefined()
  })

  it('preserves non-empty parents', () => {
    const doc = parseDocument('patch:\n  a:\n    b: 1\n    c: 2')
    doc.deleteIn(['patch', 'a', 'b'])
    pruneEmptyParents(doc, ['a', 'b'])
    expect(doc.getIn(['patch', 'a', 'c'])).toBe(2)
  })
})
```

- [ ] **Step 3: Create validators.test.ts**

```typescript
import { describe, it, expect } from 'vitest'
import { isRecord, isValidSourceFile, isValidProject, SOURCE_FILE_KINDS } from './validators'

describe('isRecord', () => {
  it('returns true for plain objects', () => {
    expect(isRecord({})).toBe(true)
    expect(isRecord({ a: 1 })).toBe(true)
  })

  it('returns false for null', () => {
    expect(isRecord(null)).toBe(false)
  })

  it('returns false for arrays', () => {
    expect(isRecord([])).toBe(false)
  })

  it('returns false for primitives', () => {
    expect(isRecord('string')).toBe(false)
    expect(isRecord(42)).toBe(false)
  })
})

describe('isValidSourceFile', () => {
  const validFile = {
    id: 'default.custom.yaml',
    fileName: 'default.custom.yaml',
    kind: 'default',
    content: 'patch:\n  menu:\n    page_size: 9',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }

  it('accepts a valid source file', () => {
    expect(isValidSourceFile(validFile)).toBe(true)
  })

  it('accepts valid source file with optional platform', () => {
    expect(isValidSourceFile({ ...validFile, platform: 'macos' })).toBe(true)
  })

  it('rejects missing id', () => {
    const { id, ...rest } = validFile
    expect(isValidSourceFile(rest)).toBe(false)
  })

  it('rejects invalid kind', () => {
    expect(isValidSourceFile({ ...validFile, kind: 'unknown' })).toBe(false)
  })

  it('rejects invalid platform', () => {
    expect(isValidSourceFile({ ...validFile, platform: 'linux' })).toBe(false)
  })

  it('rejects null', () => {
    expect(isValidSourceFile(null)).toBe(false)
  })
})

describe('isValidProject', () => {
  const validProject = {
    targetPlatform: 'macos',
    defaultConfig: { schemaList: [], pageSize: 5, selectKeys: '', asciiComposer: {}, keyBinder: {} },
    platformConfig: { platform: 'macos', appOptions: {} },
    schemaConfigs: {},
    customPhrases: [],
    preserved: {},
  }

  it('accepts a valid project', () => {
    expect(isValidProject(validProject)).toBe(true)
  })

  it('rejects missing targetPlatform', () => {
    const { targetPlatform, ...rest } = validProject
    expect(isValidProject(rest)).toBe(false)
  })

  it('rejects missing schemaConfigs', () => {
    const { schemaConfigs, ...rest } = validProject
    expect(isValidProject(rest)).toBe(false)
  })

  it('rejects schemaConfigs as array', () => {
    expect(isValidProject({ ...validProject, schemaConfigs: [] })).toBe(false)
  })

  it('rejects null', () => {
    expect(isValidProject(null)).toBe(false)
  })
})

describe('SOURCE_FILE_KINDS', () => {
  it('contains exactly 4 kinds', () => {
    expect(SOURCE_FILE_KINDS.size).toBe(4)
    expect(SOURCE_FILE_KINDS.has('default')).toBe(true)
    expect(SOURCE_FILE_KINDS.has('platform')).toBe(true)
    expect(SOURCE_FILE_KINDS.has('schema')).toBe(true)
    expect(SOURCE_FILE_KINDS.has('custom_phrase')).toBe(true)
  })
})
```

- [ ] **Step 4: Run all new tests**

```bash
npx vitest run src/lib/yaml/parser-security.test.ts src/lib/yaml/patch-utils.test.ts src/lib/workspace/validators.test.ts
```

Expected: ALL PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/yaml/parser-security.test.ts src/lib/yaml/patch-utils.test.ts src/lib/workspace/validators.test.ts
git commit -m "test: add security, patch-utils, and validators tests"
```

---

### Task 24: Critical tests — share-parse, gist client, store actions

**Files:**
- Create: `src/lib/compress/share-parse.test.ts`
- Create: `src/lib/gist/client.test.ts`
- Create: `src/stores/config-store-actions.test.ts`

- [ ] **Step 1: Create share-parse.test.ts**

```typescript
import { describe, it, expect } from 'vitest'
import { decompressConfig, parseShareUrl, parseConfigSnapshot, compressConfig } from './share'

describe('parseShareUrl', () => {
  it('parses a valid share URL', () => {
    const payload = compressConfig({ module: 'fuzzy-pinyin', yaml: 'patch:\n  speller: {}' })
    const result = parseShareUrl(`?share=${payload}`)
    expect(result).toEqual({
      module: 'fuzzy-pinyin',
      yaml: 'patch:\n  speller: {}',
    })
  })

  it('returns null for missing share param', () => {
    expect(parseShareUrl('?other=value')).toBeNull()
  })

  it('returns null for malformed compressed data', () => {
    expect(parseShareUrl('?share=notvalidlz')).toBeNull()
  })

  it('returns null for invalid module name', () => {
    const payload = compressConfig({ module: 'not-a-module', yaml: 'test' })
    const result = parseShareUrl(`?share=${payload}`)
    expect(result).toBeNull()
  })

  it('returns null when module field is missing', () => {
    const payload = compressConfig({ yaml: 'test' })
    expect(parseShareUrl(`?share=${payload}`)).toBeNull()
  })
})

describe('decompressConfig size limits', () => {
  it('rejects compressed data longer than 50KB', () => {
    expect(decompressConfig('a'.repeat(50_001))).toBeNull()
  })

  it('does not throw for input at 50KB limit', () => {
    expect(() => decompressConfig('a'.repeat(50_000))).not.toThrow()
  })
})

describe('parseConfigSnapshot', () => {
  it('rejects invalid JSON', () => {
    const result = parseConfigSnapshot('not json')
    expect(result.error).toBe('无效的 JSON 格式')
  })

  it('rejects wrong version', () => {
    const result = parseConfigSnapshot(JSON.stringify({ version: 2 }))
    expect(result.error).toContain('不支持的版本')
  })

  it('rejects missing project', () => {
    const result = parseConfigSnapshot(JSON.stringify({ version: 1 }))
    expect(result.error).toContain('缺少 project')
  })

  it('rejects incomplete project structure', () => {
    const result = parseConfigSnapshot(JSON.stringify({
      version: 1,
      project: { targetPlatform: 'macos' },
    }))
    expect(result.error).toContain('project 结构不完整')
  })

  it('accepts a valid snapshot', () => {
    const validProject = {
      targetPlatform: 'macos',
      defaultConfig: { schemaList: [], pageSize: 5, selectKeys: '', asciiComposer: { goodOldCapsLock: false, switchKey: {} }, keyBinder: { bindings: [] } },
      platformConfig: { platform: 'macos', appOptions: {} },
      schemaConfigs: {},
      customPhrases: [],
      preserved: {},
    }
    const result = parseConfigSnapshot(JSON.stringify({ version: 1, project: validProject }))
    expect(result.snapshot).toBeDefined()
    expect(result.error).toBeUndefined()
  })
})
```

- [ ] **Step 2: Create client.test.ts**

```typescript
import { describe, it, expect, vi, afterEach } from 'vitest'

// We need to test extractGistId which is not exported.
// Test it indirectly through loadPublicGist.
describe('loadPublicGist', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('rejects invalid Gist ID format', async () => {
    const { loadPublicGist } = await import('./client')
    await expect(loadPublicGist('../malicious')).rejects.toThrow('无效的 Gist ID 格式')
  })

  it('rejects Gist ID with path traversal', async () => {
    const { loadPublicGist } = await import('./client')
    await expect(loadPublicGist('abc123/../other')).rejects.toThrow('无效的 Gist ID 格式')
  })

  it('accepts a valid hex Gist ID', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        files: {
          'rime-craft-config.json': {
            content: JSON.stringify({
              version: 1,
              project: {
                targetPlatform: 'macos',
                defaultConfig: { schemaList: [], pageSize: 5, selectKeys: '', asciiComposer: { goodOldCapsLock: false, switchKey: {} }, keyBinder: { bindings: [] } },
                platformConfig: { platform: 'macos', appOptions: {} },
                schemaConfigs: {},
                customPhrases: [],
                preserved: {},
              },
            }),
          },
        },
      }),
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse))
    const { loadPublicGist } = await import('./client')
    const result = await loadPublicGist('abc123def456')
    expect(result.project.targetPlatform).toBe('macos')
  })

  it('throws on 404', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }))
    const { loadPublicGist } = await import('./client')
    await expect(loadPublicGist('abc123')).rejects.toThrow('不存在或不是公开的')
  })

  it('extracts ID from full Gist URL', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 404 })
    vi.stubGlobal('fetch', mockFetch)
    const { loadPublicGist } = await import('./client')
    await loadPublicGist('https://gist.github.com/user/abc123').catch(() => {})
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/gists/abc123'),
      expect.any(Object),
    )
  })
})
```

- [ ] **Step 3: Create config-store-actions.test.ts**

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { useConfigStore } from './config-store'

describe('config store — untested actions', () => {
  beforeEach(() => {
    useConfigStore.getState().reset()
  })

  describe('clearWorkspace', () => {
    it('resets project to empty state', () => {
      const store = useConfigStore.getState()
      store.setSchemaList([{ schema: 'luna_pinyin' }])
      expect(store.project.defaultConfig.schemaList).toHaveLength(1)

      useConfigStore.getState().clearWorkspace()
      const after = useConfigStore.getState()
      expect(after.project.defaultConfig.schemaList).toHaveLength(0)
      expect(after.isDirty).toBe(false)
      expect(after.activeModule).toBe('schema-manager')
    })

    it('rebuilds source files from empty project', () => {
      useConfigStore.getState().clearWorkspace()
      const { sourceFiles } = useConfigStore.getState()
      expect(Object.keys(sourceFiles).length).toBeGreaterThan(0)
    })
  })

  describe('setTargetPlatform', () => {
    it('changes the target platform', () => {
      useConfigStore.getState().setTargetPlatform('windows')
      expect(useConfigStore.getState().project.targetPlatform).toBe('windows')
    })

    it('marks as dirty', () => {
      useConfigStore.getState().setTargetPlatform('windows')
      expect(useConfigStore.getState().isDirty).toBe(true)
    })
  })

  describe('updateSchemaConfig', () => {
    it('merges partial update into schema config', () => {
      useConfigStore.getState().setSchemaList([{ schema: 'luna_pinyin' }])
      useConfigStore.getState().updateSchemaConfig('luna_pinyin', {
        spellingScheme: 'flypy',
      })
      const config = useConfigStore.getState().project.schemaConfigs['luna_pinyin']
      expect(config?.spellingScheme).toBe('flypy')
    })

    it('creates schema config if it did not exist', () => {
      useConfigStore.getState().updateSchemaConfig('new_schema', {
        fuzzyRules: [{ ruleId: 'zh_z', enabled: true }],
      })
      const config = useConfigStore.getState().project.schemaConfigs['new_schema']
      expect(config?.fuzzyRules).toHaveLength(1)
    })
  })

  describe('setViewMode', () => {
    it('changes view mode without setting isDirty', () => {
      useConfigStore.getState().setViewMode('immersive')
      const state = useConfigStore.getState()
      expect(state.editorUI.viewMode).toBe('immersive')
      expect(state.isDirty).toBe(false)
    })
  })

  describe('setTutorialCollapsed', () => {
    it('changes tutorial collapsed without setting isDirty', () => {
      useConfigStore.getState().setTutorialCollapsed(true)
      const state = useConfigStore.getState()
      expect(state.editorUI.tutorialCollapsed).toBe(true)
      expect(state.isDirty).toBe(false)
    })
  })
})
```

- [ ] **Step 4: Run all new tests**

```bash
npx vitest run src/lib/compress/share-parse.test.ts src/lib/gist/client.test.ts src/stores/config-store-actions.test.ts
```

Expected: ALL PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/compress/share-parse.test.ts src/lib/gist/client.test.ts src/stores/config-store-actions.test.ts
git commit -m "test: add share-parse, gist client, and store action tests"
```

---

### Task 25: Critical tests — importer and simulator

**Files:**
- Create: `src/features/share/importer.test.ts`
- Create: `src/features/simulator/useSimulator.test.ts`

- [ ] **Step 1: Create importer.test.ts**

Read `src/features/share/importer.ts` to understand the exact API, then write tests covering:

```typescript
import { describe, it, expect } from 'vitest'
import { importFromYamlString, importFromFiles } from './importer'

describe('importFromYamlString', () => {
  it('imports default.custom.yaml into defaultConfig', () => {
    const yaml = 'patch:\n  menu:\n    page_size: 7'
    const result = importFromYamlString(yaml, 'default.custom.yaml')
    expect(result.project.defaultConfig.pageSize).toBe(7)
    expect(result.summary.customSettings).toBeGreaterThan(0)
  })

  it('imports squirrel.custom.yaml and sets platform to macos', () => {
    const yaml = 'patch:\n  app_options:\n    com.apple.Terminal:\n      ascii_mode: true'
    const result = importFromYamlString(yaml, 'squirrel.custom.yaml')
    expect(result.project.targetPlatform).toBe('macos')
    expect(result.project.platformConfig.appOptions['com.apple.Terminal']).toBeDefined()
  })

  it('imports weasel.custom.yaml and sets platform to windows', () => {
    const yaml = 'patch:\n  app_options:\n    cmd.exe:\n      ascii_mode: true'
    const result = importFromYamlString(yaml, 'weasel.custom.yaml')
    expect(result.project.targetPlatform).toBe('windows')
  })

  it('imports schema.custom.yaml into schemaConfigs', () => {
    const yaml = 'patch:\n  switches:\n    - name: ascii_mode\n      reset: 0'
    const result = importFromYamlString(yaml, 'luna_pinyin.custom.yaml')
    const config = result.project.schemaConfigs['luna_pinyin']
    expect(config?.switches).toBeDefined()
  })

  it('handles malformed YAML without crashing', () => {
    const result = importFromYamlString('not: [valid: yaml', 'default.custom.yaml')
    expect(result.summary.errors.length).toBeGreaterThan(0)
  })

  it('handles empty string input', () => {
    const result = importFromYamlString('', 'default.custom.yaml')
    expect(result.project).toBeDefined()
  })
})

describe('importFromFiles', () => {
  it('merges multiple files into one project', () => {
    const files = [
      { name: 'default.custom.yaml', content: 'patch:\n  menu:\n    page_size: 9' },
      { name: 'squirrel.custom.yaml', content: 'patch:\n  app_options:\n    com.test:\n      ascii_mode: true' },
    ]
    const result = importFromFiles(files)
    expect(result.project.defaultConfig.pageSize).toBe(9)
    expect(result.project.targetPlatform).toBe('macos')
    expect(result.summary.filesProcessed).toBe(2)
  })

  it('collects errors from multiple files', () => {
    const files = [
      { name: 'default.custom.yaml', content: 'invalid: [yaml' },
      { name: 'luna_pinyin.custom.yaml', content: 'also: [broken' },
    ]
    const result = importFromFiles(files)
    expect(result.summary.errors.length).toBeGreaterThanOrEqual(1)
  })
})
```

Note: After reading `importer.ts`, adjust the test to match the actual return types (e.g., `result.project` vs `result.summary`). The test structure above matches the spec's description.

- [ ] **Step 2: Create useSimulator.test.ts**

Read `src/features/simulator/useSimulator.ts` to understand the hook API, then write:

```typescript
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
// Import the hook — adjust path/name based on actual export
import { useSimulator } from './useSimulator'

describe('useSimulator', () => {
  it('returns empty candidates for empty input', () => {
    const { result } = renderHook(() => useSimulator())
    expect(result.current.candidates).toEqual([])
  })

  it('returns candidates matching the input prefix', () => {
    const { result } = renderHook(() => useSimulator())
    act(() => {
      result.current.setInput('ni')
    })
    for (const candidate of result.current.candidates) {
      expect(candidate.code?.toLowerCase() ?? '').toContain('ni')
    }
  })

  it('respects pageSize', () => {
    const { result } = renderHook(() => useSimulator())
    act(() => {
      result.current.setInput('a')
    })
    // Default pageSize should limit results
    expect(result.current.candidates.length).toBeLessThanOrEqual(10)
  })
})
```

Note: Adjust the hook's API (`setInput`, `candidates`, etc.) based on the actual export after reading the file.

- [ ] **Step 3: Run tests**

```bash
npx vitest run src/features/share/importer.test.ts src/features/simulator/useSimulator.test.ts
```

Expected: ALL PASS.

- [ ] **Step 4: Commit**

```bash
git add src/features/share/importer.test.ts src/features/simulator/useSimulator.test.ts
git commit -m "test: add importer and simulator tests"
```

---

### Task 26: Important tests — theme, wizard, compare, share URL

**Files:**
- Create: `src/features/theme/ThemePresetSelector.test.tsx`
- Create: `src/features/wizard/wizard-reducer-extended.test.ts`
- Create: `src/features/compare/SchemaCompare.test.tsx`
- Create: `src/features/share/useShareUrl.test.ts`

For each file: read the source component first, then write tests that verify behavior through the store or render output. Use the patterns:
- `useConfigStore.getState().reset()` in `beforeEach`
- `render(<Component />)` + `userEvent.setup()` for interactive tests
- `renderHook()` for hook tests

These tests should cover:

**ThemePresetSelector.test.tsx:**
- Rendering shows preset options
- Clicking a preset calls `setThemeStyle` with correct preset data
- Store state reflects the selected preset

**wizard-reducer-extended.test.ts:**
- `SET_STEP` respects bounds (0 to max)
- `SET_SCHEMA`, `SET_PAGE_SIZE`, `SET_SHIFT_L`, `SET_THEME` update correct state fields

**SchemaCompare.test.tsx:**
- Renders comparison table with schema data
- `isDifferent` correctly identifies rows where schemas differ

**useShareUrl.test.ts:**
- Returns null when no share param exists
- Parses valid share param and returns module + yaml
- Clears URL after consuming share param

- [ ] **Step 1: Create all 4 test files**

Read each source file, write tests following the patterns above. Each file should have 3-6 test cases.

- [ ] **Step 2: Run tests**

```bash
npx vitest run src/features/theme/ src/features/wizard/ src/features/compare/ src/features/share/useShareUrl.test.ts
```

Expected: ALL PASS.

- [ ] **Step 3: Commit**

```bash
git add src/features/theme/ThemePresetSelector.test.tsx src/features/wizard/wizard-reducer-extended.test.ts src/features/compare/SchemaCompare.test.tsx src/features/share/useShareUrl.test.ts
git commit -m "test: add theme, wizard, compare, and share URL tests"
```

---

### Task 27: Important tests — editor modules (FuzzyPinyin, Punctuation)

**Files:**
- Create: `src/features/editor/modules/FuzzyPinyin.test.tsx`
- Create: `src/features/editor/modules/Punctuation.test.tsx`

Read each module source, then write tests:

**FuzzyPinyin.test.tsx:**
- Renders rule toggles for the primary schema
- Toggling a rule calls `setFuzzyRules` with updated array
- Shows correct initial state from store

**Punctuation.test.tsx:**
- `valueToString` / `stringToValue` helpers round-trip correctly
- Reset to defaults path works
- Renders punctuation mappings from store

- [ ] **Step 1: Create both test files** (read source first)
- [ ] **Step 2: Run tests**

```bash
npx vitest run src/features/editor/modules/FuzzyPinyin.test.tsx src/features/editor/modules/Punctuation.test.tsx
```

- [ ] **Step 3: Commit**

```bash
git add src/features/editor/modules/FuzzyPinyin.test.tsx src/features/editor/modules/Punctuation.test.tsx
git commit -m "test: add FuzzyPinyin and Punctuation module tests"
```

---

### Task 28: Supplemental tests — remaining editor modules

**Files:**
- Create: `src/features/editor/modules/KeyBindings.test.tsx`
- Create: `src/features/editor/modules/Switches.test.tsx`
- Create: `src/features/editor/modules/Dictionary.test.tsx`
- Create: `src/features/editor/modules/AsciiMode.test.tsx`

Each file: read source, write 3-5 test cases covering:
- Renders from store state
- User interaction triggers correct store action
- Key edge cases

- [ ] **Step 1: Create all 4 test files** (read source first for each)
- [ ] **Step 2: Run tests**

```bash
npx vitest run src/features/editor/modules/KeyBindings.test.tsx src/features/editor/modules/Switches.test.tsx src/features/editor/modules/Dictionary.test.tsx src/features/editor/modules/AsciiMode.test.tsx
```

- [ ] **Step 3: Commit**

```bash
git add src/features/editor/modules/
git commit -m "test: add KeyBindings, Switches, Dictionary, and AsciiMode module tests"
```

---

### Task 29: Supplemental tests — docs search and extended round-trip

**Files:**
- Create: `src/lib/docs/search-index.test.ts`
- Create: `src/lib/yaml/roundtrip-extended.test.ts`

**search-index.test.ts:**
- Read `src/lib/docs/search-index.ts`, test the indexing and search functions

**roundtrip-extended.test.ts:**
- Test full serialize → buildCustomYaml → parseCustomYaml → expandPatchPaths → map chains for:
  - Theme colors (BGR hex round-trip)
  - Fuzzy pinyin rules
  - Lua extensions config
  - Custom triggers

- [ ] **Step 1: Create both test files** (read source first)
- [ ] **Step 2: Run tests**

```bash
npx vitest run src/lib/docs/search-index.test.ts src/lib/yaml/roundtrip-extended.test.ts
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/docs/search-index.test.ts src/lib/yaml/roundtrip-extended.test.ts
git commit -m "test: add docs search and extended YAML round-trip tests"
```

---

### Task 30: Final verification

- [ ] **Step 1: Run full test suite**

```bash
npx tsc -b && npm test && npm run build
```

- [ ] **Step 2: Count tests**

```bash
npm test 2>&1 | grep -E "Tests|Test Files"
```

Expected: 350+ tests, 50+ test files, all passing.

- [ ] **Step 3: Verify no regressions**

```bash
npm run build && ls -la dist/assets/*.js | wc -l
```

Expected: Build succeeds, similar number of output chunks.

- [ ] **Step 4: Final commit**

If any stray files need staging:

```bash
git status
```
