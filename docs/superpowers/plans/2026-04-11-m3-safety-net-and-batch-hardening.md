# M3 Safety Net And Batch Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Freeze the new post-M2 behavior with CI-visible tests and small correctness fixes so future content and Lua work cannot silently regress.

**Architecture:** Add low-cost repository audits for content depth, cross-links, and schema capability consistency; add focused interaction tests for the Lua module; and close the two known correctness gaps that are already visible in code: Lua identifier validation and script-delete orphan handling.

**Tech Stack:** Vitest, Testing Library, filesystem reads in tests, existing Lua editor module components, existing schema data JSON, TypeScript utility modules.

**Design Spec:** `docs/superpowers/specs/2026-04-11-post-batch-roadmap-design.md`

---

### Task 1: Freeze content depth, links, and schema capability invariants in tests

**Files:**
- Create: `src/content/content-audit.test.ts`
- Create: `src/data/schema-capability-contract.test.ts`

- [ ] **Step 1: Write the audit tests**

Create `src/content/content-audit.test.ts` with:

```ts
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const contentDir = path.resolve(__dirname, '../content')
const files = fs.readdirSync(contentDir).filter((file) => file.endsWith('.mdx'))

describe('content contract', () => {
  it('keeps tutorial cross-links resolvable', () => {
    for (const file of files) {
      const fullPath = path.join(contentDir, file)
      const source = fs.readFileSync(fullPath, 'utf8')
      const links = [...source.matchAll(/\]\(\.\/([a-z0-9-]+)\)/g)].map((match) => match[1])

      for (const slug of links) {
        expect(fs.existsSync(path.join(contentDir, `${slug}.mdx`))).toBe(true)
      }
    }
  })

  it('enforces the minimum content-depth contract', () => {
    for (const file of files) {
      const source = fs.readFileSync(path.join(contentDir, file), 'utf8')
      const details = (source.match(/<Details/g) ?? []).length
      const steps = (source.match(/<StepGuide>/g) ?? []).length
      const previews = (source.match(/<YamlPreview/g) ?? []).length
      const callouts = (source.match(/:::(tip|note|warning|caution)/g) ?? []).length

      expect(steps).toBeGreaterThanOrEqual(1)
      expect(details).toBeGreaterThanOrEqual(3)
      expect(callouts).toBeGreaterThanOrEqual(2)

      if (file !== 'installation.mdx') {
        expect(previews).toBeGreaterThanOrEqual(1)
      }
    }
  })
})
```

Create `src/data/schema-capability-contract.test.ts` with:

```ts
import { describe, expect, it } from 'vitest'
import raw from './schemas-detail.json'
import { MODULE_REGISTRY } from './module-registry'

describe('schema capability contract', () => {
  it('keeps special-input-capable schemas also marked lua-extensions capable', () => {
    for (const schema of raw.schemas) {
      const caps = schema.capabilities ?? []
      if (caps.includes('special-input')) {
        expect(caps).toContain('lua-extensions')
      }
    }
  })

  it('keeps special-input removed from the live module registry', () => {
    expect(MODULE_REGISTRY.some((mod) => mod.id === 'special-input')).toBe(false)
    expect(MODULE_REGISTRY.some((mod) => mod.id === 'lua-extensions')).toBe(true)
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail or expose gaps**

Run:

```bash
npm test -- src/content/content-audit.test.ts src/data/schema-capability-contract.test.ts
```

Expected: FAIL until the new test files and any missing assertions are in place.

- [ ] **Step 3: Implement any required fixtures/import fixes**

If JSON import typing requires it, add:

```ts
import raw from './schemas-detail.json'
const schemas = raw.schemas
```

Do not weaken the assertions to make them pass. Fix the contract only if a real gap is discovered.

- [ ] **Step 4: Run the tests to verify they pass**

Run:

```bash
npm test -- src/content/content-audit.test.ts src/data/schema-capability-contract.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/content/content-audit.test.ts src/data/schema-capability-contract.test.ts
git commit -m "test: freeze content and schema capability contracts"
```

### Task 2: Validate Lua identifiers before template generation and filename edits

**Files:**
- Modify: `src/data/lua-script-templates.ts`
- Modify: `src/data/lua-script-templates.test.ts`
- Modify: `src/features/editor/modules/lua/LuaScriptList.tsx`

- [ ] **Step 1: Add the failing tests**

Append to `src/data/lua-script-templates.test.ts`:

```ts
it('throws for invalid Lua identifiers', () => {
  expect(() => renderLuaTemplate('translator', '123bad')).toThrow(/Invalid Lua identifier/)
  expect(() => renderLuaTemplate('translator', 'bad-name')).toThrow(/Invalid Lua identifier/)
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm test -- src/data/lua-script-templates.test.ts
```

Expected: FAIL because `renderLuaTemplate()` currently accepts any string.

- [ ] **Step 3: Implement identifier validation and tighten UI input**

Update `src/data/lua-script-templates.ts`:

```ts
function assertValidLuaIdentifier(identifier: string): void {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier)) {
    throw new Error(`Invalid Lua identifier "${identifier}"`)
  }
}

