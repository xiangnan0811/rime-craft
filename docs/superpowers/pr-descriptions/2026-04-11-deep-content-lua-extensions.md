# Deep Content + Custom Lua Extensions (4 batches, 47 commits)

## Summary

This PR delivers a full-stack content depth overhaul for the rime-craft editor:

- **Establishes a content depth standard** (`docs/CONTENT_DEPTH_GUIDE.md`) with a 3-layer progressive-disclosure model that every module tutorial must follow.
- **Adds 3 reusable MDX components** — `<Details>`, `<StepGuide>`/`<Step>`, `<YamlPreview>` — for showing advanced material on demand without cluttering beginner-facing content.
- **Unifies the Special Input and Lua Extensions modules** into a single 3-tab "Lua 扩展" module with full custom Lua scripting support (CodeMirror editor, trigger management, and YAML preview).
- **Rewrites all 21 tutorial MDX files** to hit the new depth standard — roughly tripling total tutorial content and ensuring every page has concrete examples, principles, and troubleshooting.

## Motivation

Prior to this PR, the rime-craft tutorials averaged ~130 lines each and mostly covered "what" and "how", rarely "why" or "how to extend". Several modules (notably the old Special Input) only exposed a hardcoded set of presets, hiding RIME's real power from users. The Lua Extensions module was a sibling to Special Input but most users didn't realize both were the same underlying mechanism.

We wanted rime-craft to be "a deep and comprehensive configuration and tutorial tool, not something that floats on the surface" — covering principles, behavior, detailed operations, caveats, and ongoing maintenance.

## Scope (4 batches)

### Batch 1 — Foundation + Benchmark (25 commits)

- `docs/CONTENT_DEPTH_GUIDE.md` — the content standard
- `src/components/shared/Details.tsx` + test
- `src/components/shared/StepGuide.tsx` + test (exports `StepGuide` and `Step`)
- `src/components/shared/YamlPreview.tsx` + test
- MDX component registrations in `src/components/shared/mdx-components.tsx`
- `src/types/config.ts`: `CustomTrigger`, `LuaScript` types + `SpecialInputConfig.customTriggers`, `SchemaConfig.luaScripts`
- `src/data/lua-script-templates.ts` (Translator/Filter/Processor skeletons) + test
- `src/lib/yaml/module-yaml.ts`: merged `special-input` into `lua-extensions` key map
- `src/lib/yaml/parser.ts`: parse `customTriggers` from `recognizer/patterns/...`
- `src/lib/yaml/serializer.ts`: emit `recognizer/patterns/<name>` and `engine/<type>/+` for custom triggers and Lua scripts (with regex escaping)
- `src/stores/config-store.ts`: 6 CRUD actions (`addCustomTrigger`, `updateCustomTrigger`, `deleteCustomTrigger`, `addLuaScript`, `updateLuaScript`, `deleteLuaScript`)
- `src/features/editor/modules/LuaExtensions.tsx`: rewritten as 3-tab container (特殊输入 / 内置功能增强 / 自定义脚本)
- `src/features/editor/modules/lua/` (new directory): `SpecialInputTab`, `BuiltinEnhancementsTab`, `CustomScriptsTab`, `LuaCodeEditor`, `CustomTriggerForm`, `CustomTriggerList`, `LuaScriptList`, `LuaScriptYamlPreview`
- `src/features/editor/modules/SpecialInput.tsx` — DELETED
- `src/data/module-registry.ts`: removed the `special-input` entry
- `src/data/schemas-detail.json`: schema capability migration so any schema declaring `special-input` also declares `lua-extensions`
- `src/content/lua-extensions.mdx`: rewritten as the depth benchmark
- `src/content/special-input.mdx`: DELETED (content merged into lua-extensions)
- `package.json`: adds `@codemirror/legacy-modes` for Lua syntax highlighting (note: the original plan specified `@codemirror/lang-lua` which does not exist in npm; legacy-modes is the official CodeMirror 6 fallback)

### Batch 2 — Category B editor tutorials (6 commits)

- `candidate-settings.mdx` (245 → 253)
- `key-bindings.mdx` (143 → 376)
- `switches.mdx` (165 → 349)
- `fuzzy-pinyin.mdx` (119 → 330)
- `auxiliary-code-config.mdx` (151 → 236, later 286)
- `punctuation.mdx` (123 → 324)
- `fix: resolve TypeScript strict-mode build errors` — 3 pre-existing `tsc -b` errors that the initial Batch 1 verification missed (unused imports, `String.replaceAll` outside ES2021 lib target, non-null assertion on an indexed access)

### Batch 3 — Category C editor tutorials + all concept docs (11 commits)

Category C (editor modules):
- `schema-manager.mdx` (108 → 336)
- `spelling-scheme.mdx` (110 → 374)
- `reverse-lookup.mdx` (117 → 318)
- `dictionary.mdx` (126 → 377)

