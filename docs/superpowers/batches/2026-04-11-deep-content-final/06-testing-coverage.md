# Testing Coverage

## Overall Numbers

- **Before batch**: 141 passing / 141 total (14 test files)
- **After batch**: 168 passing / 168 total (18 test files)
- **New tests**: 27
- **New test files**: 4 (Details, StepGuide, YamlPreview, lua-script-templates)
- **Extended test files**: 3 (config-store, parser, serializer)
- **CI status**: `npm test` green on merge commit `6a7e41e`; `npx tsc -b` green; `npm run build` green (1.33s)

The overall test count grew by ~19%. Coverage is weighted toward pure logic (types, templates, store, YAML I/O) with lighter coverage of UI components and essentially no coverage of the new Lua module UI flows or the CodeMirror editor.

## New Test Files

### `src/components/shared/Details.test.tsx` (5 tests, commit `b899a4c`)

Tests the `<Details>` MDX component:

1. `renders title and is collapsed by default` — verifies `details.open === false` after initial render
2. `expands when clicked` — uses `@testing-library/user-event` `userEvent.setup()` and `user.click()` on the summary, then asserts `details.open === true`
3. `shows advanced badge when level=advanced` — checks for text "进阶"
4. `shows intermediate badge when level=intermediate` — checks for text "扩展"
5. `respects defaultOpen=true` — verifies `details.open === true` when `defaultOpen` prop is set

**Uses**: native `<details>/<summary>` semantics via `.closest('details')?.open`.

### `src/components/shared/StepGuide.test.tsx` (3 tests, commit `3776669`)

Tests `<StepGuide>` and `<Step>`:

1. `renders all step titles` — passes 3 `<Step>` children, asserts all 3 titles are in the DOM
2. `renders step bodies` — passes 1 `<Step>` with text body, asserts body text is present
3. `renders auto-numbered indicators 1, 2, 3` — passes 3 `<Step>` children, asserts text "1", "2", "3" are in the DOM

**Uses**: `@testing-library/react` `render` + `screen.getByText`. Relied on the test-setup fix in the same commit (adding `afterEach(cleanup)` via the now-actually-loaded `vite.config.ts` `test:` block) — without that fix, test 3 would have failed due to accumulated DOM.

### `src/components/shared/YamlPreview.test.tsx` (4 tests, commit `9c236e0`)

Tests `<YamlPreview>`:

1. `renders title when provided` — checks for title text in the header bar
2. `renders caption when provided` — checks for caption text in the figcaption
3. `renders children code block` — verifies nested `<pre><code>` is rendered
4. `exposes highlight lines via data attribute` — queries for `[data-highlight-lines]` and asserts the attribute value equals `"1,3"` when `highlight={[1, 3]}`

### `src/data/lua-script-templates.test.ts` (3 tests, commit `5ed32ae`)

Tests `renderLuaTemplate`:

1. `replaces {name} placeholder in translator template` — asserts output contains `local function my_script(input, seg, env)` and `return my_script`, and does not contain `{name}`
2. `replaces all occurrences of {name}` — tests with type `filter`, asserts `foo` appears ≥2 times in output
3. `supports all three script types` — asserts `LUA_SCRIPT_TEMPLATES.translator`, `.filter`, `.processor` are all truthy

## Extended Test Files

### `src/stores/config-store.test.ts` (+6 tests, commits `141d903` + `52427bc`)

Two new describe blocks appended to the existing `describe('useConfigStore', ...)`:

#### `describe('custom triggers')` (3 tests, commit `141d903`)

Each test uses a `beforeEach` that calls `setSchemaList([{ schema: 'rime_ice' }])` to ensure a target schema exists.

1. `addCustomTrigger appends a trigger with a generated id` — calls `addCustomTrigger('rime_ice', { name: 'IP 查询', ... })` and asserts the trigger array length, name, and non-empty id
2. `updateCustomTrigger modifies fields` — adds a trigger, reads its id, calls `updateCustomTrigger` to change `name`, verifies the update
3. `deleteCustomTrigger removes the trigger` — adds a trigger, deletes by id, verifies the array is empty

#### `describe('lua scripts')` (3 tests, commit `52427bc`)

1. `addLuaScript appends a script with a generated id` — calls `addLuaScript` with a translator, asserts `luaScripts[0].fileName === 'my_translator.lua'` and non-empty id
2. `updateLuaScript modifies fields` — adds a filter, updates `code`, verifies the new code
3. `deleteLuaScript removes the script` — adds a processor, deletes by id, verifies empty array