export function renderLuaTemplate(
  scriptType: LuaScript['scriptType'],
  identifier: string,
): string {
  assertValidLuaIdentifier(identifier)
  return LUA_SCRIPT_TEMPLATES[scriptType].split('{name}').join(identifier)
}
```

Update `src/features/editor/modules/lua/LuaScriptList.tsx` input filter from:

```ts
/^[a-zA-Z0-9_-]*\.?l?u?a?$/
```

to:

```ts
/^[a-zA-Z_][a-zA-Z0-9_]*\.?l?u?a?$/
```

and when normalizing filenames, treat `.lua`-less values as incomplete drafts rather than valid final identifiers.

- [ ] **Step 4: Run the tests to verify they pass**

Run:

```bash
npm test -- src/data/lua-script-templates.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/lua-script-templates.ts src/data/lua-script-templates.test.ts src/features/editor/modules/lua/LuaScriptList.tsx
git commit -m "fix: validate Lua identifiers before script template generation"
```

### Task 3: Guard against orphaning when deleting Lua scripts

**Files:**
- Modify: `src/stores/config-store.ts`
- Modify: `src/stores/config-store.test.ts`
- Modify: `src/features/editor/modules/lua/LuaScriptList.tsx`
- Create: `src/features/editor/modules/lua/LuaScriptList.test.tsx`

- [ ] **Step 1: Add the failing tests**

Append to `src/stores/config-store.test.ts`:

```ts
it('refuses to delete a Lua script that is still referenced by a custom trigger', () => {
  const store = useConfigStore.getState()
  store.addLuaScript('rime_ice', {
    fileName: 'my_translator.lua',
    scriptType: 'translator',
    description: '',
    code: '',
  })

  const scriptId = useConfigStore.getState().project.schemaConfigs.rime_ice?.luaScripts?.[0]!.id

  store.addCustomTrigger('rime_ice', {
    name: 'IP 查询',
    triggerCode: '/ip',
    description: '',
    scriptId,
  })

  const deleted = store.deleteLuaScript('rime_ice', scriptId)
  expect(deleted).toBe(false)
})
```

Create `src/features/editor/modules/lua/LuaScriptList.test.tsx` with:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LuaScriptList } from './LuaScriptList'
import { useConfigStore } from '@/stores/config-store'

describe('LuaScriptList', () => {
  it('blocks deletion when a script is still referenced', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

    useConfigStore.getState().reset()
    useConfigStore.getState().addLuaScript('rime_ice', {
      fileName: 'my_translator.lua',
      scriptType: 'translator',
      description: '',
      code: '',
    })

    const scriptId = useConfigStore.getState().project.schemaConfigs.rime_ice?.luaScripts?.[0]!.id

    useConfigStore.getState().addCustomTrigger('rime_ice', {
      name: 'IP 查询',
      triggerCode: '/ip',
      description: '',
      scriptId,
    })

    render(<LuaScriptList schemaId="rime_ice" />)
    await user.click(screen.getByRole('button', { name: /删除/i }))

    expect(confirmSpy).toHaveBeenCalled()
    expect(alertSpy).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
npm test -- src/stores/config-store.test.ts src/features/editor/modules/lua/LuaScriptList.test.tsx
```

Expected: FAIL because `deleteLuaScript` currently deletes blindly and the UI has no guard.

- [ ] **Step 3: Implement the block-delete behavior**

