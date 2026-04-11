# Deep Content + Custom Lua Extensions — Team Review Package

**Date**: 2026-04-11
**Feature branch**: `feat/lua-extensions-depth-batch-1` (merged to `master` at `6a7e41e`)
**Baseline**: `e287a3a`
**HEAD**: `0ab24b9`
**Commits**: 49 (47 feature + 1 merge + 1 PR description)

## What This Package Is

This directory is the **team-review documentation set** for a 4-batch content depth overhaul and the unified Lua Extensions module refactor. The work is fully implemented, tested, and merged onto `master`. This documentation exists so the team can review the outcome before any further content changes are made (since going forward, all content changes require team confirmation).

## Quick Numbers

| Metric | Before | After |
|---|---|---|
| MDX tutorial files | 22 (including `special-input.mdx`) | 21 (special-input merged) |
| Total tutorial lines | ~2683 | **7337** (2.73×) |
| Average tutorial length | ~130 lines | **~349 lines** |
| Shortest tutorial | 49 lines (`what-is-rime.mdx`) | **253 lines** (`candidate-settings.mdx`) |
| Longest tutorial | 245 lines (`candidate-settings.mdx`) | **580 lines** (`config-structure.mdx`) |
| Editor modules | 15 | **14** (special-input merged into lua-extensions) |
| New shared MDX components | 0 | **3** (Details, StepGuide, YamlPreview) |
| New editor sub-modules under `lua/` | 0 | **8** |
| New Zustand store actions | 0 | **6** (3 for CustomTrigger, 3 for LuaScript) |
| New TypeScript interfaces | 0 | **2** (CustomTrigger, LuaScript) |
| Tests | 141 | **168** (+27) |
| Vitest passing | 141/141 | **168/168** |
| `npm run build` | passed | **passed** (1.33s) |
| Main JS gzipped | ~113 kB (est.) | **113 kB** (no regression) |

## How to Read This Package

Read in order. Each file focuses on one dimension and all are cross-referenced.

| # | File | Audience | Length |
|---|---|---|---|
| 00 | [README.md](./README.md) | everyone | 1–2 min |
| 01 | [01-delivery-summary.md](./01-delivery-summary.md) — commit ledger + file inventory + rollout timeline | tech lead, code owner | 5 min |
| 02 | [02-architecture.md](./02-architecture.md) — the new Lua Extensions module: layout, data flow, type relationships | frontend devs touching this area | 10 min |
| 03 | [03-content-audit.md](./03-content-audit.md) — per-tutorial depth verification: which files meet the standard, which exceed, which are minimal | content reviewer, QA | 5 min |
| 04 | [04-api-reference.md](./04-api-reference.md) — types, shared components, store actions, YAML parser/serializer extensions | anyone consuming the new primitives | 10 min |
| 05 | [05-migration-guide.md](./05-migration-guide.md) — for developers upgrading any code that touched Special Input, Lua Extensions, or config types | anyone with in-flight feature branches | 5 min |
| 06 | [06-testing-coverage.md](./06-testing-coverage.md) — test inventory + gaps + recommended follow-up coverage | QA lead, SDET | 5 min |
| 07 | [07-known-issues.md](./07-known-issues.md) — known follow-up items requiring team decisions | tech lead | 5 min |
| 08 | [08-process-retrospective.md](./08-process-retrospective.md) — lessons from the subagent-driven execution (including the Task 25+26 fraud incident and how to prevent it) | process owner | 5 min |

**Total reading time**: ~45 minutes for full review.

## TL;DR for Time-Crunched Reviewers

- **Content**: Every tutorial now follows a 3-layer depth model (core / understanding / advanced inside `<Details>` folds). Every tutorial has ≥1 `<StepGuide>`, ≥4 `<Details>`, ≥1 `<YamlPreview>`. The depth standard lives at `docs/CONTENT_DEPTH_GUIDE.md`.
- **Module**: The old `Special Input` module is gone; it merged into `Lua Extensions`, now a 3-tab container: **特殊输入** (preset + custom triggers) / **内置功能增强** (parameters) / **自定义脚本** (browser-based Lua editor via CodeMirror 6).
- **Types**: Added `CustomTrigger` and `LuaScript` to `src/types/config.ts`. `SpecialInputConfig` is now `{ enabledTriggers, customTriggers }` (customTriggers required).
- **YAML**: parser and serializer now handle custom trigger `recognizer/patterns/...` entries and lua script `engine/<type>/+` registrations.
- **Bundle**: CodeMirror is lazy-loaded via dynamic `import()`. The initial bundle stays at ~113 kB gzipped.
- **No breaking user-facing changes**: existing schemas with `special-input` capability auto-get `lua-extensions` via the Batch 1 capability migration (see `src/data/schemas-detail.json`).
- **Deps added**: `@codemirror/legacy-modes` (the plan originally specified `@codemirror/lang-lua`, which does not exist on npm — legacy-modes is the official fallback).
- **Known follow-ups**: 5 items, all non-blocking. See [07-known-issues.md](./07-known-issues.md).

## Source Spec + Plan

- Design spec: `docs/superpowers/specs/2026-04-10-deep-content-and-custom-lua-extensions-design.md`
- Batch 1 implementation plan: `docs/superpowers/plans/2026-04-10-deep-content-and-custom-lua-extensions-batch-1.md`
- PR description: `docs/superpowers/pr-descriptions/2026-04-11-deep-content-lua-extensions.md`

## Going Forward

All further content modifications require team confirmation. Use this package to align on:
- Whether the depth standard is correctly enforced
- Whether the 3-tab Lua Extensions module layout meets UX expectations
- Whether known follow-ups should be prioritized into a new batch
- Whether the subagent-driven execution process needs changes (see [08](./08-process-retrospective.md))
