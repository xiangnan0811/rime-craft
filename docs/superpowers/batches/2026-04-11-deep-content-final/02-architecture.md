# Architecture Walkthrough

## What Changed Architecturally

Before this batch, the editor had **two sibling modules** for Lua-driven features:

- `special-input` — 11 hard-coded preset triggers (e.g. `/rq` 日期, `V` 计算器) with toggle + custom trigger code
- `lua-extensions` — 5 parameterized sub-systems (super_comment, super_processor, super_replacer, user_predict, input_statistics)

Both modules were internally backed by Lua components (translators, filters, processors) running inside RIME's engine, but the split made this invisible to users and left **no path** for users to write their own Lua code. Users who wanted to add a custom trigger or a new candidate filter had to edit YAML/Lua by hand outside rime-craft.

This batch consolidates both modules into **one `lua-extensions` module with 3 tabs**, keeping the same `capability: 'lua-extensions'` gating so it only appears for schemas that declare it, and adds a full in-browser Lua authoring surface.

## The New Module Layout

```
src/features/editor/modules/LuaExtensions.tsx   ← 41-line 3-tab container
└── src/features/editor/modules/lua/
    ├── SpecialInputTab.tsx              (preset triggers + custom trigger list)
    ├── BuiltinEnhancementsTab.tsx       (5 parameterized sub-systems)
    ├── CustomScriptsTab.tsx             (Lua script authoring)
    │
    ├── CustomTriggerList.tsx            (list + add/edit/delete for CustomTrigger[])
    ├── CustomTriggerForm.tsx            (dialog form used by CustomTriggerList)
    │
    ├── LuaScriptList.tsx                (list + "new script" buttons + selected-script editor)
    ├── LuaCodeEditor.tsx                (lazy-loaded CodeMirror 6 wrapper)
    └── LuaScriptYamlPreview.tsx         (auto-generated YAML patch snippet per script)
```

## Tab Responsibilities

### Tab 1 — 特殊输入 (`SpecialInputTab.tsx`)

Two sections stacked vertically:

1. **Preset triggers** (same 11 triggers as before, same 3 categories: 日期时间 / 工具 / 统计). Each has a toggle and a trigger-code `<Input>`. Managed via `updateSchemaConfig(schemaId, { specialInput: { enabledTriggers, customTriggers } })`.

2. **Custom triggers** (new). Rendered via `<CustomTriggerList schemaId={primarySchemaId} />`. Users can add, edit, and delete triggers via `<CustomTriggerForm>` dialog. Each custom trigger references a Lua script in Tab 3 via `scriptId`.

### Tab 2 — 内置功能增强 (`BuiltinEnhancementsTab.tsx`)

Verbatim extraction of the pre-refactor `LuaExtensions.tsx` body — the 5 parameterized sub-system cards (super_comment, super_processor, super_replacer, user_predict, input_statistics). No functional changes, just moved into its own tab. The intent is that users who only want to adjust parameters of pre-shipped Lua functions don't need to see the scripting UI.

### Tab 3 — 自定义脚本 (`CustomScriptsTab.tsx`)

Full Lua authoring surface:

- "New script" button group: 3 buttons for Translator / Filter / Processor. Each seeds a new `LuaScript` entry with a template from `src/data/lua-script-templates.ts` via `renderLuaTemplate(scriptType, identifier)`.
- **Script list** (`LuaScriptList.tsx`): shows all `luaScripts` for the primary schema with click-to-select.
- **Selected script editor**: shown in a card under the list. Fields: `fileName` (validated against `/^[a-zA-Z0-9_-]*\.?l?u?a?$/` during edit), `scriptType` (Select), `description` (Input), `code` (`LuaCodeEditor`).
- **YAML preview** (`LuaScriptYamlPreview.tsx`): rendered below the editor, shows the auto-generated `patch: engine/<type>/+: [lua_<type>@<identifier>]` that will be emitted when the config is exported.