Change `src/stores/config-store.ts` so `deleteLuaScript` returns `boolean`:

```ts
deleteLuaScript: (schemaId, id) =>
  set((s) => {
    const existing = s.project.schemaConfigs[schemaId]
    if (!existing?.luaScripts) return {}

    const isReferenced = (existing.specialInput?.customTriggers ?? []).some(
      (trigger) => trigger.scriptId === id,
    )

    if (isReferenced) return {}

    return {
      project: {
        ...s.project,
        schemaConfigs: {
          ...s.project.schemaConfigs,
          [schemaId]: {
            ...existing,
            luaScripts: existing.luaScripts.filter((sc) => sc.id !== id),
          },
        },
      },
      isDirty: true,
    }
  })
```

Then update `LuaScriptList.tsx`:

```ts
function handleDelete(id: string) {
  if (!window.confirm('确定删除此脚本吗？')) return

  const triggers = useConfigStore.getState().project.schemaConfigs[schemaId]?.specialInput?.customTriggers ?? []
  if (triggers.some((trigger) => trigger.scriptId === id)) {
    window.alert('该脚本仍被自定义触发器引用，请先解绑或删除触发器。')
    return
  }

  deleteLuaScript(schemaId, id)
  if (selectedId === id) setSelectedId(null)
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:

```bash
npm test -- src/stores/config-store.test.ts src/features/editor/modules/lua/LuaScriptList.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/stores/config-store.ts src/stores/config-store.test.ts src/features/editor/modules/lua/LuaScriptList.tsx src/features/editor/modules/lua/LuaScriptList.test.tsx
git commit -m "fix: block Lua script deletion while triggers still reference it"
```

### Task 4: Add focused Lua module UI coverage

**Files:**
- Create: `src/features/editor/modules/lua/CustomTriggerList.test.tsx`
- Modify: `src/features/editor/modules/lua/LuaScriptList.test.tsx`

- [ ] **Step 1: Add the failing CustomTriggerList interaction test**

Create `src/features/editor/modules/lua/CustomTriggerList.test.tsx` with a mock for `CustomTriggerForm` so the test exercises list behavior without depending on dialog internals:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CustomTriggerList } from './CustomTriggerList'
import { useConfigStore } from '@/stores/config-store'

vi.mock('./CustomTriggerForm', () => ({
  CustomTriggerForm: ({ onSubmit }: { onSubmit: (value: { name: string; triggerCode: string; description: string; scriptId: string }) => void }) => (
    <button onClick={() => onSubmit({ name: 'IP 查询', triggerCode: '/ip', description: '', scriptId: 'script-1' })}>
      mock-submit
    </button>
  ),
}))

describe('CustomTriggerList', () => {
  it('shows the orphan warning when the linked script is missing', async () => {
    const user = userEvent.setup()
    useConfigStore.getState().reset()
    useConfigStore.getState().addCustomTrigger('rime_ice', {
      name: 'IP 查询',
      triggerCode: '/ip',
      description: '',
      scriptId: 'missing-script',
    })

    render(<CustomTriggerList schemaId="rime_ice" />)

    expect(screen.getByText('⚠ 未关联脚本')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the Lua UI tests to verify the current gap**

Run:

```bash
npm test -- src/features/editor/modules/lua/*.test.tsx
```

Expected: FAIL until the new test file and any missing wiring are in place.

- [ ] **Step 3: Implement any needed test harness setup**

If the store needs a guaranteed schema shell before rendering these lists, add to each test:

```ts
useConfigStore.setState((state) => ({
  ...state,
  project: {
    ...state.project,
    schemaConfigs: {
      ...state.project.schemaConfigs,
      rime_ice: {
        schemaId: 'rime_ice',
        fuzzyRules: [],
        specialInput: { enabledTriggers: [], customTriggers: [] },
        luaScripts: [],
      },
    },
  },
}))
```

- [ ] **Step 4: Run the full milestone verification stack**

Run:

```bash
npm test
npx tsc -b
npm run build
```

Expected: all green, with the new audit and Lua UI coverage included.

- [ ] **Step 5: Commit**

```bash
git add src/features/editor/modules/lua/CustomTriggerList.test.tsx src/features/editor/modules/lua/LuaScriptList.test.tsx
git commit -m "test: add focused Lua module interaction coverage"
```

