# Repo-wide Truth Governance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repair the remaining repo-wide content/product truth issues, demote high-drift signals to clearly marked reference information, and formalize the minimum ongoing truth-governance rules for future edits.

**Architecture:** The implementation is split into focused truth-surface slices: first fix tutorial fact conflicts, then de-risk mobile/platform drift wording, then adjust compare/detail UI surfaces so high-drift metadata is no longer presented like stable fact, and finally codify the minimum truth-governance rules in repo docs. Each slice lands with narrow contract/regression tests before the next one starts.

**Tech Stack:** React 18 + TypeScript + Vite + Vitest + Testing Library + MDX + repo docs under `docs/`

---

## File Map

- `src/content/multi-device-sync.mdx` — built-in sync semantics and Linux/IBus sync guidance.
- `src/content/installation.mdx` — Android/iOS installation wording and high-drift mobile claims.
- `src/content/rime-trust-contract.test.ts` — semantic contract tests for high-risk tutorial truth surfaces.
- `src/features/schema-detail/SchemaHeader.tsx` — top-level schema detail hero, where high-drift community facts should stop looking canonical.
- `src/features/schema-detail/SchemaIntroTab.tsx` — detail-page explanatory note and stat labels for community snapshot data.
- `src/features/compare/SchemaCompare.tsx` — compare-table row labels and reference-info note.
- `src/features/compare/SchemaCompare.test.tsx` — compare truth-surface regression coverage.
- `src/features/schema-detail/__tests__/SchemaDetailPage.test.tsx` — detail-page regression coverage for community snapshot demotion.
- `docs/CONTENT_DEPTH_GUIDE.md` — durable content-authoring rules and truth-surface governance guidance.
- `docs/PRODUCT_CONTRACT.md` — live product-boundary doc that should distinguish formal support from reference information.
- `README.md` — contributor-facing trust-governance pointer for future edits.

---

### Task 1: Fix built-in sync semantics and Linux sync wording in the tutorial

**Files:**
- Modify: `src/content/multi-device-sync.mdx`
- Modify: `src/content/rime-trust-contract.test.ts`

- [ ] **Step 1: Write the failing contract additions**

In `src/content/rime-trust-contract.test.ts`, extend the built-in-sync assertions so they positively require “backup/distribution but no reliable merge” and reject the repo-local `rime_api_console --sync` command as a universal default:

```typescript
it('describes built-in sync as user-dictionary-first plus config backup without safe merge', () => {
  const multi = read('multi-device-sync.mdx')

  expect(multi).toMatch(/用户词典/)
  expect(multi).toMatch(/备份和分发|单向.*备份/)
  expect(multi).toMatch(/没有可靠的冲突合并机制|不做三向合并/)
  expect(multi).not.toMatch(/内置同步不处理这些文件/)
})

it('does not present a repo-local Linux ibus sync command as the default path', () => {
  const multi = read('multi-device-sync.mdx')

  expect(multi).toMatch(/Linux（ibus-rime）/)
  expect(multi).toMatch(/前端.*用户资料同步|以当前前端.*说明为准/)
  expect(multi).not.toMatch(/rime_api_console --sync/)
})
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```bash
npx vitest run src/content/rime-trust-contract.test.ts
```

Expected: FAIL because the current tutorial still contains `rime_api_console --sync` and still says config files are “不处理” in one section.

- [ ] **Step 3: Update the tutorial copy minimally but decisively**

In `src/content/multi-device-sync.mdx`, replace the sync-trigger bullet list and the advanced “配置文件合并” paragraph with the following exact wording:

```mdx
- **macOS**：菜单栏输入法图标 → 「用户资料同步」
- **Windows**：托盘图标右键 → 「用户资料同步」
- **Linux（ibus-rime）**：优先使用前端提供的「用户资料同步」入口；若需要命令行，请以当前前端或发行版说明为准
- **Android Trime**：App 内设置 → 「同步」
```

```mdx
**配置文件合并**

`.custom.yaml` 等配置文件会被带到同步目录用于备份和分发，但它们没有自动冲突合并机制。如果两台设备同时修改了同一字段，最后写入 `sync_dir` 的版本仍可能覆盖另一份快照；因此内置同步不应被当作 Git 式配置协作工具。
```

- [ ] **Step 4: Re-run the focused truth-contract test**

Run:

```bash
npx vitest run src/content/rime-trust-contract.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/content/multi-device-sync.mdx src/content/rime-trust-contract.test.ts
git commit -F - <<'EOF'
Clarify built-in sync as backup-first rather than config merge