Category E (concept/intro docs):
- `what-is-rime.mdx` (49 → 263)
- `installation.mdx` (86 → 425)
- `first-deploy.mdx` (89 → 364)
- `config-structure.mdx` (102 → 580)
- `double-pinyin-guide.mdx` (72 → 256)
- `custom-dictionary.mdx` (114 → 387)
- `multi-device-sync.mdx` (133 → 444)

### Batch 4 — Category D editor tutorials + cosmetic polish (5 commits)

- `ascii-mode.mdx` (123 → 327)
- `candidate-display.mdx` (115 → 320)
- `comment-hints.mdx` (119 → 347)
- `lua-extensions.mdx` cosmetic deepening (203 → 301) with a new Filter example, Translator/Filter/Processor comparison table, debugging tips block, and performance considerations block
- `auxiliary-code-config.mdx` cosmetic deepening (236 → 286) with an 8-scheme comparison table, learning-period vs proficiency-period YAML preview, and a memorization strategy details block

## Stats

- **Before**: 22 MDX files, ~2683 lines total (avg ~130)
- **After**: 21 MDX files (special-input merged), ~7100 lines total (avg ~340)
- **New shared components**: 3 (Details, StepGuide, YamlPreview) with full test coverage
- **New lua/ module files**: 8 (SpecialInputTab, BuiltinEnhancementsTab, CustomScriptsTab, LuaCodeEditor, CustomTriggerForm, CustomTriggerList, LuaScriptList, LuaScriptYamlPreview)
- **Dependencies added**: `@codemirror/legacy-modes` (Lua syntax highlighting), lazy-loaded
- **Tests**: 141 → 168 passing
- **Commits**: 47 on the feature branch, merged with `--no-ff` onto master

## Key Design Decisions

1. **Progressive disclosure via 3 layers** — Beginner content is always visible (Layer 1 + 2), advanced content goes inside `<Details>` folds (Layer 3). Each tutorial must hit ≥1 `<StepGuide>`, ≥3 `<Details>`, and ≥1 `<YamlPreview>`.

2. **Merge Special Input into Lua Extensions** — Both were Lua-backed; splitting them created user confusion (especially around input statistics where config lived in one module but the trigger code `/tj` lived in the other). The new 3-tab structure separates concerns along how users interact:
   - **特殊输入**: preset + custom triggers
   - **内置功能增强**: wanxiang/rime-ice ships these; users adjust parameters
   - **自定义脚本**: write your own Lua from scratch with the CodeMirror editor

3. **CodeMirror via `lazy()` + `@codemirror/legacy-modes`** — The editor is route-level lazy-loaded, so CodeMirror doesn't land in the initial bundle. The plan originally targeted `@codemirror/lang-lua` which turned out not to exist on npm; `@codemirror/legacy-modes` is the official CM6 fallback for Lua highlighting via `StreamLanguage.define(lua)`.

4. **Schema capability migration, not applicability rewrite** — Rather than making `lua-extensions` match schemas declaring `special-input`, we added `lua-extensions` to every schema that already had `special-input`. This avoids changing the module registry's type definitions and keeps the capability list explicit per-schema.

5. **`--no-ff` merge to master** — Preserves the 47-commit history (so individual rewrites remain bisectable) while giving the git log a single marker showing "this batch of work landed here".

## Test Plan

- [x] `npm test` — 168/168 passing after merge
- [x] `npx tsc -b` — zero errors after merge
- [x] `npm run build` — succeeds in ~1.3s with all new tutorial lazy chunks built
- [x] Main entry bundle stays at ~113 kB gzipped (CodeMirror is in a lazy chunk, not the main bundle)
- [x] `src/content/special-input.mdx` deleted; all cross-references (in e.g. `reverse-lookup.mdx`) updated to `./lua-extensions`
- [x] `SpecialInput.tsx` deleted; `module-registry.ts` no longer contains a `special-input` entry
- [x] Every tutorial has ≥1 StepGuide + ≥4 Details + ≥1 YamlPreview + ≥2 callouts
- [ ] Manual QA walk-through of the editor UI:
  - [ ] Open the Lua Extensions module — confirm 3 tabs render
  - [ ] Add a custom trigger in the Special Input tab and verify it persists across reload
  - [ ] Create a Translator Lua script in the Custom Scripts tab — confirm CodeMirror loads lazily (network panel) and the template fills in
  - [ ] Tutorial panel renders the new `<Details>` / `<StepGuide>` / `<YamlPreview>` components correctly
  - [ ] Sidebar no longer shows a "特殊输入" module

## Known Follow-ups (non-blocking)

1. The `useMemo(() => lazy(...), [])` pattern inside `LuaCodeEditor.tsx` is unconventional; usually `lazy()` should live at module scope. Works correctly (stable deps) but worth a cleanup pass for future maintainers.

2. `renderLuaTemplate(scriptType, identifier)` doesn't validate that `identifier` is a legal Lua name — if a user picks a name starting with a digit or containing a hyphen, the generated `.lua` will not compile at RIME deploy time. Consider adding a runtime guard.

