# Public Trust Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the review blockers that can mislead users: unreachable tutorials, preset-loading copy that overclaims installation ability, inaccurate Rime sync/deploy examples, stale schema metadata, and missing open-source repo entry docs.

**Architecture:** Keep the existing product structure and repair the public truth surfaces in place. Favor narrow data/content fixes plus contract tests that pin the exact failure modes found in review, instead of introducing a new content system or a large refactor.

**Tech Stack:** React 18 + TypeScript + Vite + Vitest + Testing Library + MDX

---

## File Map

- `src/data/tutorial-nav.ts` — public docs navigation, canonical tutorial slugs, legacy alias resolution.
- `src/data/tutorial-loaders.ts` — lazy MDX loader map for every public tutorial page.
- `src/app/docs/DocsPage.tsx` — docs route resolution, legacy slug redirect, content loading.
- `src/lib/docs/tutorial-helpers.ts` / `src/lib/docs/search-index.ts` — derived docs navigation/search behavior.
- `src/data/tutorial-contract.test.ts` — contract tests tying together content files, docs nav, loaders, and editor tutorial links.
- `src/features/schema-detail/SchemaHeader.tsx` — schema detail CTA copy.
- `src/features/compare/SchemaCompare.tsx` — compare table CTA copy.
- `src/features/editor/modules/SchemaManager.tsx` — editor-side explanation of what “adding a schema” really does.
- `src/content/what-is-rime.mdx` / `schema-manager.mdx` / `dictionary.mdx` / `multi-device-sync.mdx` / `first-deploy.mdx` — public tutorial truth surfaces that currently overclaim or contain risky examples.
- `src/content/rime-trust-contract.test.ts` — content-level regression tests for the exact review findings.
- `src/data/schemas-detail.json` — schema detail and compare metadata shown to users.
- `src/data/schema-data.contract.test.ts` — static contracts for canonical schema repo URLs and type labels.
- `README.md` / `LICENSE` / `package.json` — repository entry surface and package metadata.

---

### Task 1: Restore public tutorial reachability and slug contracts

**Files:**
- Modify: `src/data/tutorial-nav.ts`
- Modify: `src/data/tutorial-loaders.ts`
- Modify: `src/app/docs/DocsPage.tsx`
- Modify: `src/lib/docs/__tests__/tutorial-helpers.test.ts`
- Modify: `src/lib/docs/search-index.test.ts`
- Create: `src/data/tutorial-contract.test.ts`

- [ ] **Step 1: Write the failing tutorial contract tests**

Create `src/data/tutorial-contract.test.ts` with:

```typescript
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { MODULE_REGISTRY } from './module-registry'
import { MDX_LOADERS } from './tutorial-loaders'
import { findTutorialBySlug, resolveTutorialSlug, TUTORIAL_NAV } from './tutorial-nav'

const contentDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../content',
)

const contentSlugs = fs.readdirSync(contentDir)
  .filter((file) => file.endsWith('.mdx'))
  .map((file) => file.replace(/\.mdx$/, ''))

const navSlugs = TUTORIAL_NAV.flatMap((section) =>
  section.items.map((item) => item.slug),
)

const moduleSlugs = MODULE_REGISTRY.flatMap((module) =>
  module.tutorialSlug ? [module.tutorialSlug] : [],
)

describe('tutorial contracts', () => {
  it('publishes every module tutorial slug in docs routing', () => {
    for (const slug of moduleSlugs) {
      expect(findTutorialBySlug(slug), slug).toBeDefined()
      expect(MDX_LOADERS[slug], slug).toBeTypeOf('function')
    }
  })

  it('keeps every public content file routable', () => {
    for (const slug of contentSlugs) {
      expect(findTutorialBySlug(slug), slug).toBeDefined()
      expect(MDX_LOADERS[slug], slug).toBeTypeOf('function')
    }
  })

  it('keeps the legacy auxiliary-code slug redirectable', () => {
    expect(resolveTutorialSlug('auxiliary-code')).toBe('auxiliary-code-config')
    expect(findTutorialBySlug('auxiliary-code')?.slug).toBe('auxiliary-code-config')
  })

  it('includes the restored advanced tutorials in public navigation', () => {
    expect(navSlugs).toEqual(expect.arrayContaining([
      'spelling-scheme',
      'auxiliary-code-config',
      'reverse-lookup',
      'candidate-display',
      'comment-hints',
    ]))
  })
})
```

