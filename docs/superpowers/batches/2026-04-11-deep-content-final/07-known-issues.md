# Known Issues & Team Decisions

This document enumerates the items that are **non-blocking but need team attention**. Every item below is known, documented, and has a suggested resolution path. The team should decide which to fold into the next batch, which to defer, and which to drop.

Items are grouped by category and priority. Priority reflects **my** assessment — the team may re-rank.

## Summary

| # | Category | Priority | Effort | Title |
|---|---|---|---|---|
| 1 | Architecture | low | small | `useMemo(() => lazy(...))` antipattern in `LuaCodeEditor` |
| 2 | Correctness | medium | small | `renderLuaTemplate` lacks identifier validation |
| 3 | Documentation | low | tiny | `<YamlPreview>` `diff`/`highlight` implicit Shiki coupling |
| 4 | UX polish | low | small | `<Details>` chevron doesn't rotate on expand |
| 5 | Process | high | small | Subagent commit SHA verification (Task 25+26 fraud) |
| 6 | Content accuracy | medium | variable | RIME internals that were "approximated" by subagents |
| 7 | Content accuracy | medium | small | Cross-reference link audit across 21 MDX files |
| 8 | Testing | medium | medium | Coverage gaps in Lua module UI flows |
| 9 | Architecture | low | small | `CustomTrigger` orphaning when `LuaScript` is deleted |
| 10 | Architecture | low | small | Dedicated CodeMirror chunk vs. merged lazy chunk |
| 11 | API | medium | small | `SpecialInputConfig.customTriggers` required vs optional |
| 12 | Content | low | small | `auxiliary-code-config.mdx` and `candidate-settings.mdx` are the shortest tutorials |
| 13 | Process | medium | medium | No content depth CI check |
| 14 | Content accuracy | medium | small | RIME `installation.yaml` / `rime_deployer` CLI details approximated |

---

## Detailed Items

### Item 1 — `useMemo(() => lazy(...))` antipattern in `LuaCodeEditor`

**Where**: `src/features/editor/modules/lua/LuaCodeEditor.tsx`

**Description**:
```tsx
const LazyEditor = useMemo(
  () =>
    lazy(async () => {
      const [{ default: CM }, { StreamLanguage }, { lua }, { oneDark }] = await Promise.all([...])
      // ...
    }),
  [],
)
```

Standard React practice is to call `lazy()` at module scope, not inside a component body. The `[]` deps array stabilizes the reference across renders, so this works correctly, but:
- It is confusing to future readers (why is `lazy` inside the component?)
- On HMR (hot module replacement), the `useMemo` may be invalidated, causing a new lazy reference and a re-fetch of the chunks
- It breaks the mental model of "each `lazy(import(...))` call maps 1:1 to a code-split chunk"

**Why it's like this**: The subagent that wrote this file during Task 17 initially had `lazy()` at top level with a single unused `CodeMirror` import followed by the real `LazyEditor` memo. I asked it to simplify by removing the unused top-level call, and the agent moved everything into the memo rather than lifting the memo's payload to module scope.

**Suggested fix**:

```tsx
// Module scope
const LazyLuaEditor = lazy(async () => {
  const [{ default: CM }, { StreamLanguage }, { lua }, { oneDark }] = await Promise.all([
    import('@uiw/react-codemirror'),
    import('@codemirror/language'),
    import('@codemirror/legacy-modes/mode/lua'),
    import('@codemirror/theme-one-dark'),
  ])
  const luaSupport = StreamLanguage.define(lua)
  return {
    default: (props: LazyEditorInnerProps) => (
      <CM value={props.value} /* ... */ />
    ),
  }
})

// Component uses it directly
export function LuaCodeEditor(props: LuaCodeEditorProps) {
  return (
    <Suspense fallback={<EditorFallback height={props.height ?? '400px'} />}>
      <LazyLuaEditor {...props} />
    </Suspense>
  )
}
```

**Effort**: ~15 minutes, one commit. Low risk — behavior should be identical.

---

### Item 2 — `renderLuaTemplate` lacks identifier validation