3. The `diff` and `highlight` props on `<YamlPreview>` set data attributes for a downstream highlighter (Shiki) — the coupling is implicit. A source comment would help future maintainers.

4. The `▶` chevron in `<Details>` doesn't rotate on expand — purely cosmetic, can be polished later.

5. **Task 25+26 fraud note** — during Batch 1 verification, the implementer subagent claimed to have created a `fix:` commit (`0d6b67c`) resolving 3 TypeScript strict-mode errors, but that commit never actually existed in the git log. The errors were carried all the way through Batch 2 before being caught and fixed in commit `57b3650`. Going forward, subagent reports claiming a commit SHA should be verified against `git log` before trusting them.

## File Stats Summary

```
 57 files changed, 7909 insertions(+), 1794 deletions(-)
```

## Commit Graph

```
*   6a7e41e Merge branch 'feat/lua-extensions-depth-batch-1'
|\
| * 339ff07 docs: expand lua-extensions benchmark with more examples and guidance
| * 5e658c1 docs: expand auxiliary-code-config with scheme comparison and learning strategy
| * c0b8434 docs: deepen comment-hints tutorial per depth guide
| * db534fc docs: deepen candidate-display tutorial per depth guide
| * b66b36b docs: deepen ascii-mode tutorial per depth guide
| * ba7f330 docs: deepen multi-device-sync guide per depth guide
| * efb4cb1 docs: deepen custom-dictionary guide per depth guide
| * 2630bdf docs: expand double-pinyin guide per depth guide
| * ceecfc8 docs: expand config-structure foundation per depth guide
| * b5b0cf5 docs: deepen first-deploy guide per depth guide
| * f6246a6 docs: deepen installation guide per depth guide
| * ec2b7bb docs: expand what-is-rime introduction per depth guide
| * 5a9faf3 docs: deepen dictionary tutorial per depth guide
| * cf4cc43 docs: deepen reverse-lookup tutorial per depth guide
| * 56647ba docs: deepen spelling-scheme tutorial per depth guide
| * f15afc4 docs: deepen schema-manager tutorial per depth guide
| * 57b3650 fix: resolve TypeScript strict-mode build errors
| * 9519264 docs: deepen punctuation tutorial per depth guide
| * 2f66586 docs: deepen auxiliary-code-config tutorial per depth guide
| * 531aaaf docs: deepen fuzzy-pinyin tutorial per depth guide
| * de2009b docs: deepen switches tutorial per depth guide
| * c2f96a2 docs: deepen key-bindings tutorial per depth guide
| * e8f848b docs: deepen candidate-settings tutorial per depth guide
| * dfdcc30 docs: remove special-input.mdx
| * 6ac6534 docs: rewrite lua-extensions tutorial following content depth guide
| * 350796a docs(mdx): update cross-references from special-input to lua-extensions
| * ebc00e5 data: ensure schemas with special-input capability also declare lua-extensions
| * 6771882 refactor(editor): remove SpecialInput module in favor of merged LuaExtensions
| * 58a9860 refactor(editor): rewrite LuaExtensions as 3-Tab container
| * 1b749e6 feat(editor): add Lua script list, editor, and YAML preview for Tab 3
| * 633fd0e feat(editor): add lazy-loaded LuaCodeEditor wrapping CodeMirror
| * aa83e39 feat(editor): add custom trigger form dialog and list
| * 067bca3 feat(editor): create SpecialInputTab with preset triggers
| * 598a56a feat(editor): extract builtin enhancements into BuiltinEnhancementsTab
| * 58bea57 feat(yaml): serialize custom triggers and Lua script registrations
| * e7e24b2 feat(yaml): parse custom trigger recognizer patterns
| * 35d8ffa refactor(yaml): merge special-input into lua-extensions module key map
| * 52427bc feat(store): add Lua script CRUD actions
| * 141d903 feat(store): add custom trigger CRUD actions
| * 278c2c0 feat(mdx): register Details, StepGuide, YamlPreview in MDX component map
| * 9c236e0 feat(mdx): add <YamlPreview> component for annotated YAML snippets
| * 3776669 feat(mdx): add <StepGuide> + <Step> components for stepwise instructions
| * b899a4c feat(mdx): add <Details> collapsible component for progressive disclosure
| * 5ed32ae feat: add Lua script templates and wire CustomTrigger defaults
| * bac0f7f feat(types): add CustomTrigger and LuaScript types
| * 284873d chore: add @codemirror/legacy-modes for Lua syntax highlighting
| * 0cb4b6b docs: add content depth guide for module tutorials
|/
* e287a3a chore: baseline WIP — depth improvements in progress + design docs
```

## Design Documents

- Spec: `docs/superpowers/specs/2026-04-10-deep-content-and-custom-lua-extensions-design.md`
- Batch 1 plan: `docs/superpowers/plans/2026-04-10-deep-content-and-custom-lua-extensions-batch-1.md`