Update `src/lib/docs/__tests__/tutorial-helpers.test.ts` so the first test expects the restored public tutorial count and slugs:

```typescript
it('returns all public items with section titles', () => {
  const flat = flattenNav()
  expect(flat).toHaveLength(21)
  expect(flat[0]).toEqual({
    slug: 'what-is-rime',
    title: 'Rime 是什么',
    sectionTitle: '入门指南',
  })
  expect(flat.map((item) => item.slug)).toEqual(expect.arrayContaining([
    'spelling-scheme',
    'auxiliary-code-config',
    'reverse-lookup',
    'candidate-display',
    'comment-hints',
  ]))
})
```

Update `src/lib/docs/search-index.test.ts` with one restored-tutorial assertion:

```typescript
it('returns matching results for restored advanced tutorials', () => {
  const results = searchDocs('反查')
  expect(results.map((result) => result.slug)).toContain('reverse-lookup')
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npx vitest run \
  src/data/tutorial-contract.test.ts \
  src/lib/docs/__tests__/tutorial-helpers.test.ts \
  src/lib/docs/search-index.test.ts
```

Expected: FAIL — the new contract test cannot resolve `spelling-scheme`, `reverse-lookup`, `candidate-display`, `comment-hints`, and `auxiliary-code-config`; the helper count assertion still sees only 17 public tutorials.

- [ ] **Step 3: Implement the reachability fix**

In `src/data/tutorial-nav.ts`, change the type and navigation data to support restored slugs and one legacy alias:

```typescript
export interface TutorialItem {
  slug: string;
  title: string;
  aliases?: string[];
}

export const TUTORIAL_NAV: TutorialSection[] = [
  {
    title: '入门指南',
    items: [
      { slug: 'what-is-rime', title: 'Rime 是什么' },
      { slug: 'installation', title: '安装教程' },
      { slug: 'first-deploy', title: '第一次部署' },
      { slug: 'config-structure', title: '配置文件结构' },
    ],
  },
  {
    title: '配置详解',
    items: [
      { slug: 'schema-manager', title: '输入方案管理' },
      { slug: 'candidate-settings', title: '候选词设置' },
      { slug: 'candidate-display', title: '候选词显示' },
      { slug: 'key-bindings', title: '按键绑定' },
      { slug: 'fuzzy-pinyin', title: '模糊音配置' },
      { slug: 'spelling-scheme', title: '拼写方案' },
      { slug: 'ascii-mode', title: '中英文切换' },
      { slug: 'punctuation', title: '标点符号映射' },
      { slug: 'dictionary', title: '自定义词库' },
      { slug: 'switches', title: '开关与杂项' },
    ],
  },
  {
    title: '进阶技巧',
    items: [
      { slug: 'double-pinyin-guide', title: '双拼方案指南' },
      { slug: 'auxiliary-code-config', title: '辅助码详解', aliases: ['auxiliary-code'] },
      { slug: 'reverse-lookup', title: '反查与筛选' },
      { slug: 'comment-hints', title: '候选词注释与提示' },
      { slug: 'custom-dictionary', title: '词库制作与维护' },
      { slug: 'lua-extensions', title: 'Lua 扩展' },
      { slug: 'multi-device-sync', title: '多设备同步' },
    ],
  },
]

function matchesTutorialSlug(item: TutorialItem, slug: string): boolean {
  return item.slug === slug || item.aliases?.includes(slug) === true
}

export function findTutorialBySlug(slug: string): TutorialItem | undefined {
  for (const section of TUTORIAL_NAV) {
    const item = section.items.find((candidate) => matchesTutorialSlug(candidate, slug))
    if (item) return item
  }
  return undefined
}

export function resolveTutorialSlug(slug: string): string | undefined {
  return findTutorialBySlug(slug)?.slug
}
```

In `src/data/tutorial-loaders.ts`, replace the loader map with the full public set plus the legacy alias:

```typescript
import type { ComponentType } from 'react'

export const MDX_LOADERS: Record<string, () => Promise<{ default: ComponentType }>> = {
  'what-is-rime': () => import('@/content/what-is-rime.mdx'),
  'installation': () => import('@/content/installation.mdx'),
  'first-deploy': () => import('@/content/first-deploy.mdx'),
  'config-structure': () => import('@/content/config-structure.mdx'),
  'schema-manager': () => import('@/content/schema-manager.mdx'),
  'candidate-settings': () => import('@/content/candidate-settings.mdx'),
  'candidate-display': () => import('@/content/candidate-display.mdx'),
  'key-bindings': () => import('@/content/key-bindings.mdx'),
  'fuzzy-pinyin': () => import('@/content/fuzzy-pinyin.mdx'),
  'spelling-scheme': () => import('@/content/spelling-scheme.mdx'),
  'ascii-mode': () => import('@/content/ascii-mode.mdx'),
  'punctuation': () => import('@/content/punctuation.mdx'),
  'dictionary': () => import('@/content/dictionary.mdx'),
  'switches': () => import('@/content/switches.mdx'),
  'double-pinyin-guide': () => import('@/content/double-pinyin-guide.mdx'),
  'auxiliary-code-config': () => import('@/content/auxiliary-code-config.mdx'),
  'auxiliary-code': () => import('@/content/auxiliary-code-config.mdx'),
  'reverse-lookup': () => import('@/content/reverse-lookup.mdx'),
  'comment-hints': () => import('@/content/comment-hints.mdx'),
  'custom-dictionary': () => import('@/content/custom-dictionary.mdx'),
  'lua-extensions': () => import('@/content/lua-extensions.mdx'),
  'multi-device-sync': () => import('@/content/multi-device-sync.mdx'),
}
```

In `src/app/docs/DocsPage.tsx`, remove the local `MDX_MODULES` constant and resolve legacy slugs before loading:

```typescript
import { useParams, Navigate } from 'react-router-dom'
import { useState, useEffect, type ComponentType } from 'react'
import { MDXProvider } from '@mdx-js/react'
import { mdxComponents } from '@/components/shared/mdx-components'
import { findTutorialBySlug, resolveTutorialSlug } from '@/data/tutorial-nav'
import { MDX_LOADERS } from '@/data/tutorial-loaders'
import { DocsBreadcrumb } from './DocsBreadcrumb'
import { DocsPagination } from './DocsPagination'

export function DocsPage() {
  const { slug } = useParams()
  const [Content, setContent] = useState<ComponentType | null>(null)
  const [loading, setLoading] = useState(true)

  const resolvedSlug = slug ? resolveTutorialSlug(slug) : undefined
  const item = resolvedSlug ? findTutorialBySlug(resolvedSlug) : undefined

  useEffect(() => {
    if (!resolvedSlug || !MDX_LOADERS[resolvedSlug]) {
      setLoading(false)
      return
    }

    setLoading(true)
    setContent(null)
    MDX_LOADERS[resolvedSlug]!()
      .then((mod) => {
        setContent(() => mod.default)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [resolvedSlug])

  if (!slug) {
    return <Navigate to="/docs/what-is-rime" replace />
  }

  if (resolvedSlug && resolvedSlug !== slug) {
    return <Navigate to={`/docs/${resolvedSlug}`} replace />
  }

  if (!item || !resolvedSlug) {
    return <p className="text-gray-500 dark:text-slate-400">页面不存在。</p>
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-4 w-32 rounded bg-gray-200 dark:bg-slate-700" />
        <div className="h-8 w-64 rounded bg-gray-200 dark:bg-slate-700" />
        <div className="h-4 w-full rounded bg-gray-100 dark:bg-slate-800" />
        <div className="h-4 w-3/4 rounded bg-gray-100 dark:bg-slate-800" />
      </div>
    )
  }

  if (!Content) {
    return <p className="text-gray-500 dark:text-slate-400">内容暂未编写。</p>
  }

  return (
    <>
      <DocsBreadcrumb slug={resolvedSlug} pageTitle={item.title} />
      <div data-docs-content>
        <MDXProvider components={mdxComponents}>
          <Content />
        </MDXProvider>
      </div>
      <DocsPagination slug={resolvedSlug} />
    </>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:

```bash
npx vitest run \
  src/data/tutorial-contract.test.ts \
  src/lib/docs/__tests__/tutorial-helpers.test.ts \
  src/lib/docs/search-index.test.ts \
  src/content/content-audit.test.ts