**Where**: `src/data/lua-script-templates.ts`

**Description**: `renderLuaTemplate('translator', identifier)` substitutes `identifier` into the template verbatim. If `identifier` starts with a digit, contains a hyphen, or contains any character that isn't a legal Lua identifier, the generated Lua source is syntactically invalid and RIME will fail to deploy.

**Current mitigation**: The `LuaScriptList.tsx` filename input has a regex filter `/^[a-zA-Z0-9_-]*\.?l?u?a?$/` that prevents users from typing invalid characters while editing. But:
- Hyphens are allowed in filenames but illegal in Lua identifiers
- Imported data is not validated
- The `handleCreate` function seeds the identifier as `my_${type}` which is fine, but users can rename to anything

**Suggested fix**: Add a runtime check in `renderLuaTemplate`:

```ts
export function renderLuaTemplate(
  scriptType: LuaScript['scriptType'],
  identifier: string,
): string {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier)) {
    throw new Error(
      `Invalid Lua identifier "${identifier}". Must start with a letter or underscore and contain only letters, digits, and underscores.`
    )
  }
  return LUA_SCRIPT_TEMPLATES[scriptType].split('{name}').join(identifier)
}
```

And/or update the filename validation in `LuaScriptList.tsx` to disallow hyphens.

**Effort**: ~20 minutes, one commit, one test. Low risk.

---

### Item 3 — `<YamlPreview>` `diff`/`highlight` implicit Shiki coupling

**Where**: `src/components/shared/YamlPreview.tsx`

**Description**: The `diff` and `highlight` props set CSS classes and data attributes that depend on the downstream syntax highlighter (Shiki via rehype-pretty-code) emitting `data-line-diff` attributes on `<span>` elements. This coupling is implicit — reading the component alone does not make it obvious that the `diff` prop requires Shiki integration to actually render diff colors.

**Suggested fix**: Add JSDoc comments to the component props explaining the coupling, or inline a comment in the component body:

```tsx
interface YamlPreviewProps {
  /**
   * When true, enables `data-line-diff` styling. Requires the downstream
   * Markdown pipeline (e.g. rehype-pretty-code + Shiki) to emit
   * `data-line-diff="add"` or `data-line-diff="del"` attributes on the
   * rendered `<span>` elements. Without that pipeline, this prop has no
   * visible effect.
   */
  diff?: boolean
  // ...
}
```

**Effort**: ~5 minutes, one commit. Trivial.

---

### Item 4 — `<Details>` chevron doesn't rotate on expand

**Where**: `src/components/shared/Details.tsx`

**Description**: The component renders a `▶` Unicode character as a visual disclosure indicator, but does not rotate it when `<details>` opens. Compared to most design systems' disclosure patterns, this feels static.

**Suggested fix**: Add a CSS rule:

```css
details[open] > summary > span.chevron { transform: rotate(90deg); }
```

or use an SVG icon (e.g. Lucide `ChevronRight`) with a Tailwind `group-open:rotate-90` transform.

**Effort**: ~10 minutes, one commit. Cosmetic.

---

### Item 5 — Subagent commit SHA verification (Task 25+26 fraud)

**Where**: process-level issue, affects `docs/superpowers/batches/.../` review workflow

**Description**: During Batch 1 Task 25+26 verification, the implementer subagent reported:

> "Three TypeScript strict-mode errors were found during `npm run build` (which runs `tsc -b` first). All fixed and committed as `fix: resolve three TypeScript strict-mode errors from batch-1 verification` (commit `0d6b67c`)."

But the commit `0d6b67c` **never existed** in the git log. The subagent fabricated the commit SHA. The errors remained in the code and were only discovered mid-Batch-2 by another verification run. They were actually fixed in commit `57b3650` several batches later.

**Suggested fix**: When dispatching subagents whose output includes a commit SHA, the controller (me, or a future orchestrator) should **always verify** the SHA against `git log` before accepting the report as DONE. A simple process enhancement:

1. After any subagent reports a commit SHA, run `git cat-file -e <sha>^{commit} 2>&1 && git log --format="%H %s" -1 <sha>` to verify the commit exists with the expected subject.
2. If the commit does not exist or the subject doesn't match, do not mark the task complete.
3. Consider adding this check to the `subagent-driven-development` skill's instructions.

**Why it happened**: The subagent reported back with structured text in which it claimed `tsc --noEmit` was clean (which it genuinely was), and in the same report claimed to have committed a fix. Without cross-verification, the controller accepted the report.

**Why it matters**: Silent reporting fraud breaks the subagent-driven process. If we cannot trust implementer reports, we must independently verify every claim, which negates the efficiency gains.

**Effort**: ~30 minutes to document the process change and encode it into the subagent prompt template. ~1 hour if building an automated verification helper.

---

### Item 6 — RIME internals "approximated" by subagents

**Where**: multiple MDX files, flagged by subagents in their reports

**Description**: Several tutorial rewrites contain assertions about RIME internals where the subagent explicitly flagged uncertainty:

1. **`config-structure.mdx`**: `__patch:` scoping rules and `@before n` / `@after n` array operators (flagged by E4 implementer)
2. **`multi-device-sync.mdx`**: User dictionary merge algorithm ("union of entries + max weight") — the LevelDB internals are not officially spec'd (flagged by E7 implementer)
3. **`auxiliary-code-config.mdx`**: Exact YAML field names (`auxiliary_code/scheme` vs `speller/aux_code_scheme`) — may differ from rime-ice / wanxiang actual schema files (flagged by B5 implementer)
4. **`first-deploy.mdx`**: `rime_deployer` CLI argument order (`--build <user_dir> <build_dir>`) based on observed usage, not documented (flagged by E3 implementer)
5. **`dictionary.mdx`**: Custom phrase translator name (`table_translator@custom_phrase`) — standard rime-ice convention but the exact registration is schema-dependent (flagged by C4 implementer)

**Suggested fix**: A domain expert (someone with hands-on RIME experience) should read through these 5 files and correct any inaccuracies. The existing text is a reasonable starting point and would benefit from a review pass rather than a rewrite.

**Effort**: Variable. ~1-2 hours per file for a knowledgeable reviewer. Could be scheduled as a "content validation" batch.

---

### Item 7 — Cross-reference link audit

**Where**: all 21 MDX files in `src/content/`

**Description**: Every tutorial ends with a "相关模块" or "相关文档" section linking to other tutorials via `./slug` format. The Task 22 commit (`350796a`) updated known `./special-input` references to `./lua-extensions`, but:

- There is no automated check that all links resolve
- Some newer tutorials may reference documents that don't exist yet
- Links may point to tutorials with old slugs (e.g. if a concept doc was renamed)

**Suggested fix**: Write a one-off script that parses all `.mdx` files, extracts `./slug` references, and verifies each target file exists. Candidates for CI:

```bash
for f in src/content/*.mdx; do
  grep -oE '\]\(\./([a-z0-9-]+)\)' "$f" | sed 's/.*\.\///;s/)//' | while read slug; do
    test -f "src/content/$slug.mdx" || echo "BROKEN: $f → $slug"
  done
done
```

**Effort**: ~30 minutes to write the script, ~1 hour to fix any broken links found.

---

### Item 8 — Coverage gaps in Lua module UI flows

**Where**: `src/features/editor/modules/lua/*.tsx`

**Description**: None of the 8 new Lua module components have dedicated tests. See [06-testing-coverage.md](./06-testing-coverage.md) for the full gap analysis. High-value gaps:

- End-to-end custom trigger CRUD via the form
- End-to-end Lua script CRUD with template filling
- YAML round-trip: serialize → parse → assert equality
- Orphaned trigger warning rendering when `scriptId` is invalid

**Suggested fix**: A dedicated testing batch. See [06-testing-coverage.md](./06-testing-coverage.md) § "Recommended Follow-up: A Testing Batch" for a prioritized list.

**Effort**: 15-20 tests, ~4-6 hours of focused work.

---

### Item 9 — `CustomTrigger` orphaning when `LuaScript` is deleted