The sync tutorial mixed two incompatible messages: one section said
non-generated YAML and txt files are copied for backup/distribution,
while a later paragraph claimed the built-in sync path does not handle
those files at all. This change keeps the user-dictionary-first model,
removes the unsupported ibus sync command, and explains that config
files can be copied into sync_dir without gaining safe merge semantics.

Constraint: Keep the fix inside the sync tutorial and its semantic contract test
Rejected: Document a distro-specific Linux sync CLI path | not sufficiently grounded for a stable public tutorial instruction
Confidence: high
Scope-risk: narrow
Directive: Treat config-file backup and config-file merge as different claims; never collapse them into one sentence again
Tested: npx vitest run src/content/rime-trust-contract.test.ts
Not-tested: Live Linux/ibus-rime sync walkthrough on a real desktop session
EOF
```

---

### Task 2: De-risk high-drift mobile installation claims without losing usefulness

**Files:**
- Modify: `src/content/installation.mdx`
- Modify: `src/content/rime-trust-contract.test.ts`

- [ ] **Step 1: Add a failing mobile-drift contract test**

Append this test to `src/content/rime-trust-contract.test.ts`:

```typescript
it('keeps mobile installation guidance framed as current/common behavior instead of timeless superiority claims', () => {
  const installation = read('installation.mdx')

  expect(installation).not.toMatch(/F-Droid 版本无广告，更新及时/)
  expect(installation).not.toMatch(/目前 iOS 平台上功能最完整的 RIME 实现/)

  expect(installation).toMatch(/常见渠道包括 F-Droid、Google Play 和 GitHub Releases|具体.*以当前.*渠道页面为准/)
  expect(installation).toMatch(/当前 iOS 生态中常见的 Rime 实现之一|常见的 Rime 实现/)
  expect(installation).toMatch(/以当前 App 版本和官方说明为准|以当前 App 文档|以当前 App 内设置为准/)
})
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```bash
npx vitest run src/content/rime-trust-contract.test.ts
```

Expected: FAIL because `installation.mdx` still contains strong time-sensitive phrases such as “更新及时” and “功能最完整”.

- [ ] **Step 3: Rewrite the Android/iOS wording to preserve value but lower certainty**

In `src/content/installation.mdx`, replace the current mobile wording with the following text blocks:

```mdx
- **F-Droid**：搜索「同文输入法」或「Trime」
- **Google Play**：搜索「同文输入法」
- **GitHub**：访问 [osfans/trime Releases](https://github.com/osfans/trime/releases) 直接下载 APK

常见渠道包括 F-Droid、Google Play 和 GitHub Releases；具体可用性、更新节奏与权限要求请以当前渠道页面为准。
```

```mdx
Hamster 是当前 iOS 生态中常见的 Rime 实现之一，方案导入、配置管理与同步能力请以当前 App 版本和官方说明为准。
```

```mdx
:::warning
iOS 键盘扩展在没有「完全访问」权限时，某些依赖系统接口或扩展能力的功能可能受限。具体受影响的范围请以当前 App 版本说明、App 内设置提示和系统权限行为为准。
:::
```

```mdx
- **内置方案**：App 预置了朙月拼音等基础方案，安装即可使用
- **导入自定义方案**：在 App 内通过 iCloud / 本地文件导入方案包（`.zip`）
- **其他同步能力**：若当前版本提供 WebDAV、iCloud 或类似同步入口，请以 App 内设置与官方说明为准
```

- [ ] **Step 4: Re-run the focused truth-contract suite**

Run:

```bash
npx vitest run src/content/rime-trust-contract.test.ts src/content/content-audit.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/content/installation.mdx src/content/rime-trust-contract.test.ts
git commit -F - <<'EOF'
Downgrade mobile install claims to current-version guidance

The installation guide used time-sensitive superiority language for Trime and
Hamster that is hard to keep true over time. This change keeps the same
practical guidance, but reframes mobile channels and app capabilities as
current/common paths whose exact availability depends on the active release
channel and app version.

Constraint: Preserve the installation guide's usefulness while removing high-certainty mobile drift claims
Rejected: Delete the mobile sections entirely | would reduce useful ecosystem coverage more than necessary
Confidence: medium
Scope-risk: narrow
Directive: When describing mobile frontends, prefer “当前常见/以当前版本为准” over comparative superlatives unless an upstream source explicitly guarantees the claim
Tested: npx vitest run src/content/rime-trust-contract.test.ts src/content/content-audit.test.ts
Not-tested: Live Trime/Hamster walkthrough on real devices
EOF
```