**Uses**: the `beforeEach(() => useConfigStore.getState().reset())` at the outer describe level to reset state between each test.

### `src/lib/yaml/parser.test.ts` (+3 tests, commit `e7e24b2`)

New `describe('mapToSchemaConfig — custom triggers and Lua scripts')` block:

1. `extracts customTriggers from recognizer patterns not matching presets` — passes YAML with a `recognizer/patterns/custom_ip_query: "^/ip$"` entry plus `engine/translators`. Asserts the resulting config has one `customTrigger` with `triggerCode === '/ip'`.
2. `returns empty customTriggers when only preset triggers present` — passes YAML with only `recognizer/patterns/date: "^/rq$"` (a preset id). Asserts `customTriggers` is empty or undefined-treated-as-empty.
3. `does not populate luaScripts from YAML alone` — passes YAML with `engine/translators: ['lua_translator@my_custom']` (no actual Lua source). Asserts `luaScripts ?? []` has length 0 (parser recognizes the reference but cannot populate the Lua code without the .lua file itself).

### `src/lib/yaml/serializer.test.ts` (+3 tests, commit `58bea57`)

New `describe('serializeSchemaConfig — custom triggers and lua scripts')` block:

1. `emits recognizer patterns for custom triggers` — constructs a `SchemaConfig` with one `CustomTrigger` (`triggerCode: '/ip'`) and one `LuaScript` (`fileName: 'ip_query.lua'`). Asserts the output has a key matching `recognizer/patterns/...ip_query` with value `"^/ip$"`.
2. `emits lua_translator registration under engine/translators/+` — config has one translator script. Asserts `engine/translators/+` contains `lua_translator@my_t`.
3. `uses the correct engine key per script type` — config has 3 scripts (one of each type). Asserts each lands under the correct `engine/translators/+` / `engine/filters/+` / `engine/processors/+` key with the correct prefix (`lua_translator@` / `lua_filter@` / `lua_processor@`).

## Test Setup Changes (commit `3776669`)

The pre-existing Vitest configuration had a subtle bug: `vite.config.ts` was importing from `'vite'` instead of `'vitest/config'`, so its `test:` block was silently ignored. This caused `@testing-library/react`'s `afterEach(cleanup)` not to run, leading to accumulated DOM state across tests and intermittent false failures.

**Fixed in commit `3776669`** (bundled with the StepGuide implementation because the infra fix was needed to make those tests pass reliably). Changes:

```ts
// vite.config.ts
import { defineConfig } from 'vitest/config'   // was 'vite'

export default defineConfig({
  // ... existing plugins ...
  test: {
    environment: 'happy-dom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
  },
})

// src/test-setup.ts — added
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
})
```

After the fix, all existing tests continue to pass (no hidden dependencies on stale DOM) and the new component tests gained reliable per-test isolation.

**Team consideration**: This fix should ideally have been a standalone `chore(test):` commit rather than bundled with a feature commit. See [08-process-retrospective.md](./08-process-retrospective.md) for discussion.

## TypeScript Build Fixes (commit `57b3650`)

Three pre-existing strict-mode errors were surfaced and fixed during end-of-Batch-2 verification:

1. **`src/data/app-database.test.ts`** — unused type imports `AppEntry` and `AppCategory` (flagged by `noUnusedLocals`). Fix: removed both imports.

2. **`src/data/lua-script-templates.ts`** — `String.prototype.replaceAll` is ES2021 and not available in the project's `lib` target (ES2020). Flagged by `TS2550`. Fix: replaced with `.split('{name}').join(identifier)`.

3. **`src/stores/config-store.test.ts`** — indexed access `customTriggers[0]` possibly `undefined` (`noUncheckedIndexedAccess`). Fix: added non-null assertion `customTriggers[0]!`.

These errors were **not caught** by `npx tsc --noEmit` because the project's strict-build command is `tsc -b` (project references mode), which applies stricter checks and is the one `npm run build` uses. The Batch 1 verification used `tsc --noEmit` only and missed these — see [08-process-retrospective.md](./08-process-retrospective.md) for the full "Task 25+26 fraud incident" writeup.

## Coverage Gaps

Coverage is strong on pure logic and moderate on UI components, but several important areas have no tests yet. These are candidates for a dedicated testing batch:

### UI flow integration (no coverage)

- **Creating a custom trigger end-to-end**: user clicks "+ 添加自定义触发器", fills the form, submits, sees it in the list, exports YAML, verifies the YAML contains the expected `recognizer/patterns/*` entry.
- **Editing a custom trigger**: click edit, modify a field, save, verify persistence.
- **Deleting a custom trigger**: click delete, confirm in `window.confirm`, verify removal.
- **Creating a Lua script from template**: click "新建 Translator", verify template populates, edit filename, verify filename validation.
- **Editing Lua script code**: CodeMirror lazy-loads, user types, state persists on blur.
- **YAML preview updates reactively**: changing `scriptType` updates the preview's `engine/<type>s/+` path.

None of the 8 new files in `src/features/editor/modules/lua/` have dedicated test files.

### CodeMirror lazy loading (no coverage)

- The `useMemo(() => lazy(...))` pattern is untested. Tests would need to mock the dynamic imports or run against a real browser build.
- Behavior on network failure (dynamic import fails) is untested.
- The `EditorFallback` rendering during `<Suspense>` fallback is untested.

### YAML round-trip (partial coverage)

- Parser tests verify extraction of custom triggers from synthetic YAML input.
- Serializer tests verify the output for synthetic SchemaConfig input.
- **Missing**: a round-trip test that serializes a config, parses it back, and asserts structural equality. This would catch drift between parser and serializer.

### Module registry (no coverage)

- No test verifies that `'special-input'` is absent from `MODULE_REGISTRY` after the batch.
- No test verifies that `MODULE_COMPONENTS['lua-extensions']` resolves to the new container component.

### Schema capability migration (no coverage)

- No test asserts that `schemas-detail.json` is valid JSON or that every schema with `'special-input'` also has `'lua-extensions'`. The Batch 1 Task 21 spec reviewer ran a one-off node script but did not leave behind a persistent test.

### MDX content conformance (mechanical only)

- The depth standard is verified mechanically via `grep` in the content audit (see [03-content-audit.md](./03-content-audit.md)), but there is no CI check that enforces the 4-component minimum per tutorial.
- **Recommended**: add a test at `src/content/depth-audit.test.ts` that reads every `.mdx` in `src/content/` and asserts each has ≥1 StepGuide, ≥3 Details, ≥1 YamlPreview, ≥2 callouts (with `installation.mdx` allowed to have 0 YamlPreviews as a documented exception).

### LuaScript/CustomTrigger orphan detection (no coverage)

- No test verifies the expected warning behavior when a `CustomTrigger.scriptId` references a non-existent script (the "⚠ 未关联脚本" UI state).
- No test verifies behavior on `deleteLuaScript` when existing triggers reference the deleted script.

## Recommended Follow-up: A Testing Batch

A dedicated testing batch could add roughly 15-20 new tests focused on the gaps above. Suggested priority:

1. **Round-trip YAML test** (high value, medium effort) — catches parser/serializer drift
2. **Content depth audit test** (high value, low effort) — freezes the depth standard as CI-enforced
3. **Module registry sanity test** (medium value, low effort) — catches regressions in the registry
4. **CustomTriggerList interaction test** (medium value, medium effort) — uses `@testing-library/react` to drive the Add/Edit/Delete flow without CodeMirror
5. **LuaScriptList interaction test, sans CodeMirror** (medium value, medium effort) — stub `LuaCodeEditor` with a simple textarea for test purposes

Items 1-3 are low-hanging and could be done in a single follow-up batch. Items 4-5 are meaningful investments that would give confidence in the UI flows.

## Running the Tests

```bash
# Fast feedback during development
npm run test:watch

# Full run (CI equivalent)
npm test

# Type-check only (strict mode)
npx tsc -b

# Full build (includes tsc -b + vite build)
npm run build
```

Current durations on a typical dev machine:

| Command | Duration |
|---|---|
| `npm test` | ~1.5 seconds |
| `npx tsc -b` | ~3 seconds |
| `npm run build` | ~1.3 seconds |

The fast feedback loop is excellent and should encourage adding new tests.

## Related Documents

- [04-api-reference.md](./04-api-reference.md) — full API surface the tests cover
- [07-known-issues.md](./07-known-issues.md) — follow-ups that would benefit from test coverage
- [08-process-retrospective.md](./08-process-retrospective.md) — the Task 25+26 fraud incident that shows why test gating matters