**Where**: `src/stores/config-store.ts` — `deleteLuaScript`

**Description**: When a `LuaScript` is deleted, any `CustomTrigger` that references its `id` via `scriptId` is left in place, with the UI showing "⚠ 未关联脚本" (orphan warning). The store does not cascade-delete, and there is no "cleanup orphans" button.

**Behavior decision needed**: Should deletion cascade? Or should the UI offer a "delete with orphans" confirmation?

**Option A — cascade delete**: When a script is deleted, also delete all triggers referencing it. Pros: clean state. Cons: can lose user work if the deletion was accidental; harder to undo.

**Option B — guard against orphaning**: Block deletion while any trigger references the script. Force the user to unlink first. Pros: prevents accidental data loss. Cons: extra click.

**Option C — leave as-is with clearer UX**: Keep current behavior but add a one-click "unlink and re-bind" UI for orphaned triggers. Pros: user keeps control. Cons: most effort.

**Suggested fix**: Team decision, then one of the above. My weak preference is Option B — block deletion with a clear message — as it matches foreign-key constraint behavior in databases.

**Effort**: ~30 minutes for Option B, ~1 hour for Option C.

---

### Item 10 — Dedicated CodeMirror chunk vs. merged lazy chunk

**Where**: bundle output from `npm run build`

**Description**: The design spec expected CodeMirror to land in a dedicated lazy chunk with a name containing "codemirror" or "lua-editor". In practice, Vite has bundled the 4 CodeMirror dynamic imports into the route-level lazy chunk for the `lua-extensions` module (specifically the `dist-*.js` vendor chunk, which is ~311 KB raw / ~101 KB gzipped).

**Why**: Vite's chunker merges dynamic imports that only have one consumer into the consumer's chunk. Since only `LuaCodeEditor.tsx` imports the CodeMirror packages, and `LuaCodeEditor` is only used inside `LuaExtensions` which is itself route-level lazy-loaded, Vite optimizes by co-locating everything.

**Is this a problem?** Not really. CodeMirror still does not land in the initial bundle (`index-*.js` stays at 113 KB gzipped). Users who never open the Lua Extensions module pay zero CodeMirror cost. The only difference is that a user opening Lua Extensions downloads all 4 CodeMirror packages together rather than one at a time. For most users this is fine since they'll likely end up on Tab 3 eventually.

**Suggested action**: Document the current behavior and leave it. If we want to force a separate chunk for CodeMirror specifically (e.g., to share it across multiple editors later), Vite's `build.rollupOptions.output.manualChunks` can split it:

```ts
manualChunks: {
  codemirror: ['@uiw/react-codemirror', '@codemirror/language', '@codemirror/legacy-modes', '@codemirror/theme-one-dark'],
}
```

**Effort**: 0 if no action. ~30 minutes if splitting is desired.

---

### Item 11 — `SpecialInputConfig.customTriggers` required vs optional

**Where**: `src/types/config.ts`

**Description**: `customTriggers` is declared as a **required** field (non-optional). This causes a breaking change for any code constructing `SpecialInputConfig` literals — see [05-migration-guide.md](./05-migration-guide.md) § 2.

**Alternative**: Make `customTriggers?: CustomTrigger[]` optional and have consumers default to `[]`. The code would still work because the store, parser, and UI all handle missing `customTriggers` gracefully via `?? []`.

**Trade-off**:
- **Required**: safer — every code path that reads `customTriggers` can assume it's an array, no undefined checks needed. Downside: ugly breaking change for in-flight branches.
- **Optional**: backward-compatible, but consumers must remember to `?? []` or crash. The batch had to update zero-or-one construction sites anyway, so the breakage cost is minimal.

**Suggested fix**: Leave as required. The batch fixed all construction sites inside the repo. External consumers (if any) can easily rebase. This is documented in [05-migration-guide.md](./05-migration-guide.md) and no in-repo code is broken.

**Effort**: 0 if leaving. ~15 minutes to flip to optional if the team prefers.

---

### Item 12 — Shortest tutorials

