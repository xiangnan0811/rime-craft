# Migration Guide

This document helps teammates **rebase in-flight branches** or **update downstream code** against the new API surface. If your branch does not touch Special Input, Lua Extensions, the config type tree, or the YAML parser/serializer, you can skip this doc.

## Who Needs to Read This

Anyone whose branch currently touches any of:

- `src/features/editor/modules/SpecialInput.tsx` (**deleted**)
- `src/features/editor/modules/LuaExtensions.tsx` (**rewritten**)
- `src/types/config.ts` — specifically `SpecialInputConfig`, `SchemaConfig`
- `src/lib/yaml/parser.ts` or `serializer.ts`
- `src/lib/yaml/module-yaml.ts` — specifically the `MODULE_KEY_MAP`
- `src/data/module-registry.ts` — the `special-input` entry
- `src/stores/config-store.ts`
- `src/components/shared/mdx-components.tsx`
- `src/content/special-input.mdx` (**deleted**)
- `src/content/lua-extensions.mdx` (**rewritten**)

## What You'll Hit and How to Fix It

### 1. `SpecialInput.tsx` is deleted

**Symptom**: Import errors for `@/features/editor/modules/SpecialInput`.

**Fix**: Remove the import. The component is gone. If you were rendering it directly, use the new `<LuaExtensions />` container instead — it includes the preset triggers as its first tab.

```tsx
// Before
import { SpecialInput } from '@/features/editor/modules/SpecialInput'
// ...
<SpecialInput />

// After
// (no direct equivalent — the preset trigger UI is now inside LuaExtensions's first tab)
import { LuaExtensions } from '@/features/editor/modules/LuaExtensions'
<LuaExtensions />  // this shows all 3 tabs including Special Input
```

If you specifically need to render **only** the preset trigger UI without the tab shell, import the sub-component:

```tsx
import { SpecialInputTab } from '@/features/editor/modules/lua/SpecialInputTab'
<SpecialInputTab />
```

But be aware `SpecialInputTab` also renders the Custom Trigger list section. There is no longer a standalone "just the 11 preset triggers" component.

### 2. `SpecialInputConfig.customTriggers` is now required

**Symptom**: TypeScript error like:

```
Type '{ enabledTriggers: SpecialTrigger[]; }' is not assignable to type 'SpecialInputConfig'.
  Property 'customTriggers' is missing in type...
```

**Fix**: Add `customTriggers: []` to any literal you construct.

```ts
// Before
const config: SpecialInputConfig = {
  enabledTriggers: SPECIAL_TRIGGER_DEFINITIONS.map(d => ({ id: d.id, enabled: true, triggerCode: d.defaultCode })),
}

// After
const config: SpecialInputConfig = {
  enabledTriggers: SPECIAL_TRIGGER_DEFINITIONS.map(d => ({ id: d.id, enabled: true, triggerCode: d.defaultCode })),
  customTriggers: [],
}
```

If you're reading the field (not constructing it), no change is needed.

### 3. `SchemaConfig.luaScripts?` is new

**Symptom**: No symptom at compile time — the field is optional. But if you're exhaustively iterating `SchemaConfig` keys (e.g., in a custom serializer or diff function), you may now miss `luaScripts`.

**Fix**: Include `luaScripts` in your iteration.

### 4. `'special-input'` module id is gone

**Symptom**: Code that references the module id `'special-input'` — typically in conditionals, module-id-keyed maps, or test fixtures — will silently stop matching.

**Fix**: Use `'lua-extensions'` instead. The functionality is available through the new module's "特殊输入" tab.

Affected files where this id used to appear:

- `src/data/module-registry.ts` (removed in `6771882`)
- `src/lib/yaml/module-yaml.ts` `MODULE_KEY_MAP` (merged in `35d8ffa`)
- `src/content/*.mdx` cross-reference links (updated in `350796a`)

If you have test fixtures or mock data with `'special-input'` as a module id, update to `'lua-extensions'`.

### 5. `MODULE_KEY_MAP` key list changed