## Data Flow

### Creation flow (new custom trigger with new Lua script)

```
User clicks "新建 Translator"
  → CustomScriptsTab invokes addLuaScript(schemaId, {fileName, scriptType, description, code})
  → store generates UUID, inserts LuaScript into schemaConfigs[schemaId].luaScripts
  → List re-renders, new script is selected
  → User edits code in LuaCodeEditor

User switches to "特殊输入" tab, clicks "+ 添加自定义触发器"
  → CustomTriggerForm opens; dropdown shows Translator scripts from schemaConfigs[schemaId].luaScripts
  → User fills name, trigger code, picks script
  → addCustomTrigger(schemaId, {name, triggerCode, description, scriptId})
  → store inserts CustomTrigger into schemaConfigs[schemaId].specialInput.customTriggers

User clicks "导出 YAML"
  → src/lib/yaml/serializer.ts::serializeSchemaConfig(schemaConfig) walks:
      - specialInput.customTriggers → emits recognizer/patterns/<fileName-without-.lua>: "^<escapedTriggerCode>$"
      - luaScripts → emits engine/translators/+ / engine/filters/+ / engine/processors/+ with lua_<type>@<identifier>
  → User downloads the resulting patch + the .lua file contents
```

### Import flow (reading a user-contributed YAML)

```
User imports a YAML file containing custom recognizer patterns
  → parser::mapToSchemaConfig(expanded, schemaId) walks both:
      - flat keys: recognizer/patterns/<name>: "<regex>"
      - nested object: recognizer: { patterns: { <name>: "<regex>" } }
  → For each non-preset name, the parser creates a CustomTrigger with:
      - id = crypto.randomUUID()
      - name = <name>
      - triggerCode = regex with ^ and $ stripped
      - description = ''
      - scriptId = '' (no linked script yet)
  → luaScripts array is initialized as [] since Lua file content must arrive separately
  → UI shows an orange warning "⚠ 未关联脚本" next to each imported trigger until the user links one
```

## Type Relationships

```
RimeProject
└── schemaConfigs: Record<string, SchemaConfig>
    └── SchemaConfig
        ├── schemaId
        ├── fuzzyRules
        ├── switches?
        ├── punctuator?
        ├── translator?
        ├── spellingScheme?
        ├── auxiliaryCode?
        ├── reverseLookup?
        ├── specialInput?: SpecialInputConfig
        │   ├── enabledTriggers: SpecialTrigger[]  (preset, 11 items max)
        │   └── customTriggers: CustomTrigger[]    (user-defined)  ← NEW, required field
        ├── luaExtensions?: LuaExtensionsConfig
        ├── luaScripts?: LuaScript[]               ← NEW
        └── displayConfig?

CustomTrigger                    LuaScript
├── id: string (UUID)            ├── id: string (UUID)
├── name: string                 ├── fileName: string (e.g. "my_translator.lua")
├── triggerCode: string          ├── scriptType: 'translator'|'filter'|'processor'
├── description: string          ├── description: string
└── scriptId: string ───────────→└── (linked by CustomTrigger.scriptId)
                                   ├── code: string (Lua source)
```

Key constraints (enforced only by convention / runtime checks for now):

