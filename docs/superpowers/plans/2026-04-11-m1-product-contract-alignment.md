# M1 Product Contract Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align rime-craft's live product contract with its actual support boundaries by making macOS and Windows the only formal editor/export targets while preserving tutorial and schema content that describes the wider Rime ecosystem.

**Architecture:** Introduce one central product-contract module in app code, drive user-facing app surfaces from that module, and update live product docs to distinguish "Rime ecosystem availability" from "rime-craft formal support". Avoid rewriting historical batch review artifacts; only update live product surfaces and current design docs.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, Testing Library, Markdown/MDX docs, existing route components and schema detail UI.

**Design Spec:** `docs/superpowers/specs/2026-04-11-post-batch-roadmap-design.md`

---

### Task 1: Add a central product contract module

**Files:**
- Create: `src/lib/product/support-contract.ts`
- Create: `src/lib/product/support-contract.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/product/support-contract.test.ts` with:

```ts
import { describe, expect, it } from 'vitest'
import {
  FORMAL_EDITOR_PLATFORMS,
  RIME_ECOSYSTEM_PLATFORMS,
  getFormalPlatformLabel,
  isFormalEditorPlatform,
} from './support-contract'

describe('support contract', () => {
  it('treats only macos and windows as formal editor platforms', () => {
    expect(FORMAL_EDITOR_PLATFORMS).toEqual(['macos', 'windows'])
    expect(isFormalEditorPlatform('macos')).toBe(true)
    expect(isFormalEditorPlatform('windows')).toBe(true)
    expect(isFormalEditorPlatform('linux')).toBe(false)
    expect(isFormalEditorPlatform('android')).toBe(false)
    expect(isFormalEditorPlatform('ios')).toBe(false)
  })

  it('keeps the wider Rime ecosystem list separate from formal editor support', () => {
    expect(RIME_ECOSYSTEM_PLATFORMS).toEqual([
      'macOS',
      'Windows',
      'Linux',
      'Android',
      'iOS',
    ])
  })

  it('returns human-readable labels for the formal support matrix', () => {
    expect(getFormalPlatformLabel('macos')).toBe('macOS（Squirrel）')
    expect(getFormalPlatformLabel('windows')).toBe('Windows（Weasel）')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm test -- src/lib/product/support-contract.test.ts
```

Expected: FAIL with module-not-found errors for `./support-contract`.

- [ ] **Step 3: Write the minimal implementation**

Create `src/lib/product/support-contract.ts` with:

```ts
import type { Platform } from '@/types/config'

export const FORMAL_EDITOR_PLATFORMS = ['macos', 'windows'] as const

export type FormalEditorPlatform = (typeof FORMAL_EDITOR_PLATFORMS)[number]

export const RIME_ECOSYSTEM_PLATFORMS = [
  'macOS',
  'Windows',
  'Linux',
  'Android',
  'iOS',
] as const

export function isFormalEditorPlatform(
  platform: Platform,
): platform is FormalEditorPlatform {
  return platform === 'macos' || platform === 'windows'
}

export function getFormalPlatformLabel(platform: FormalEditorPlatform): string {
  switch (platform) {
    case 'macos':
      return 'macOS（Squirrel）'
    case 'windows':
      return 'Windows（Weasel）'
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:

```bash
npm test -- src/lib/product/support-contract.test.ts
```

Expected: PASS, 3 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/product/support-contract.ts src/lib/product/support-contract.test.ts
git commit -m "feat: add central product support contract"
```

### Task 2: Drive user-facing app surfaces from the formal support contract

**Files:**
- Modify: `src/app/home/HomePage.tsx`
- Modify: `src/features/wizard/steps/PlatformStep.tsx`
- Modify: `src/features/wizard/WizardPage.tsx`
- Modify: `src/features/wizard/steps/ExportStep.tsx`
- Create: `src/app/home/HomePage.test.tsx`
- Create: `src/features/wizard/steps/PlatformStep.test.tsx`

- [ ] **Step 1: Write the failing component tests**

Create `src/app/home/HomePage.test.tsx` with:

```tsx
import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { HomePage } from './HomePage'

describe('HomePage', () => {
  it('does not claim full formal platform support', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    expect(screen.queryByText('全平台支持')).not.toBeInTheDocument()
    expect(
      screen.getByText('正式支持 macOS / Windows 导入导出'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('教程覆盖更广的 Rime 平台生态'),
    ).toBeInTheDocument()
  })
})
```

Create `src/features/wizard/steps/PlatformStep.test.tsx` with:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PlatformStep } from './PlatformStep'

describe('PlatformStep', () => {
  it('shows only formal export targets', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<PlatformStep value="macos" onChange={onChange} />)

    expect(screen.getByText('macOS')).toBeInTheDocument()
    expect(screen.getByText('Windows')).toBeInTheDocument()
    expect(screen.queryByText('Linux')).not.toBeInTheDocument()
    expect(screen.queryByText('Android')).not.toBeInTheDocument()
    expect(screen.queryByText('iOS')).not.toBeInTheDocument()

    await user.click(screen.getByText('Windows'))
    expect(onChange).toHaveBeenCalledWith('windows')
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
npm test -- src/app/home/HomePage.test.tsx src/features/wizard/steps/PlatformStep.test.tsx
```

Expected: FAIL because the current copy still says `全平台支持` and the wizard still renders 5 platform cards.

- [ ] **Step 3: Implement the copy and target-platform changes**

Update `src/app/home/HomePage.tsx` so the feature cards become:

```ts
const FEATURES = [
  { title: '可视化配置', description: '无需手动编辑 YAML，通过表单直观配置 Rime 各项参数' },
  { title: '正式支持 macOS / Windows 导入导出', description: '当前配置生成与平台文件处理以鼠须管、小狼毫为正式支持范围' },
  { title: '教程覆盖更广的 Rime 平台生态', description: '安装、同步与方案知识内容继续覆盖 Linux、Android、iOS 等 Rime 生态平台' },
  { title: '预设方案', description: '提供多种开箱即用的配置组合，快速上手' },
]
```

Update `src/features/wizard/steps/PlatformStep.tsx` to:

```ts
import type { FormalEditorPlatform } from '@/lib/product/support-contract'

const PLATFORMS: { id: FormalEditorPlatform; name: string; description: string }[] = [
  { id: 'macos', name: 'macOS', description: '鼠须管 (Squirrel)' },
  { id: 'windows', name: 'Windows', description: '小狼毫 (Weasel)' },
]

interface PlatformStepProps {
  value: FormalEditorPlatform
  onChange: (platform: FormalEditorPlatform) => void
}
```

Append a note under the grid:

```tsx
<p className="mt-4 text-sm text-gray-500">
  当前向导的正式导出目标为 macOS 和 Windows。其他 Rime 平台仍可参考教程内容，但不作为本向导的正式配置输出目标。
</p>
```

Update `src/features/wizard/WizardPage.tsx`:

```ts
import type { FormalEditorPlatform } from '@/lib/product/support-contract'

export interface WizardState {
  step: number
  platform: FormalEditorPlatform
  // ...
}
```

Update `src/features/wizard/steps/ExportStep.tsx` so `buildProject()` only accepts the formal platform subset and never silently treats unsupported targets as macOS.

- [ ] **Step 4: Run the tests to verify they pass**

Run:

```bash
npm test -- src/app/home/HomePage.test.tsx src/features/wizard/steps/PlatformStep.test.tsx
```

Expected: PASS, both files green.

- [ ] **Step 5: Run a quick manual route audit**

Run:

```bash
npm run build
```

Expected: PASS. Then open the app and manually check:
- `/` no longer claims "全平台支持" as a formal product promise
- `/wizard` only offers macOS and Windows as export targets
- `/wizard` completion copy still exports correct `squirrel.custom.yaml` / `weasel.custom.yaml`

- [ ] **Step 6: Commit**

```bash
git add src/app/home/HomePage.tsx src/features/wizard/steps/PlatformStep.tsx src/features/wizard/WizardPage.tsx src/features/wizard/steps/ExportStep.tsx src/app/home/HomePage.test.tsx src/features/wizard/steps/PlatformStep.test.tsx
git commit -m "feat: align live product surfaces with formal platform support"
```

### Task 3: Separate live product contract docs from historical or ecosystem docs

**Files:**
- Create: `docs/PRODUCT_CONTRACT.md`
- Modify: `docs/specs/2026-04-06-rime-craft-design.md`
- Modify: `src/features/schema-detail/SchemaIntroTab.tsx`
- Modify: `src/features/compare/SchemaCompare.tsx`

- [ ] **Step 1: Write the product-contract document**

Create `docs/PRODUCT_CONTRACT.md` with:

```md
# rime-craft 当前产品契约

## 正式支持范围

- 当前正式支持的编辑器 / 导入导出目标平台：`macOS`、`Windows`
- Linux / Android / iOS 相关内容继续作为 Rime 生态教程提供，但不作为当前版本的正式导入导出目标

## 项目状态保存

- 当前目标：默认自动本地保存
- 当前状态：待 M2 里程碑完成后成为正式能力

## YAML 编辑能力

- 当前目标：注释保留、尽可能保留原格式、支持高保真 round-trip
- 当前状态：待 M2 里程碑完成后成为正式能力

## 术语区分

- “Rime 平台支持”指 Rime 生态或方案可用平台
- “rime-craft 正式支持”指当前编辑器和导入导出主流程的正式保证范围
```

- [ ] **Step 2: Update the live design spec instead of historical batch docs**

At the top of `docs/specs/2026-04-06-rime-craft-design.md`, add a status note near the title block:

```md
> 状态说明（2026-04-11）：
> 本文保留为原始产品设计稿。当前正式支持矩阵与能力状态请同时参考 `docs/PRODUCT_CONTRACT.md` 与 `docs/superpowers/specs/2026-04-11-post-batch-roadmap-design.md`。
```

Do **not** rewrite `docs/superpowers/batches/2026-04-11-deep-content-final/` files; those are historical batch review artifacts.

- [ ] **Step 3: Clarify ecosystem-platform labels in schema detail and compare surfaces**

Update `src/features/schema-detail/SchemaIntroTab.tsx`:

```tsx
<h3 className="mb-2 text-base font-semibold">Rime 生态可用平台</h3>
<p className="mb-2 text-sm text-gray-500">
  这里展示的是该方案在 Rime 生态中的常见可用平台，不等同于 rime-craft 当前版本的正式导入导出支持范围。
</p>
```

Update `src/features/compare/SchemaCompare.tsx` row label:

```ts
{ label: 'Rime 生态平台', getValue: (s) => s.platforms },
```

- [ ] **Step 4: Run a targeted doc/copy sanity pass**

Run:

```bash
rg -n "全平台支持|平台支持" src/app src/features docs/specs/2026-04-06-rime-craft-design.md docs/PRODUCT_CONTRACT.md
```

Expected:
- Home page no longer uses `全平台支持` as the product promise
- Schema detail / compare surfaces now label ecosystem support explicitly
- The historical design spec points readers to the live contract doc instead of pretending it is the final truth

- [ ] **Step 5: Commit**

```bash
git add docs/PRODUCT_CONTRACT.md docs/specs/2026-04-06-rime-craft-design.md src/features/schema-detail/SchemaIntroTab.tsx src/features/compare/SchemaCompare.tsx
git commit -m "docs: separate live product contract from ecosystem platform facts"
```

### Task 4: Verify the milestone end-to-end

**Files:**
- No new files

- [ ] **Step 1: Run the milestone verification stack**

Run:

```bash
npm test
npx tsc -b
npm run build
```

Expected: all commands pass.

- [ ] **Step 2: Run a manual truth audit**

Manually confirm:
- `/` markets formal support as macOS / Windows only
- `/wizard` no longer offers unsupported export targets
- schema detail and compare views still display wider Rime ecosystem information, but no longer imply that those platforms are formally supported by rime-craft
- historical batch docs remain untouched

- [ ] **Step 3: Commit any final fixes**

```bash
git add src/app/home/HomePage.tsx src/features/wizard/steps/PlatformStep.tsx src/features/wizard/WizardPage.tsx src/features/wizard/steps/ExportStep.tsx docs/PRODUCT_CONTRACT.md docs/specs/2026-04-06-rime-craft-design.md src/features/schema-detail/SchemaIntroTab.tsx src/features/compare/SchemaCompare.tsx
git commit -m "fix: polish M1 contract alignment audit findings"
```