---

### Task 3: Demote high-drift community signals in compare/detail UIs and mark them as reference information

**Files:**
- Modify: `src/features/schema-detail/SchemaHeader.tsx`
- Modify: `src/features/schema-detail/SchemaIntroTab.tsx`
- Modify: `src/features/compare/SchemaCompare.tsx`
- Modify: `src/features/compare/SchemaCompare.test.tsx`
- Modify: `src/features/schema-detail/__tests__/SchemaDetailPage.test.tsx`

- [ ] **Step 1: Add failing UI regression expectations**

Update `src/features/compare/SchemaCompare.test.tsx` by extending the row-label test and adding a note assertion:

```typescript
it('labels high-drift community rows as manually maintained reference info', () => {
  renderWithRouter([createMockSchema()])

  expect(screen.getByText('更新活跃度（人工维护）')).toBeInTheDocument()
  expect(screen.getByText('社区规模（人工维护）')).toBeInTheDocument()
  expect(screen.getByText(/社区规模与更新活跃度为人工维护快照信息/)).toBeInTheDocument()
})
```

Update `src/features/schema-detail/__tests__/SchemaDetailPage.test.tsx` with:

```typescript
it('shows a reference-info note for community snapshot fields on the intro tab', () => {
  renderWithRouter('rime_ice')
  expect(screen.getByText(/社区规模与更新频率为人工维护快照信息/)).toBeInTheDocument()
  expect(screen.getByText('更新频率（人工维护）')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run the targeted tests to verify they fail**

Run:

```bash
npx vitest run \
  src/features/compare/SchemaCompare.test.tsx \
  src/features/schema-detail/__tests__/SchemaDetailPage.test.tsx
```

Expected: FAIL because the current UI still renders `更新活跃度`, `社区规模`, and `更新频率` without the new labels/notes.

- [ ] **Step 3: Implement the display-strategy change**

In `src/features/schema-detail/SchemaHeader.tsx`, remove `schema.community.updateFrequency` from the hero subtitle and keep only the stable facts:

```tsx
<p className="mt-1 text-sm text-gray-600">
  by {schema.author} · {schema.compare.dictSize} 词库
</p>
```

In `src/features/schema-detail/SchemaIntroTab.tsx`, add a reference-info note before the stats grid and relabel update frequency:

```tsx
<p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
  社区规模与更新频率为人工维护快照信息，仅作参考；具体以上游 README / GitHub 页面为准。
</p>
<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
  <StatCard label="词库规模" value={compare.dictSize} />
  <StatCard label="智能程度" value={compare.smartLevel} />
  <StatCard label="上手难度" value={compare.difficulty} />
  <StatCard label="更新频率（人工维护）" value={community.updateFrequency} />
</div>
```

In `src/features/compare/SchemaCompare.tsx`, relabel the rows and add a reference note above the table:

```tsx
const COMPARE_ROWS: CompareRow[] = [
  { label: '作者', getValue: (s) => s.author },
  { label: '输入方式', getValue: (s) => s.inputMethod },
  { label: '词库规模', getValue: (s) => s.dictSize },
  { label: '智能程度', getValue: (s) => s.smartLevel },
  { label: '辅助码', getValue: (s) => s.auxiliaryCode },
  { label: '扩展功能', getValue: (s) => s.features },
  { label: 'Rime 生态可用平台', getValue: (s) => s.platforms },
  { label: '上手难度', getValue: (s) => s.difficulty },
  { label: '推荐人群', getValue: (s) => s.recommendation },
  {
    label: '更新活跃度（人工维护）',
    getValue: (s) => {
      const detail = ALL_SCHEMAS.find((d) => d.id === s.id)
      return detail?.community.updateFrequency ?? '未知'
    },
  },
  {
    label: '社区规模（人工维护）',
    getValue: (s) => {
      const detail = ALL_SCHEMAS.find((d) => d.id === s.id)
      return detail?.community.stars ?? 'N/A'
    },
  },
]
```

```tsx
return (
  <div>
    <p className="mb-3 text-xs text-gray-500">
      社区规模与更新活跃度为人工维护快照信息，仅作参考；具体以上游 README / GitHub 页面为准。
    </p>
    <div className="overflow-x-auto">
      {/* existing table */}
    </div>
  </div>
)
```

- [ ] **Step 4: Re-run the targeted UI tests**

Run:

```bash
npx vitest run \
  src/features/compare/SchemaCompare.test.tsx \
  src/features/schema-detail/__tests__/SchemaDetailPage.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add \
  src/features/schema-detail/SchemaHeader.tsx \
  src/features/schema-detail/SchemaIntroTab.tsx \
  src/features/compare/SchemaCompare.tsx \
  src/features/compare/SchemaCompare.test.tsx \
  src/features/schema-detail/__tests__/SchemaDetailPage.test.tsx