- `CustomTrigger.scriptId` **should** reference an existing `LuaScript.id` within the same `SchemaConfig`. The UI warns via "⚠ 未关联脚本" when the reference is missing or broken, but the store does not cascade-delete triggers when their script is deleted.
- `LuaScript.fileName` **should** match `[a-zA-Z0-9_-]+\.lua` — the UI input filter prevents malformed names, but imported data is not validated.
- Only `LuaScript.scriptType === 'translator'` can be linked to a custom trigger (Filters and Processors don't produce candidates that a trigger invokes). The `CustomTriggerForm` only lists translator scripts in its dropdown.

## Component Tree in the Editor

```
EditorContent (routes by activeModule)
└── ModuleWrapper (form/yaml tab switch — unchanged)
    └── <LuaExtensions />
        ├── Header (<h3>Lua 扩展</h3> + <LearnMoreLink module="lua-extensions" />)
        └── <Tabs defaultValue="special-input">
            ├── <TabsContent value="special-input"><SpecialInputTab /></TabsContent>
            ├── <TabsContent value="builtin"><BuiltinEnhancementsTab /></TabsContent>
            └── <TabsContent value="custom-scripts"><CustomScriptsTab /></TabsContent>
```

`SpecialInputTab` contains:
```
<div> (space-y-6)
  ├── Intro paragraph + SettingHelp tooltip
  ├── TRIGGER_CATEGORIES.map → groups of preset triggers (Switch + Input per trigger)
  └── Custom triggers section
      └── <CustomTriggerList schemaId={primarySchemaId} />
          ├── List (one card per trigger)
          ├── "+ 添加自定义触发器" button
          └── <CustomTriggerForm> dialog (controlled open state)
```

`CustomScriptsTab` contains:
```
<div>
  ├── Intro paragraph + SettingHelp tooltip
  └── <LuaScriptList schemaId={primarySchemaId} />
      ├── Create buttons (Translator / Filter / Processor)
      ├── List of script cards (click to select)
      └── Selected script editor (conditional)
          ├── Filename / Type / Description fields
          ├── <LuaCodeEditor value={code} onChange={...} />
          └── <LuaScriptYamlPreview script={selected} />
```

## Lazy Loading Strategy

`LuaCodeEditor.tsx` uses **`useMemo(() => lazy(async () => { ... }), [])`** to create a stable lazy reference whose async payload imports all CodeMirror packages:

```ts
const LazyEditor = useMemo(
  () =>
    lazy(async () => {
      const [{ default: CM }, { StreamLanguage }, { lua }, { oneDark }] = await Promise.all([
        import('@uiw/react-codemirror'),
        import('@codemirror/language'),
        import('@codemirror/legacy-modes/mode/lua'),
        import('@codemirror/theme-one-dark'),
      ])
      const luaSupport = StreamLanguage.define(lua)
      return {
        default: (innerProps) => (
          <CM value={innerProps.value} height={innerProps.height} extensions={[luaSupport]}
              theme={oneDark} editable={!innerProps.readOnly} onChange={(v) => innerProps.onChange(v)} />
        ),
      }
    }),
  [],
)
```

**Result**: CodeMirror (and the Lua StreamLanguage + OneDark theme) is not in the initial JS bundle. The main `index-*.js` stays at ~113 kB gzipped. CodeMirror arrives in the route-level lazy chunk that backs the `lua-extensions` module, so users who never navigate to that module pay zero cost.

**Caveat**: The `useMemo` pattern is unconventional — normally `lazy()` is called at module scope. It works correctly here because the `[]` deps array stabilizes the reference, but future maintainers should be aware. See [07-known-issues.md](./07-known-issues.md) item 1 for the follow-up cleanup note.

## Capability Gating

Schemas declare which editor modules are applicable via the `capabilities: string[]` array in `src/data/schemas-detail.json`. The module registry's `applicability` field for `lua-extensions` is:

```ts
applicability: { type: 'capability', cap: 'lua-extensions' }
```

Before this batch, some schemas declared `"special-input"` without `"lua-extensions"`. Batch 1's capability migration (commit `ebc00e5`) added `"lua-extensions"` to every such schema so the merged module still appears where it should.

The `"special-input"` capability string is **retained** in the data (harmless leftover) so any external consumer that checks for it continues to work. Only the module-registry entry with `id: 'special-input'` was removed (commit `6771882`).

## YAML I/O Contract

### Serialization

`serializeSchemaConfig(config)` now emits (in addition to everything it already emitted):

```yaml
# For each CustomTrigger in config.specialInput.customTriggers:
recognizer/patterns/<script-filename-without-.lua>: ^<escapedTriggerCode>$

# For each LuaScript in config.luaScripts, aggregated by type:
engine/translators/+: [ lua_translator@<id1>, lua_translator@<id2>, ... ]
engine/filters/+:     [ lua_filter@<id1>, ... ]
engine/processors/+:  [ lua_processor@<id1>, ... ]
```

where `<id>` = `fileName.replace(/\.lua$/, '')`.

A new private `escapeRegExp(str)` helper escapes regex-sensitive characters in trigger codes so `.`, `+`, `?` etc. in the user-supplied trigger code are treated literally.

### Deserialization

`mapToSchemaConfig(expanded, schemaId)` does two new things:

1. Scans `expanded` for keys matching `^recognizer\/patterns\/(.+)$` whose value is a string. For each match whose pattern id is **not** in `SPECIAL_TRIGGER_DEFINITIONS`, creates a `CustomTrigger` with a fresh UUID, `name = patternId`, `triggerCode = value.replace(/^\^/, '').replace(/\$$/, '')`, empty description, empty scriptId.

2. Also scans for the **nested** form `recognizer: { patterns: { <patternId>: <string> } }` to handle raw YAML that uses nested objects instead of patch paths. Deduplication prevents double-counting if both forms appear.

3. Initializes `result.luaScripts = []` so consumers can rely on the field being an array rather than undefined.

**Important**: The parser does **not** extract Lua script source code from YAML. Lua scripts live in separate `.lua` files, not inside the YAML patch. If a user imports only a YAML patch, they'll see custom triggers with `scriptId: ''` and a "⚠ 未关联脚本" warning — they need to separately import the `.lua` files or create them via the Custom Scripts tab.

## State Management

All new state is stored under `schemaConfigs[schemaId]` in the existing Zustand store (`src/stores/config-store.ts`). No new top-level state slices. The 6 new actions are:

```ts
addCustomTrigger(schemaId, trigger: Omit<CustomTrigger, 'id'>): void
updateCustomTrigger(schemaId, id, partial: Partial<Omit<CustomTrigger, 'id'>>): void
deleteCustomTrigger(schemaId, id): void

addLuaScript(schemaId, script: Omit<LuaScript, 'id'>): void
updateLuaScript(schemaId, id, partial: Partial<Omit<LuaScript, 'id'>>): void
deleteLuaScript(schemaId, id): void
```

All actions:
- Use `crypto.randomUUID()` to generate fresh IDs on add
- Treat `schemaConfigs[schemaId]` as immutable — always return new objects
- Set `isDirty: true` on the project (same convention as existing actions)
- Return `{}` early (no-op) when the target schema has no existing `specialInput` / `luaScripts` and the action targets a non-existent entry

See [04-api-reference.md](./04-api-reference.md) for full signatures and test coverage.

## Content Model (cross-cutting)

The content depth standard (`docs/CONTENT_DEPTH_GUIDE.md`) defines a **3-layer model** that every tutorial MDX file must follow:

- **Layer 1 (always visible)** — 是什么 / 快速上手 / 配置项详解
- **Layer 2 (always visible)** — 原理机制 / 完整示例 / 常见场景
- **Layer 3 (inside `<Details>` folds)** — 自定义扩展 / 常见问题与排错 / 注意事项与维护 / 底层细节

Mechanically enforced: every tutorial has ≥1 `<StepGuide>`, ≥3 `<Details>` (at least one with `level="advanced"`), ≥1 `<YamlPreview>`, ≥2 callouts. This is spot-checked in [03-content-audit.md](./03-content-audit.md).

## Related Documents

- [01-delivery-summary.md](./01-delivery-summary.md) — what shipped
- [03-content-audit.md](./03-content-audit.md) — per-tutorial depth verification
- [04-api-reference.md](./04-api-reference.md) — API signatures
- [05-migration-guide.md](./05-migration-guide.md) — upgrade guide for in-flight code