```

Expected: ALL PASS — every public MDX page is routable, module help links resolve, and the restored advanced tutorials appear in public navigation/search.

- [ ] **Step 5: Commit**

```bash
git add \
  src/data/tutorial-nav.ts \
  src/data/tutorial-loaders.ts \
  src/app/docs/DocsPage.tsx \
  src/lib/docs/__tests__/tutorial-helpers.test.ts \
  src/lib/docs/search-index.test.ts \
  src/data/tutorial-contract.test.ts

git commit -F - <<'EOF'
Restore missing public tutorials and guard docs reachability

The docs center, editor help links, and tutorial search drifted apart.
This change restores the missing public tutorial routes, keeps the old
auxiliary-code slug redirectable, and adds contract tests so future
content cannot become unreachable without a failing test.

Constraint: Keep existing MDX filenames and preserve legacy /docs/auxiliary-code links
Rejected: Introduce a brand-new content CMS layer | too much churn for a trust-fix pass
Confidence: high
Scope-risk: moderate
Reversibility: clean
Directive: Any new tutorial must update nav and loader coverage under the tutorial contract tests before merge
Tested: npx vitest run src/data/tutorial-contract.test.ts src/lib/docs/__tests__/tutorial-helpers.test.ts src/lib/docs/search-index.test.ts src/content/content-audit.test.ts
Not-tested: Manual browser-click verification across every docs page
EOF
```

---

### Task 2: Make UI copy truthful about preset loading vs real schema installation

**Files:**
- Modify: `src/features/schema-detail/SchemaHeader.tsx`
- Modify: `src/features/compare/SchemaCompare.tsx`
- Modify: `src/features/editor/modules/SchemaManager.tsx`
- Modify: `src/features/schema-detail/__tests__/SchemaDetailPage.test.tsx`
- Modify: `src/features/compare/SchemaCompare.test.tsx`

- [ ] **Step 1: Write the failing UI copy tests**

Add to `src/features/schema-detail/__tests__/SchemaDetailPage.test.tsx`:

```typescript
it('uses preset-loading copy in the schema detail CTA', () => {
  renderWithRouter('rime_ice')
  expect(screen.getByRole('button', { name: '载入该方案预设' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: '使用此方案' })).not.toBeInTheDocument()
})
```

Add to `src/features/compare/SchemaCompare.test.tsx`:

```typescript
it('uses preset-loading copy instead of installation copy', () => {
  renderWithRouter([createMockSchema({ id: 'wanxiang', name: '万象拼音', presetId: 'wanxiang' })])
  expect(screen.getByRole('button', { name: '载入预设配置' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: '使用这个方案' })).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npx vitest run \
  src/features/schema-detail/__tests__/SchemaDetailPage.test.tsx \
  src/features/compare/SchemaCompare.test.tsx
```

Expected: FAIL — both components still render the old “使用此方案 / 使用这个方案” wording.

- [ ] **Step 3: Implement the copy correction**

In `src/features/schema-detail/SchemaHeader.tsx`, change the CTA label:

```tsx
<Button size="sm" onClick={handleUseSchema}>载入该方案预设</Button>
```

In `src/features/compare/SchemaCompare.tsx`, change the compare-page CTA label:

```tsx
<Button size="sm" onClick={() => handleUseSchema(s)}>载入预设配置</Button>
```

In `src/features/editor/modules/SchemaManager.tsx`, replace the description paragraph with an explicit scope note:

```tsx
<p className="mt-1 text-sm text-gray-500">
  管理已启用的输入方案及其优先顺序。列表中排在前面的方案为默认方案。这里写出的只是
  `schema_list` 与相关补丁；目标设备仍需先安装对应的 `.schema.yaml` / `.dict.yaml`
  方案文件，Rime 才能真正使用该方案。
</p>
```

- [ ] **Step 4: Run tests to verify they pass**

Run:

```bash
npx vitest run \
  src/features/schema-detail/__tests__/SchemaDetailPage.test.tsx \
  src/features/compare/SchemaCompare.test.tsx
```

Expected: ALL PASS — UI copy no longer implies that the app can install upstream schema packages by itself.

- [ ] **Step 5: Commit**

```bash
git add \
  src/features/schema-detail/SchemaHeader.tsx \
  src/features/compare/SchemaCompare.tsx \
  src/features/editor/modules/SchemaManager.tsx \
  src/features/schema-detail/__tests__/SchemaDetailPage.test.tsx \
  src/features/compare/SchemaCompare.test.tsx

git commit -F - <<'EOF'
Stop implying that preset loading installs upstream schemas

The compare page, schema detail page, and editor sidebar currently say
“use this schema” in a way that overclaims the product’s real ability.
This change rewrites the public CTAs to describe what the code actually
does: load preset config state, not fetch or install upstream schema packages.

Constraint: Keep the underlying preset-loading behavior unchanged in this pass
Rejected: Build a schema package installer now | separate capability with licensing, source, and platform-handling work
Confidence: high
Scope-risk: narrow
Reversibility: clean
Directive: Do not use “安装方案” copy unless the product truly downloads and places upstream schema files
Tested: npx vitest run src/features/schema-detail/__tests__/SchemaDetailPage.test.tsx src/features/compare/SchemaCompare.test.tsx
Not-tested: Manual visual review of the editor sidebar copy
EOF
```

---

### Task 3: Correct the risky Rime tutorial claims and lock them with content contracts

**Files:**
- Modify: `src/content/what-is-rime.mdx`
- Modify: `src/content/schema-manager.mdx`
- Modify: `src/content/dictionary.mdx`
- Modify: `src/content/multi-device-sync.mdx`
- Modify: `src/content/first-deploy.mdx`
- Create: `src/content/rime-trust-contract.test.ts`

- [ ] **Step 1: Write the failing content contract test**

Create `src/content/rime-trust-contract.test.ts`:

```typescript
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const contentDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)))
const read = (fileName: string) =>
  fs.readFileSync(path.join(contentDir, fileName), 'utf8')