**Symptom**: YAML extraction / application for `lua-extensions` now pulls in `recognizer` plus the 5 sub-system keys. If your code reads `MODULE_KEY_MAP['lua-extensions'].keys` and expects only `super_comment` / `super_processor` / `user_predict` / `super_replacer` / `input_statistics`, you'll now also see `recognizer`.

**Fix**: Update any array-length assumptions. The full list is:

```ts
['recognizer', 'super_comment', 'super_processor', 'user_predict', 'super_replacer', 'input_statistics']
```

### 6. `mapToSchemaConfig` now populates `luaScripts: []`

**Symptom**: Consumers that checked `config.luaScripts === undefined` to distinguish "not yet parsed" from "parsed but empty" will see `[]` for both cases.

**Fix**: Check `config.luaScripts?.length === 0` instead.

### 7. `mapToSchemaConfig` now populates `specialInput.customTriggers`

**Symptom**: Any YAML input containing `recognizer/patterns/<name>` entries with non-preset names will now produce `CustomTrigger` objects in `config.specialInput.customTriggers`. Before this batch, those keys were silently ignored and typically fell into the `preserved` bucket.

**Fix**: If you were relying on non-preset recognizer patterns landing in `preserved`, they now land in `customTriggers` with generated UUIDs. Your diff / export logic should be updated accordingly.

### 8. `serializeSchemaConfig` emits new YAML keys

**Symptom**: Exported YAML for schemas with `customTriggers` or `luaScripts` now contains additional keys under `recognizer/patterns/*`, `engine/translators/+`, `engine/filters/+`, `engine/processors/+`.

**Fix**: If you have golden-file snapshot tests or diff-based YAML comparisons, regenerate the snapshots. The new output is additive and ordered deterministically (aggregation happens by `scriptType` then by insertion order).

### 9. The Zustand store has 6 new actions

**Symptom**: TypeScript `ConfigState` interface has new methods. If you `Pick<ConfigState, ...>` or build a mock store, you'll need to include them.

**Fix**: Include the 6 new actions in your mocks or extend your picks:

```ts
addCustomTrigger: (schemaId: string, trigger: Omit<CustomTrigger, 'id'>) => void
updateCustomTrigger: (schemaId: string, id: string, partial: Partial<Omit<CustomTrigger, 'id'>>) => void
deleteCustomTrigger: (schemaId: string, id: string) => void
addLuaScript: (schemaId: string, script: Omit<LuaScript, 'id'>) => void
updateLuaScript: (schemaId: string, id: string, partial: Partial<Omit<LuaScript, 'id'>>) => void
deleteLuaScript: (schemaId: string, id: string) => void
```

### 10. `renderLuaTemplate` uses `.split().join()`

**Symptom**: Internal — not a consumer-facing API change. But if you're auditing the template rendering logic, note that it uses `String.prototype.split` + `Array.prototype.join` rather than `.replaceAll` so the project continues to compile against the ES2020 TS lib target.

### 11. Test infrastructure now uses `vitest/config`

**Symptom**: Any custom Vitest config extension you had on top of `vite.config.ts` may behave differently now that the `test:` block is actually recognized.

**Fix**: Before the batch, the `test:` block was silently ignored. Your tests now actually run under the configured `environment: 'happy-dom'` with `afterEach(cleanup)` firing automatically. Tests that were passing due to accumulated DOM state across test cases will now fail — fix them by using unique rendered text per test or by relying on the now-working `cleanup()`.

### 12. MDX files can now use `<Details>`, `<StepGuide>`, `<Step>`, `<YamlPreview>`

**Symptom**: If you have an in-flight branch that rewrites one of the tutorials, the new components are available for you.

**Fix**: No fix — this is additive. But **rebase first** because the tutorial content you're editing has almost certainly been rewritten in Batches 2–4 and you'll hit merge conflicts.

### 13. `special-input.mdx` is deleted; `lua-extensions.mdx` is rewritten

**Symptom**: Any branch that modified either file will conflict.