git commit -F - <<'EOF'
Demote community stats to clearly marked reference information

Stars and activity cadence are useful to keep around, but they drift too fast
to keep presenting them as stable, front-and-center facts. This change moves
those fields into explicitly marked reference information, relabels the compare
rows, and removes update-frequency from the schema hero so users read it as
manual snapshot data rather than a hard guarantee.

Constraint: Keep the existing schema data model and avoid introducing live-fetch behavior in this pass
Rejected: Delete community fields entirely | throws away useful context instead of making its uncertainty explicit
Confidence: medium
Scope-risk: moderate
Directive: High-drift community signals must be visibly marked as reference information before they appear in user decision surfaces
Tested: npx vitest run src/features/compare/SchemaCompare.test.tsx src/features/schema-detail/__tests__/SchemaDetailPage.test.tsx
Not-tested: Manual UX review of the new note density on compare/detail pages
EOF
```

---

### Task 4: Formalize the minimum truth-governance rules in repo docs

**Files:**
- Modify: `docs/CONTENT_DEPTH_GUIDE.md`
- Modify: `docs/PRODUCT_CONTRACT.md`
- Modify: `README.md`

- [ ] **Step 1: Add failing doc-verification checks**

Run these grep-based checks first and observe they fail before the doc updates land:

```bash
rg -n "Layer A|Layer B|Layer C|高漂移|来源裁决" docs/CONTENT_DEPTH_GUIDE.md
rg -n "参考信息|人工维护|快照信息" docs/PRODUCT_CONTRACT.md
rg -n "真值分层|来源裁决|contract tests" README.md
```

Expected: at least one or more commands return no matches because the current repo docs do not yet formalize the truth-governance rules.

- [ ] **Step 2: Add the minimum governance rules to the content guide and contract docs**

In `docs/CONTENT_DEPTH_GUIDE.md`, append a new section like:

```md
## 真值分层与来源规则

发布前先判断内容属于哪一层：

- **Layer A：稳定事实** — 正式支持边界、canonical repo/issues URL、方案类型、公开教程 slug。必须由 contract tests 强锁。
- **Layer B：半稳定事实** — deploy / sync / installation / custom_phrase / 路径与机制说明。具体方案行为以上游方案 README / 代码为准；通用 Rime 机制以官方 Rime 文档为准；证据不足时必须降级表述。
- **Layer C：高漂移事实** — stars、更新活跃度、最完整/最受欢迎等比较性信息。不得裸露成稳定事实，应下沉展示或加“人工维护/快照信息/以上游 README 为准”等标记。

涉及 deploy、sync、installation、custom_phrase、平台支持、方案对比等高风险 truth surface 的改动，必须同步更新至少一个对应 contract / semantic test。
```

In `docs/PRODUCT_CONTRACT.md`, append a short section:

```md
## 参考信息边界

- 方案页中的社区规模、更新频率、生态可用平台等信息属于人工维护的参考信息，不等同于实时事实或正式支持承诺。
- 这些信息应以下游页面标注、上游 README / 仓库页面与当前前端能力为准；`rime-craft` 的正式承诺范围仍以“正式支持范围”一节为准。
```

In `README.md`, extend the contribution section with:

```md
- 新增涉及 deploy / sync / installation / 平台支持 / 方案对比的内容前，请先按 `docs/CONTENT_DEPTH_GUIDE.md` 中的真值分层与来源裁决规则收敛表述，再补对应 contract tests。
```

- [ ] **Step 3: Re-run the grep checks and verify they now pass**

Run:

```bash
rg -n "Layer A|Layer B|Layer C|高漂移|来源裁决" docs/CONTENT_DEPTH_GUIDE.md
rg -n "参考信息|人工维护|快照信息" docs/PRODUCT_CONTRACT.md
rg -n "真值分层|来源裁决|contract tests" README.md
```

Expected: each command returns at least one match.

- [ ] **Step 4: Commit**

```bash
git add docs/CONTENT_DEPTH_GUIDE.md docs/PRODUCT_CONTRACT.md README.md