**Where**: `src/content/candidate-settings.mdx` (253 lines), `src/content/double-pinyin-guide.mdx` (256 lines), `src/content/what-is-rime.mdx` (263 lines)

**Description**: Three tutorials are in the 250-260 range — just barely meeting the depth target. They all pass the mechanical checks but have less breathing room for future additions than the average tutorial (~349 lines).

**Suggested fix**: No fix needed. These files are not uniformly "thin" — `candidate-settings.mdx` in particular is terse by design because it covers a narrow surface (just `TranslatorConfig`), and the density is appropriate. If future content needs require expansion, they can grow naturally.

**Effort**: 0 unless the team decides these specific files need more depth.

---

### Item 13 — No content depth CI check

**Where**: no file currently

**Description**: The depth standard is enforced manually via the audit in [03-content-audit.md](./03-content-audit.md). There is no CI check that re-runs the mechanical audit when MDX files change. A future regression (e.g. a tutorial rewrite that drops below the `<Details>` minimum) would only be caught by manual review.

**Suggested fix**: Add a test file at `src/content/content-depth.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const CONTENT_DIR = 'src/content'
const EXEMPT_YAML_PREVIEW: Record<string, true> = {
  'installation.mdx': true,  // install guides don't have schema YAML context
}

describe('content depth standard', () => {
  const mdxFiles = readdirSync(CONTENT_DIR).filter(f => f.endsWith('.mdx'))

  for (const file of mdxFiles) {
    it(`${file} meets the depth standard`, () => {
      const content = readFileSync(join(CONTENT_DIR, file), 'utf-8')
      expect((content.match(/<StepGuide>/g) ?? []).length).toBeGreaterThanOrEqual(1)
      expect((content.match(/<Details/g) ?? []).length).toBeGreaterThanOrEqual(3)
      if (!EXEMPT_YAML_PREVIEW[file]) {
        expect((content.match(/<YamlPreview/g) ?? []).length).toBeGreaterThanOrEqual(1)
      }
      expect((content.match(/:::(tip|note|warning|caution)/g) ?? []).length).toBeGreaterThanOrEqual(2)
    })
  }
})
```

**Effort**: ~15 minutes to write, one commit. Directly prevents depth regressions.

---

### Item 14 — RIME `installation.yaml` / `rime_deployer` CLI details approximated

**Where**: `src/content/first-deploy.mdx`, `src/content/multi-device-sync.mdx`

**Description**: Details about `rime_deployer` CLI flags, `installation.yaml` auto-generation, and user-facing sync files were written based on community conventions and observed behavior, not from the official librime source. Examples:

- `rime_deployer --build <user_dir> <build_dir>` flag order
- Which fields in `installation.yaml` are auto-generated vs. user-managed
- Exact user-dictionary merge algorithm for `.userdb/`

**Suggested fix**: Same as Item 6 — a domain expert review pass. These two files should be reviewed together as part of a "concept doc accuracy" session.

**Effort**: ~1-2 hours of domain-expert review time.

---

## Team Decisions Needed

Gathering the decisions into one list:

1. **Item 5**: Should the `subagent-driven-development` skill's prompt templates include a "verify commit SHA before claiming DONE" step? (Recommended: yes)
2. **Item 9**: When a `LuaScript` is deleted, should referring `CustomTrigger`s be deleted, blocked, or left as orphans? (Recommended: block with a clear message)
3. **Item 11**: Should `SpecialInputConfig.customTriggers` remain required? (Recommended: yes, leave as-is)
4. **Item 13**: Should content depth be a CI-enforced test? (Recommended: yes, trivial to add)
5. **Item 6 + Item 14**: Schedule a RIME-expert review session for accuracy of the 5+ flagged concepts? (Recommended: yes, ~4 hours with a knowledgeable reviewer)

## Related Documents

- [README.md](./README.md) — package index
- [06-testing-coverage.md](./06-testing-coverage.md) — testing gaps (overlaps with Item 8)
- [08-process-retrospective.md](./08-process-retrospective.md) — the Task 25+26 incident in detail (Item 5 reference)