**Fix**: 
- Branches editing `special-input.mdx` should be rebased — the content lives in `lua-extensions.mdx` now. Manually port any unique changes into the new file.
- Branches editing the old `lua-extensions.mdx` should rebase onto the new version at commit `6ac6534` (or the later cosmetic update at `339ff07`) — the new version uses the 3-layer depth model so content structures have changed significantly.

## Merge Conflict Hotspots

These files were touched heavily in the batch. Branches based on the pre-batch state will hit conflicts here:

| File | Why it conflicts |
|---|---|
| `src/features/editor/modules/LuaExtensions.tsx` | Full rewrite (241 → 41 lines) |
| `src/types/config.ts` | `SpecialInputConfig` shape change + new types |
| `src/stores/config-store.ts` | 6 new actions + 2 new type imports |
| `src/lib/yaml/parser.ts` | `mapToSchemaConfig` logic extensions |
| `src/lib/yaml/serializer.ts` | `serializeSchemaConfig` logic extensions |
| `src/lib/yaml/module-yaml.ts` | `MODULE_KEY_MAP` entry merge |
| `src/data/module-registry.ts` | `special-input` entry removal |
| `src/data/schemas-detail.json` | Capability migration |
| `src/components/shared/mdx-components.tsx` | 3 new component registrations |
| `vite.config.ts` | Import change (`vite` → `vitest/config`) + `test:` block |
| `src/test-setup.ts` | `afterEach(cleanup)` addition |
| All 21 `src/content/*.mdx` files | Full rewrites |

## Rebase Procedure

For a feature branch that pre-dates this batch:

```bash
# 1. Fetch the latest master with this batch merged
git fetch origin

# 2. Start the rebase
git checkout your-feature-branch
git rebase origin/master

# 3. Resolve each conflict following the guidance in this doc
#    — especially check for references to SpecialInput, 'special-input' module id,
#      and the old SpecialInputConfig shape

# 4. After each conflict is resolved
git add <resolved-files>
git rebase --continue

# 5. After the full rebase completes
npm test        # verify tests pass
npx tsc -b      # verify strict build passes
npm run build   # verify bundle builds

# 6. If all green, push with force-with-lease
git push --force-with-lease
```

If you have uncommitted changes against an in-flight tutorial file, consider whether your work should be merged into the new depth-standard version of that tutorial (check the commit that rewrote it in [01-delivery-summary.md](./01-delivery-summary.md)).

## Database / Schema Migrations

None. The batch is purely source-level — no user data or runtime state is migrated at rime-craft startup. Existing user projects loaded via `loadProject()` or persisted in browser storage continue to work because:

- `specialInput.customTriggers` is required in the type but treated leniently by consumers (defaulted to `[]`).
- `luaScripts` is optional and treated as `[]` when absent.
- The removed `'special-input'` module id is absent from `MODULE_REGISTRY` but any serialized project data doesn't reference the module id directly — it references schema configs which still have `specialInput: ...`.

Existing on-disk YAML from RIME users is consumed via import, not via the Zustand store, and the parser handles both the old and new forms.

## Runtime Behavior Changes

**User-visible**:

- The "特殊输入" entry no longer appears in the editor sidebar. Its content is now under "Lua 扩展" → "特殊输入" tab.
- Schemas that previously only declared `special-input` capability continue to show the module, because the data migration (commit `ebc00e5`) added `lua-extensions` to their capability list.
- When users import a YAML file with custom recognizer patterns (non-preset trigger names), those are now parsed into `customTriggers` and appear with a "⚠ 未关联脚本" warning until the user links a Lua script.
- When users export YAML, custom triggers and Lua script registrations are emitted. If users don't touch these new features, their exported YAML is unchanged.

**No user-visible change**:

- The 5 builtin enhancement sub-systems (super_comment, etc.) work exactly as before.
- The 11 preset triggers work exactly as before.
- All other editor modules are untouched.

## Related Documents

- [04-api-reference.md](./04-api-reference.md) — full signature reference
- [07-known-issues.md](./07-known-issues.md) — items that need team decisions
- `docs/superpowers/pr-descriptions/2026-04-11-deep-content-lua-extensions.md` — PR body with full context