git commit -F - <<'EOF'
Document the repo's minimum truth-governance rules

The trust fixes need a durable maintenance rule set, not just one round of
copy changes. This documents the stable / semi-stable / high-drift layering,
records the source-priority rule for future edits, and makes contract-test
updates part of the contribution path for high-risk truth surfaces.

Constraint: Keep the mechanism lightweight and repo-local rather than inventing a full governance framework
Rejected: Hide the rules only inside the spec | future contributors would miss them in everyday editing surfaces
Confidence: high
Scope-risk: narrow
Directive: For future truth-surface edits, classify the claim before editing the wording, then update the matching contract test in the same change
Tested: rg -n "Layer A|Layer B|Layer C|高漂移|来源裁决" docs/CONTENT_DEPTH_GUIDE.md; rg -n "参考信息|人工维护|快照信息" docs/PRODUCT_CONTRACT.md; rg -n "真值分层|来源裁决|contract tests" README.md
Not-tested: Contributor comprehension in a fresh clone
EOF
```

---

### Task 5: Run the integrated truth-governance verification gate

**Files:**
- No planned source changes; use this task to verify the full integrated branch state after Tasks 1–4.

- [ ] **Step 1: Run the focused truth-governance suite**

Run:

```bash
npx vitest run \
  src/content/rime-trust-contract.test.ts \
  src/content/content-audit.test.ts \
  src/data/schema-data.contract.test.ts \
  src/data/tutorial-contract.test.ts \
  src/lib/docs/__tests__/tutorial-helpers.test.ts \
  src/lib/docs/search-index.test.ts \
  src/features/compare/SchemaCompare.test.tsx \
  src/features/schema-detail/__tests__/SchemaDetailPage.test.tsx \
  src/features/editor/modules/SchemaManager.test.tsx \
  src/app/home/HomePage.test.tsx \
  src/features/wizard/steps/PlatformStep.test.tsx
```

Expected: all listed tests pass.

- [ ] **Step 2: Run the repo batch gate**

Run:

```bash
npm test
npx tsc -b
npm run build
```

Expected:
- `npm test` → full suite passes
- `npx tsc -b` → no TypeScript errors
- `npm run build` → production build succeeds

- [ ] **Step 3: Run a focused truth-surface grep audit**

Run:

```bash
rg -n "rime_api_console --sync|最完整|更新及时|无需手动下载配置文件|可以直接通过编辑器添加，无需手动配置文件|ibus-daemon -drx" \
  src/content src/data README.md docs/PRODUCT_CONTRACT.md
```

Expected:
- no `rime_api_console --sync`
- no `最完整` used as a mobile/platform certainty claim in `installation.mdx`
- no `更新及时` channel-quality claim in `installation.mdx`
- no old preset-loading overclaim phrases
- no old universal `ibus-daemon -drx` wording in public tutorials

- [ ] **Step 4: If everything is green, stop; if not, fix the fallout before merging**

If any command above fails:

```bash
# Inspect the failure, make the smallest truthful fix that resolves it,
# rerun the failed command first, then rerun the full gate.
```

If all commands pass, the implementation is ready for final repo-wide review.

---

## Self-Review

- **Spec coverage:**
  - Tutorial fact conflicts / evidence-strength downgrade → Tasks 1 and 2
  - UI/document truth-surface alignment for high-drift community info → Task 3
  - Minimum long-term governance rules → Task 4
  - Integrated regression + repo gate → Task 5

- **Placeholder scan:** No `TODO`, `TBD`, “implement later”, or “handle appropriately” placeholders remain. Every task names exact files, test commands, code/text snippets, and commit messages.

- **Type consistency:** This plan intentionally avoids introducing a new schema data model for source/timeliness metadata in this pass. High-drift demotion is achieved first through UI labels/notes and repo docs, which matches the “minimum long-term mechanism” boundary in the approved spec.
