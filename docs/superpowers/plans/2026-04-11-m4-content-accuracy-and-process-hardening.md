# M4 Content Accuracy And Process Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce the two remaining trust risks after M1-M3: approximate Rime knowledge in the highest-risk tutorials and weak repo-local rules for delegated batch verification.

**Architecture:** Treat this milestone as two focused documentation-and-tooling tracks. Track A is content validation of five tutorials with an explicit review ledger. Track B is repo-local process hardening with one verification helper script and one written batch-acceptance guide. Do not externalize these rules to home-level superpowers yet.

**Tech Stack:** Markdown/MDX, repo-local shell or Node helper scripts, git command verification, existing docs tree.

**Design Spec:** `docs/superpowers/specs/2026-04-11-post-batch-roadmap-design.md`

---

### Task 1: Create a high-risk tutorial review ledger

**Files:**
- Create: `docs/reviews/2026-04-11-rime-content-accuracy-audit.md`

- [ ] **Step 1: Write the review ledger template**

Create `docs/reviews/2026-04-11-rime-content-accuracy-audit.md` with:

```md
# Rime Content Accuracy Audit

## Scope

This review covers the five tutorials that were explicitly flagged as containing approximated or inferred Rime behavior:

- `src/content/config-structure.mdx`
- `src/content/multi-device-sync.mdx`
- `src/content/auxiliary-code-config.mdx`
- `src/content/first-deploy.mdx`
- `src/content/dictionary.mdx`

## Review rubric

For each file, record:

- Claim under review
- Why it is risky
- Validation method (upstream docs / real config / manual Rime knowledge / community source)
- Verdict: keep / soften / correct / remove
- Follow-up edit required?

## Findings

### `config-structure.mdx`
- Claim: `__patch:` 的作用域与 `@before n` / `@after n` 数组操作按文中示例描述工作
- Risk: 语义细节若来自二手资料，容易把“常见实践”写成“固定规则”
- Validation: 对照 upstream / 社区主流实践、真实配置示例和当前教程里的 YAML 片段逐条核对
- Verdict: pending expert review
- Follow-up: 如果无法稳定确认，改写成“常见用法”而不是“固定规则”

### `multi-device-sync.mdx`
- Claim: 用户词典同步后的合并规则可概括为“词条并集 + 最大权重”
- Risk: 词典内部存储与合并行为并非稳定公开规范，写成确定机制风险较高
- Validation: 检查 upstream 文档、可验证的用户行为描述和教程中的对应段落
- Verdict: pending expert review
- Follow-up: 如果缺少稳定依据，改写成“可观察到的常见结果”并去掉算法式断言

### `auxiliary-code-config.mdx`
- Claim: 文中使用的辅助码相关 YAML 字段名与主流方案文件一致
- Risk: 不同方案实现字段名可能不同，教程若写成统一规范会误导用户直接复制
- Validation: 用真实方案文件核对文中字段名与路径
- Verdict: pending expert review
- Follow-up: 若存在方案差异，改成“以该方案为例”并补充差异说明

### `first-deploy.mdx`
- Claim: `rime_deployer --build <user_dir> <build_dir>` 可作为跨前端通用命令形态
- Risk: CLI 形态可能依赖具体前端或包装方式，写成通用契约风险较高
- Validation: 核对 upstream 示例、当前平台实践和文中命令上下文
- Verdict: pending expert review
- Follow-up: 若不能稳定确认，降级为“示例命令”而非“标准命令格式”

### `dictionary.mdx`
- Claim: 自定义短语对应的 translator 注册名可直接概括为 `table_translator@custom_phrase`
- Risk: 不同方案的注册方式可能不同，直接写死容易过度泛化
- Validation: 检查主流方案约定与教程中的上下文是否只适用于特定方案
- Verdict: pending expert review
- Follow-up: 若属于方案约定而非通用规则，正文中必须标明适用范围
```

- [ ] **Step 2: Commit**

```bash
git add docs/reviews/2026-04-11-rime-content-accuracy-audit.md
git commit -m "docs: add review ledger for high-risk Rime tutorial claims"
```

### Task 2: Perform and apply the content review on the five flagged tutorials

**Files:**
- Modify: `src/content/config-structure.mdx`
- Modify: `src/content/multi-device-sync.mdx`
- Modify: `src/content/auxiliary-code-config.mdx`
- Modify: `src/content/first-deploy.mdx`
- Modify: `src/content/dictionary.mdx`
- Modify: `docs/reviews/2026-04-11-rime-content-accuracy-audit.md`

- [ ] **Step 1: Review one file at a time and record the verdict before editing**

For each file, first fill the review ledger section with the exact claim and verdict before changing the MDX.

Example ledger entry:

```md
### `first-deploy.mdx`
- Claim: `rime_deployer --build <user_dir> <build_dir>` is documented as the portable command shape
- Risk: CLI order may vary by frontend wrapper and is not well documented upstream
- Validation: compared against local examples and upstream references; no stable cross-frontend guarantee found
- Verdict: soften
- Follow-up: rewrite the paragraph to frame this as an example invocation rather than the canonical contract
```

- [ ] **Step 2: Apply the matching content edits**

Use these edit rules:

- If a claim is confirmed, keep it but make the evidence basis clearer
- If a claim is plausible but not stable, soften it with wording like `常见做法` / `以该前端为例`
- If a claim is wrong or too specific, replace it with the narrower true statement

Avoid rewriting unrelated sections.

- [ ] **Step 3: Run the content verification stack**

Run:

```bash
npm test -- src/content/content-audit.test.ts
npm run build
```

Expected: PASS. The content still satisfies the structural contract and the docs build still compiles.

- [ ] **Step 4: Commit**

```bash
git add src/content/config-structure.mdx src/content/multi-device-sync.mdx src/content/auxiliary-code-config.mdx src/content/first-deploy.mdx src/content/dictionary.mdx docs/reviews/2026-04-11-rime-content-accuracy-audit.md
git commit -m "docs: review and correct high-risk Rime tutorial claims"
```

### Task 3: Add a repo-local claimed-commit verification helper

**Files:**
- Create: `scripts/verify-claimed-commit.sh`
- Create: `docs/process/agent-batch-acceptance.md`

- [ ] **Step 1: Write the verification helper**

Create `scripts/verify-claimed-commit.sh` with:

```bash
#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "usage: $0 <sha> [expected-subject-fragment]" >&2
  exit 1
fi

sha="$1"
expected="${2:-}"

git cat-file -e "${sha}^{commit}" 2>/dev/null
subject="$(git log --format=%s -1 "$sha")"

echo "sha=$sha"
echo "subject=$subject"

if [ -n "$expected" ] && [[ "$subject" != *"$expected"* ]]; then
  echo "expected subject fragment not found: $expected" >&2
  exit 1
fi
```

- [ ] **Step 2: Make the script executable and smoke-test it**

Run:

```bash
chmod +x scripts/verify-claimed-commit.sh
./scripts/verify-claimed-commit.sh HEAD
```

Expected: prints the current commit SHA and subject.

- [ ] **Step 3: Document the repo-local batch acceptance rules**

Create `docs/process/agent-batch-acceptance.md` with:

```md
# Agent Batch Acceptance Rules

## Required checks before accepting a delegated task report

1. Verify every claimed commit SHA:
   ```bash
   ./scripts/verify-claimed-commit.sh <sha> "<expected subject fragment>"
   ```
2. Re-run the relevant test command
3. At batch boundaries, run:
   ```bash
   npm test
   npx tsc -b
   npm run build
   ```
4. Treat `DONE_WITH_CONCERNS` as "requires explicit review", not "almost done"
5. Record any scope creep or bundled fixes in the batch notes
```

- [ ] **Step 4: Commit**

```bash
git add scripts/verify-claimed-commit.sh docs/process/agent-batch-acceptance.md
git commit -m "docs: add repo-local delegated batch acceptance rules"
```

### Task 4: Thread the process rules into repo guidance and verify the milestone

**Files:**
- Modify: `AGENTS.md`
- Modify: `docs/superpowers/plans/2026-04-11-post-batch-roadmap-index.md`

- [ ] **Step 1: Update repo guidance with the batch acceptance rule**

In `AGENTS.md`, add a short repo-local rule under the verification / delegation section:

```md
- When delegated work reports a commit SHA, verify it against git before accepting completion.
- At batch boundaries, use `npm test`, `npx tsc -b`, and `npm run build`; `tsc --noEmit` alone is not sufficient.
- Treat `DONE_WITH_CONCERNS` as a mandatory review state.
```

- [ ] **Step 2: Link the rule from the roadmap index**

Append to `docs/superpowers/plans/2026-04-11-post-batch-roadmap-index.md`:

```md
Repo-local process hardening output:
- `docs/process/agent-batch-acceptance.md`
- `scripts/verify-claimed-commit.sh`
```

- [ ] **Step 3: Run the final milestone verification**

Run:

```bash
npm test
npx tsc -b
npm run build
./scripts/verify-claimed-commit.sh HEAD
```

Expected: all commands pass.

- [ ] **Step 4: Commit**

```bash
git add AGENTS.md docs/superpowers/plans/2026-04-11-post-batch-roadmap-index.md
git commit -m "docs: wire repo-local process hardening into workspace guidance"
```