describe('public trust content contract', () => {
  it('keeps installation.yaml sync examples out of patch syntax', () => {
    const dictionary = read('dictionary.mdx')
    expect(dictionary).not.toMatch(/patch:\s+installation_id:/)
    expect(dictionary).toMatch(/installation\.yaml/)
  })

  it('describes preset loading honestly instead of claiming schema installation', () => {
    expect(read('what-is-rime.mdx')).not.toMatch(/无需手动下载配置文件/)
    expect(read('schema-manager.mdx')).not.toMatch(/可以直接通过编辑器添加，无需手动配置文件/)
    expect(read('schema-manager.mdx')).toMatch(/前提是目标设备已安装相应方案文件/)
  })

  it('treats Linux deploy commands as environment-specific fallback, not the universal default', () => {
    const firstDeploy = read('first-deploy.mdx')
    expect(firstDeploy).toMatch(/优先使用前端自身提供的[「“]重新部署[」”]入口/)
    expect(firstDeploy).toMatch(/旧版本|老版本/)
  })

  it('explains built-in sync as user-dictionary-first and config-file-no-merge', () => {
    const multi = read('multi-device-sync.mdx')
    expect(multi).toMatch(/用户词典/)
    expect(multi).toMatch(/没有可靠的冲突合并机制|不做三向合并/)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npx vitest run src/content/rime-trust-contract.test.ts
```

Expected: FAIL — the current content still contains the bad `patch:` sync example, still overclaims preset installation, and still presents Linux deploy commands as if they were the default universal path.

- [ ] **Step 3: Rewrite the risky tutorial snippets**

In `src/content/what-is-rime.mdx`, replace the closing sentence in the “流行方案生态” section with:

```mdx
在 rime-craft 编辑器中，可以通过「输入方案管理」模块浏览方案资料并载入这些方案对应的预设配置；若要在真实 Rime 环境中使用，仍需先把对应方案文件安装到用户目录，再执行重新部署。
```

In `src/content/schema-manager.mdx`, replace the “rime-craft 预设方案” opening sentence with:

```mdx
以下方案目前提供可直接载入的预设配置模板，用于帮助你快速生成 `schema_list` 与相关补丁；前提是目标设备已经安装了这些方案对应的 `.schema.yaml` / `.dict.yaml` 文件。
```

Also replace the “添加社区方案” paragraph with:

```mdx
在 rime-craft 中，选择「浏览所有方案」可以查看方案资料并载入预设配置；这一步不会替代上游方案包安装。如果目标设备还没有相应的方案文件，仍需先按照该方案自己的文档，通过 plum、Git 拉取或手动复制等方式把文件放入 Rime 用户目录。
```

In `src/content/dictionary.mdx`, replace the broken sync example block with top-level `installation.yaml` examples:

```mdx
```yaml
# installation.yaml（设备 A / macOS）
installation_id: "macbook-2024"
sync_dir: "/Users/yourname/Dropbox/RimeSync"

# installation.yaml（设备 B / Windows）
installation_id: "desktop-2024"
sync_dir: "C:\\Users\\yourname\\Dropbox\\RimeSync"
```
```

Add one sentence immediately under that block:

```mdx
这段配置写在独立的 `installation.yaml` 中，不使用 `.custom.yaml` 的 `patch:` 语法。
```

In `src/content/multi-device-sync.mdx`, replace the narrow “不在内置同步范围内” tip with:

```mdx
Rime 内置同步的核心价值是**用户词典快照的导出与回收合并**。非自动生成的 YAML / `.txt` 文件也会被带到同步目录用于备份和分发，但它们没有可靠的冲突合并机制；如果多台设备同时改了同一个配置文件，内置同步不会帮你做 Git 那样的三向合并。
```

In `src/content/first-deploy.mdx`, replace the Linux section opening with a safer wording and demote shell commands to fallback examples:

```mdx
Linux 平台优先使用前端自身提供的「重新部署 / Deploy」入口。不同发行版和输入法框架暴露的 CLI 形式并不完全一致，因此命令行更适合作为环境相关补充方案，而不是统一的跨前端默认步骤。
```

Then adjust the IBus subsection so the old daemon command is clearly marked as legacy:

```mdx
如果你使用的是较新的 ibus-rime，优先在前端菜单或设置界面中点击「Deploy / 重新部署」。只有旧版本或发行版包装不完整时，才把 `ibus-daemon -drx` 视为兼容性 workaround，而不是现代默认路径。
```

- [ ] **Step 4: Run tests to verify they pass**

Run:

```bash
npx vitest run src/content/rime-trust-contract.test.ts src/content/content-audit.test.ts
```

Expected: ALL PASS — the copied examples are now safe to follow, and the reviewed truth claims stay pinned in tests.

- [ ] **Step 5: Commit**

```bash
git add \
  src/content/what-is-rime.mdx \
  src/content/schema-manager.mdx \
  src/content/dictionary.mdx \
  src/content/multi-device-sync.mdx \
  src/content/first-deploy.mdx \
  src/content/rime-trust-contract.test.ts

git commit -F - <<'EOF'
Correct risky Rime tutorial claims and examples

The current tutorial set contains a few copy-and-paste hazards: an
installation.yaml example written as patch syntax, preset copy that sounds
like schema installation, and Linux deploy guidance that treats legacy shell
workarounds as if they were the universal default. This pass rewrites those
sections to match the actual product boundary and the public Rime guidance.

Constraint: Keep the tutorials broad and beginner-friendly while removing unsafe certainty
Rejected: Rewrite the entire tutorial set now | too much churn for the current trust-fix pass
Confidence: medium
Scope-risk: moderate
Reversibility: clean
Directive: Treat deploy, sync, installation.yaml, and preset-loading claims as fact-checked surfaces; do not widen them without upstream verification
Tested: npx vitest run src/content/rime-trust-contract.test.ts src/content/content-audit.test.ts
Not-tested: Manual review by a Linux Rime user on a live machine
EOF
```

---

### Task 4: Repair schema metadata, canonical links, and type labels

**Files:**
- Modify: `src/data/schemas-detail.json`
- Create: `src/data/schema-data.contract.test.ts`
- Modify: `src/features/schema-detail/__tests__/SchemaDetailPage.test.tsx`

- [ ] **Step 1: Write the failing schema data contracts**

Create `src/data/schema-data.contract.test.ts` with:

```typescript
import { describe, expect, it } from 'vitest'
import { getSchemaById } from './schema-data'

function mustGetSchema(id: string) {
  const schema = getSchemaById(id)
  expect(schema, id).toBeDefined()
  return schema!
}

describe('schema detail data contract', () => {
  it('uses the canonical wanxiang repository URL', () => {
    expect(mustGetSchema('wanxiang').links.repository).toBe('https://github.com/amzxyz/rime_wanxiang')
    expect(mustGetSchema('wanxiang_pro').links.repository).toBe('https://github.com/amzxyz/rime_wanxiang')
  })

  it('labels wanxiang pro as double-pinyin only', () => {
    expect(mustGetSchema('wanxiang_pro').type).toBe('double_pinyin')
  })

  it('does not point rime-ice community links to the missing discussions page', () => {
    const urls = mustGetSchema('rime_ice').links.community.map((link) => link.url)
    expect(urls).not.toContain('https://github.com/iDvel/rime-ice/discussions')
  })
})
```

Add to `src/features/schema-detail/__tests__/SchemaDetailPage.test.tsx`:

```typescript
it('shows wanxiang pro as a double-pinyin schema', () => {
  renderWithRouter('wanxiang_pro')
  expect(screen.getByText('双拼')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npx vitest run \
  src/data/schema-data.contract.test.ts \
  src/features/schema-detail/__tests__/SchemaDetailPage.test.tsx
```

Expected: FAIL — the current JSON still points wanxiang/wanxiang_pro at the 404 `rime-wanxiang-pinyin` URL, and `wanxiang_pro` is still typed as `full_pinyin`.

- [ ] **Step 3: Fix the metadata in `schemas-detail.json`**

Update the `wanxiang` and `wanxiang_pro` entries in `src/data/schemas-detail.json` so every repository / issue / learning-resource URL uses the canonical repo:

```json
"repository": "https://github.com/amzxyz/rime_wanxiang"
```

```json
"url": "https://github.com/amzxyz/rime_wanxiang/issues"
```

```json
"url": "https://github.com/amzxyz/rime_wanxiang"
```

Change the `wanxiang_pro` type field to:

```json
"type": "double_pinyin"
```

Replace the `rime_ice` community link with a live page:

```json
{
  "label": "GitHub Issues",
  "url": "https://github.com/iDvel/rime-ice/issues"
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:

```bash
npx vitest run \
  src/data/schema-data.contract.test.ts \
  src/features/schema-detail/__tests__/SchemaDetailPage.test.tsx \
  src/features/compare/SchemaCompare.test.tsx
```

Expected: ALL PASS — schema detail badges and compare data now reflect the corrected canonical metadata.

- [ ] **Step 5: Commit**

```bash
git add \
  src/data/schemas-detail.json \
  src/data/schema-data.contract.test.ts \
  src/features/schema-detail/__tests__/SchemaDetailPage.test.tsx

git commit -F - <<'EOF'
Repair canonical schema metadata and public links

The schema detail dataset currently sends users to dead links and labels
wanxiang pro with the wrong input-method type. This change points wanxiang
and wanxiang pro at the real upstream repository, replaces a dead rime-ice
community link, and adds static contracts so those public facts cannot drift
again without a failing test.

Constraint: Keep the schema detail feature data-driven from schemas-detail.json
Rejected: Add network-based link checks to the default test suite | too flaky for the normal CI path
Confidence: high
Scope-risk: narrow
Reversibility: clean
Directive: Treat schema repo URLs and type labels as user-facing facts; update them together with their contract tests
Tested: npx vitest run src/data/schema-data.contract.test.ts src/features/schema-detail/__tests__/SchemaDetailPage.test.tsx src/features/compare/SchemaCompare.test.tsx
Not-tested: Live browser-click verification for every external link card
EOF
```

---

### Task 5: Add the missing open-source repository entry surface

**Files:**
- Create: `README.md`
- Create: `LICENSE`
- Modify: `package.json`

- [ ] **Step 1: Write the repository entry docs**

Create `README.md` with this structure and opening content:

```markdown
# Rime Craft

Rime Craft 是一个面向 Rime 的可视化配置编辑器与教程站。项目当前**正式支持 macOS / Windows 的导入导出**，并继续提供覆盖 Linux / Android / iOS 的 Rime 生态知识内容。

## 项目边界

- 正式支持：macOS / Windows 导入导出与相关平台文件处理
- 教程覆盖：Linux、Android、iOS 等 Rime 生态可用平台的安装、同步、方案知识
- 当前不承担：自动下载或安装上游 schema / dict 方案包
- 当前不保证：注释保真 round-trip、自动本地保存、所有平台导入导出完全等价

## 本地开发

```bash
npm install
npm test
npx tsc -b
npm run build
npm run dev
```

## 与 Rime / 上游方案的关系

- 本项目不是 Rime 官方项目
- 本项目不会替代上游方案安装流程
- 使用雾凇拼音、万象拼音等方案前，仍需按各自官方文档把方案文件安装到 Rime 用户目录

## 贡献建议

- 事实性教程改动请优先附上官方或上游仓库依据
- 涉及 deploy / sync / installation.yaml / custom_phrase 的改动，请同步更新对应内容合同测试
```
```

Create `LICENSE` with the standard ISC text matching the current package license:

```text
ISC License

Copyright (c) 2026

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
```

- [ ] **Step 2: Update package metadata to stop shipping an empty description**

In `package.json`, replace the empty description with:

```json
"description": "Rime 输入法可视化配置编辑器与教程站，正式支持 macOS / Windows 导入导出",
```

Leave `author` untouched in this pass.

- [ ] **Step 3: Verify the repository entry surface**

Run:

```bash
test -f README.md && test -f LICENSE
node -e "const fs=require('fs'); const pkg=JSON.parse(fs.readFileSync('package.json','utf8')); if(!pkg.description) process.exit(1); console.log(pkg.description)"
rg -n "正式支持 macOS / Windows 导入导出|自动下载或安装上游 schema / dict 方案包" README.md
```

Expected:
- `test -f` commands succeed
- Node prints the new package description
- `rg` finds both trust-boundary lines in `README.md`

- [ ] **Step 4: Commit**

```bash
git add README.md LICENSE package.json

git commit -F - <<'EOF'
Add the missing open-source repository entry surface

The repository currently lacks a README and license file, and the package
metadata ships with an empty description. This change adds the minimum public
entry surface so first-time visitors can understand the project boundary,
local dev flow, and relationship to upstream Rime schemas before they trust
or use the output.

Constraint: Keep the repo entry docs aligned with the existing product contract
Rejected: Expand into a full docs portal now | separate scope from the current trust-fix pass
Confidence: high
Scope-risk: narrow
Reversibility: clean
Directive: Update README and product-contract language together whenever support boundaries change
Tested: test -f README.md && test -f LICENSE; node -e "const fs=require('fs'); const pkg=JSON.parse(fs.readFileSync('package.json','utf8')); if(!pkg.description) process.exit(1); console.log(pkg.description)"; rg -n "正式支持 macOS / Windows 导入导出|自动下载或安装上游 schema / dict 方案包" README.md
Not-tested: npm publish metadata preview
EOF
```

---

### Task 6: Run the full project verification gate and capture any fallout immediately

**Files:**
- No planned source changes; only fix-on-failure follow-up if verification surfaces regressions.

- [ ] **Step 1: Run the focused trust-fix test set first**

Run:

```bash
npx vitest run \
  src/data/tutorial-contract.test.ts \
  src/content/rime-trust-contract.test.ts \
  src/data/schema-data.contract.test.ts \
  src/lib/docs/__tests__/tutorial-helpers.test.ts \
  src/lib/docs/search-index.test.ts \
  src/features/compare/SchemaCompare.test.tsx \
  src/features/schema-detail/__tests__/SchemaDetailPage.test.tsx \
  src/app/home/HomePage.test.tsx
```

Expected: ALL PASS.

- [ ] **Step 2: Run the repository batch gate from AGENTS.md**

Run:

```bash
npm test
npx tsc -b
npm run build
```

Expected:
- `npm test` → all Vitest suites pass
- `npx tsc -b` → no TypeScript errors
- `npm run build` → Vite production build succeeds

- [ ] **Step 3: If verification is green, stop; if not, fix the fallout before merging**

If any command in Step 1 or Step 2 fails:

```bash
# Inspect the failing test or type/build output immediately, make the minimal correction,
# then rerun only the failed command first.
```

Only when the failed command passes again, rerun the full batch gate:

```bash
npm test && npx tsc -b && npm run build
```

Expected: final gate ends green with no remaining known errors.

---

## Self-Review

- **Spec coverage:**
  - Unreachable tutorials / editor help dead-ends → Task 1
  - Misleading preset/installation UI copy → Task 2
  - Risky Rime tutorial claims and incorrect examples → Task 3
  - Dead schema links and wrong `wanxiang_pro` type → Task 4
  - Missing open-source repo entry docs → Task 5
  - Fresh proof that the repo still passes its gate → Task 6

- **Placeholder scan:** No `TODO` / `TBD` / “handle appropriately” placeholders remain; each task names exact files, code, commands, and expected outcomes.

- **Type consistency:** Canonical tutorial slug is `auxiliary-code-config`; legacy alias is `auxiliary-code`. Corrected schema type is `double_pinyin` for `wanxiang_pro`. Canonical upstream repo for Wanxiang is `https://github.com/amzxyz/rime_wanxiang`.
