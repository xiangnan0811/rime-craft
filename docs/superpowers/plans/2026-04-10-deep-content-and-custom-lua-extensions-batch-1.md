# Deep Content & Custom Lua Extensions — Batch 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the content depth standard + progressive disclosure UI infrastructure + merge Special Input and Lua Extensions into a unified module with full custom Lua editing capability.

**Architecture:** Dual-track implementation — Track A delivers reusable infrastructure (depth guide doc + 3 MDX components), Track B delivers the benchmark module (unified "Lua 扩展" with 3 Tabs, custom triggers, CodeMirror-based Lua editor). Both converge in the tutorial content rewrite that showcases the new components.

**Tech Stack:** React 18, TypeScript, Vite, Vitest + @testing-library/react + happy-dom, Zustand, MDX, `@uiw/react-codemirror` (already installed), `yaml` package for parse/serialize, Tailwind CSS, Radix UI primitives (tabs, dialog, switch, etc.).

**Design Spec:** See `docs/superpowers/specs/2026-04-10-deep-content-and-custom-lua-extensions-design.md` for full context.

**Important notes before starting:**
- Run `npm test` (vitest run) after each TDD cycle. Run `npm run build` before marking Phase 9 complete.
- The project's primary working directory is NOT currently a git repository. The commit steps in this plan assume git will be initialized (`git init` in project root) OR the engineer can skip commit steps and group changes differently. Preserve the logical grouping either way.
- Follow existing project code style: functional components, Zustand hooks, Tailwind CSS classes, 2-space indent, no semicolons at line ends (inspected: project uses semicolons — follow existing style in each file you touch).
- MDX directives `:::tip`, `:::note`, `:::warning` exist and are mapped to `<Callout>` via `remark-directive`. The new `<Details>`, `<StepGuide>`, `<YamlPreview>` are plain JSX components used in MDX.

---

## Phase 1: Foundation

### Task 1: Content Depth Guide document

**Files:**
- Create: `docs/CONTENT_DEPTH_GUIDE.md`

- [ ] **Step 1: Create the content depth guide document**

Write this content to `docs/CONTENT_DEPTH_GUIDE.md`:

```markdown
# rime-craft 内容深度指南

所有模块教程的统一深度标准。不是固定模板，而是**最低深度要求 + 3 层渐进内容模型**。

## 三层内容模型

每个模块的 MDX 教程按以下三层组织。第 1-2 层默认展开，第 3 层用 `<Details>` 折叠，按需展开。

### 第 1 层：核心（必须）

所有模块必须覆盖：

- **是什么** — 一句话定义 + 它解决什么问题 + 为什么需要它
- **快速上手** — 最常用的 2-3 个操作，配合 UI 说明
- **配置项详解** — 每个配置项的含义、默认值、取值范围、效果

### 第 2 层：理解（必须，篇幅按复杂度调整）

所有模块必须覆盖：

- **原理机制** — 这个功能在 RIME 中是怎么工作的（涉及的 YAML 字段、Lua 组件、引擎调用链）
- **完整示例** — 可复制的 YAML/Lua 代码块，展示从配置到效果的完整过程
- **常见场景** — 不同用户群体（办公、程序员、写作）的推荐搭配

### 第 3 层：进阶（按复杂度可选，用 `<Details>` 折叠）

复杂模块必须覆盖，简单模块可选：

- **自定义扩展** — 如何超越编辑器预设，手写 YAML/Lua 实现更多可能
- **常见问题与排错** — 配置不生效的检查步骤、典型错误及修复
- **注意事项与维护** — 升级方案时的兼容性、备份策略、多设备同步注意点
- **底层细节** — RIME 引擎相关的深入技术细节

## 发布前检查清单

每个模块教程发布前必须通过以下五项检查：

| 检查项 | 要求 |
|------|------|
| 新手能否仅看第 1 层就完成基本配置？ | 必须满足 |
| 用户是否理解"为什么这样配置"？ | 第 2 层必须覆盖 |
| 想要超越预设的用户是否有路径？ | 第 3 层必须覆盖 |
| 出了问题能否自助排查？ | FAQ 必须覆盖 |
| 示例代码能否直接复制使用？ | 必须可用 |

## 可用的 MDX 组件

- `<Callout>` / `:::tip`、`:::note`、`:::warning`、`:::caution` — 提示框
- `<Details title="..." level="advanced">` — 可折叠进阶区（第 3 层内容）
- `<StepGuide>` + `<Step title="...">` — 分步操作指南
- `<YamlPreview title="..." highlight={[3,4]} caption="...">` — YAML 配置预览
- `<ConfigSlot module="..." />` — 编辑器配置区块锚点
- `<GoToConfigButton module="..." />` — 跳转到编辑器的按钮

## 写作原则

1. **新手看得懂，高手有收获** — 用渐进披露实现两者兼顾
2. **每个示例都能复制运行** — 避免伪代码或不完整的片段
3. **解释"为什么"，不只是"怎么做"** — 原理层是区分浮于表面与深度教程的关键
4. **配合 UI 截图或 `<ConfigSlot>`** — 让用户在阅读的同时看到对应的编辑器区域
5. **链接相关模块** — 用 `./module-slug` 格式，编辑器中会自动跳转
```

- [ ] **Step 2: Commit**

```bash
git add docs/CONTENT_DEPTH_GUIDE.md
git commit -m "docs: add content depth guide for module tutorials"
```

---

### Task 2: Add `@codemirror/lang-lua` dependency

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the Lua language support for CodeMirror**

Run:
```bash
npm install @codemirror/lang-lua
```

Expected: `@codemirror/lang-lua` added to `dependencies` in `package.json`, `package-lock.json` updated.

- [ ] **Step 2: Verify install succeeded**

Run:
```bash
node -e "console.log(require('@codemirror/lang-lua').lua)"
```

Expected: Prints a function (the lua language support export). If it prints `undefined`, reinstall.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @codemirror/lang-lua for custom Lua editor"
```

---

### Task 3: Extend type system for custom triggers and Lua scripts

**Files:**
- Modify: `src/types/config.ts`

- [ ] **Step 1: Write the type additions**

In `src/types/config.ts`, find the `// ─── Special input ─────────────────────────────────────` section (around line 197) and replace it plus extend `SchemaConfig`. Locate:

```typescript
// ─── Special input ─────────────────────────────────────
export interface SpecialTrigger {
  id: string;
  enabled: boolean;
  triggerCode: string;
}

export interface SpecialInputConfig {
  enabledTriggers: SpecialTrigger[];
}
```

Replace with:

```typescript
// ─── Special input ─────────────────────────────────────
export interface SpecialTrigger {
  id: string;
  enabled: boolean;
  triggerCode: string;
}

/** User-defined special trigger that invokes a custom Lua script. */
export interface CustomTrigger {
  id: string;              // UUID
  name: string;            // User-readable name, e.g. "IP 地址查询"
  triggerCode: string;     // e.g. "/ip"
  description: string;
  scriptId: string;        // FK to LuaScript.id
}

export interface SpecialInputConfig {
  enabledTriggers: SpecialTrigger[];
  customTriggers: CustomTrigger[];
}

/** A user-authored Lua script registered in the schema. */
export interface LuaScript {
  id: string;              // UUID
  fileName: string;        // e.g. "my_translator.lua" (letters, digits, _, -)
  scriptType: 'translator' | 'filter' | 'processor';
  description: string;
  code: string;            // Lua source code
}
```

Then find `SchemaConfig` (around line 77) and add a `luaScripts?` field. Change:

```typescript
export interface SchemaConfig {
  schemaId: string;
  fuzzyRules: FuzzyRuleState[];
  switches?: SwitchItem[];
  punctuator?: PunctuatorConfig;
  translator?: TranslatorConfig;
  spellingScheme?: SpellingScheme;
  auxiliaryCode?: AuxiliaryCodeConfig;
  reverseLookup?: ReverseLookupConfig;
  specialInput?: SpecialInputConfig;
  luaExtensions?: LuaExtensionsConfig;
  displayConfig?: DisplayConfig;
}
```

to:

```typescript
export interface SchemaConfig {
  schemaId: string;
  fuzzyRules: FuzzyRuleState[];
  switches?: SwitchItem[];
  punctuator?: PunctuatorConfig;
  translator?: TranslatorConfig;
  spellingScheme?: SpellingScheme;
  auxiliaryCode?: AuxiliaryCodeConfig;
  reverseLookup?: ReverseLookupConfig;
  specialInput?: SpecialInputConfig;
  luaExtensions?: LuaExtensionsConfig;
  luaScripts?: LuaScript[];
  displayConfig?: DisplayConfig;
}
```

- [ ] **Step 2: Run TypeScript compile to check for breakage**

Run:
```bash
npx tsc --noEmit
```

Expected: Likely errors in `SpecialInput.tsx` and `defaults.ts` because `SpecialInputConfig` now requires `customTriggers: CustomTrigger[]`. Note the errors — they'll be fixed in Task 4 and later tasks.

- [ ] **Step 3: Commit**

```bash
git add src/types/config.ts
git commit -m "feat(types): add CustomTrigger and LuaScript types"
```

---

### Task 4: Lua script templates + createEmptyProject update

**Files:**
- Create: `src/data/lua-script-templates.ts`
- Modify: `src/lib/config/defaults.ts`
- Modify: `src/features/editor/modules/SpecialInput.tsx` (temporary fix; full rewrite later)

- [ ] **Step 1: Create the Lua script templates file**

Create `src/data/lua-script-templates.ts`:

```typescript
import type { LuaScript } from '@/types/config'

/**
 * Skeleton templates for each Lua script type.
 * The {name} placeholder is replaced with the script's fileName (without .lua).
 */
export const LUA_SCRIPT_TEMPLATES: Record<LuaScript['scriptType'], string> = {
  translator: `-- {name}
-- 类型：Translator（翻译器）
-- 作用：将特定输入映射为候选词

local function {name}(input, seg, env)
  -- TODO: 在此实现你的翻译逻辑
  -- 示例：输入 /hello 输出 "Hello, World!"
  if input == "/hello" then
    yield(Candidate("word", seg.start, seg._end, "Hello, World!", "自定义"))
  end
end

return {name}
`,
  filter: `-- {name}
-- 类型：Filter（过滤器）
-- 作用：对已有候选词进行过滤、排序或修改

local function {name}(input, env)
  for cand in input:iter() do
    -- TODO: 在此处理候选词
    yield(cand)
  end
end

return {name}
`,
  processor: `-- {name}
-- 类型：Processor（处理器）
-- 作用：拦截按键事件

local function {name}(key, env)
  -- 返回值：
  --   kNoop     = 0  未处理，继续传递
  --   kAccepted = 1  已处理，拦截
  --   kRejected = 2  拒绝处理
  return 0  -- kNoop
end

return {name}
`,
}

/**
 * Generate a Lua script from a template, replacing {name} with the script identifier.
 * @param scriptType The type of script to generate.
 * @param identifier The Lua identifier (fileName without .lua, must be valid Lua name).
 */
export function renderLuaTemplate(
  scriptType: LuaScript['scriptType'],
  identifier: string,
): string {
  return LUA_SCRIPT_TEMPLATES[scriptType].replaceAll('{name}', identifier)
}
```

- [ ] **Step 2: Write the template rendering test**

Create `src/data/lua-script-templates.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { renderLuaTemplate, LUA_SCRIPT_TEMPLATES } from './lua-script-templates'

describe('renderLuaTemplate', () => {
  it('replaces {name} placeholder in translator template', () => {
    const out = renderLuaTemplate('translator', 'my_script')
    expect(out).toContain('local function my_script(input, seg, env)')
    expect(out).toContain('return my_script')
    expect(out).not.toContain('{name}')
  })

  it('replaces all occurrences of {name}', () => {
    const out = renderLuaTemplate('filter', 'foo')
    expect(out.match(/foo/g)?.length).toBeGreaterThanOrEqual(2)
  })

  it('supports all three script types', () => {
    expect(LUA_SCRIPT_TEMPLATES.translator).toBeTruthy()
    expect(LUA_SCRIPT_TEMPLATES.filter).toBeTruthy()
    expect(LUA_SCRIPT_TEMPLATES.processor).toBeTruthy()
  })
})
```

- [ ] **Step 3: Run the test**

Run:
```bash
npx vitest run src/data/lua-script-templates.test.ts
```

Expected: 3 tests passing.

- [ ] **Step 4: Fix defaults.ts to initialize customTriggers**

Read `src/lib/config/defaults.ts` and find where `specialInput` is initialized (search for `specialInput` or `enabledTriggers`). If there's no existing initialization, no fix needed here because `specialInput` is optional. If there IS initialization that creates `{ enabledTriggers: [...] }` without `customTriggers`, add `customTriggers: []` alongside.

Also ensure `createEmptyProject()` does not break. Run:
```bash
npx tsc --noEmit
```

If `defaults.ts` reports a missing `customTriggers` error, fix by adding `customTriggers: []` to the `specialInput` literal. If no error, proceed.

- [ ] **Step 5: Temporarily fix SpecialInput.tsx to include customTriggers**

In `src/features/editor/modules/SpecialInput.tsx`, find the default config fallback (around line 15):

```typescript
const config: SpecialInputConfig = schemaConfigs[primarySchemaId]?.specialInput ?? {
  enabledTriggers: SPECIAL_TRIGGER_DEFINITIONS.map((d) => ({
    id: d.id, enabled: true, triggerCode: d.defaultCode,
  })),
}
```

Replace with:

```typescript
const config: SpecialInputConfig = schemaConfigs[primarySchemaId]?.specialInput ?? {
  enabledTriggers: SPECIAL_TRIGGER_DEFINITIONS.map((d) => ({
    id: d.id, enabled: true, triggerCode: d.defaultCode,
  })),
  customTriggers: [],
}
```

This is a stopgap; the whole file is deleted later in Task 30.

- [ ] **Step 6: Run tsc to verify clean compile**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add src/data/lua-script-templates.ts src/data/lua-script-templates.test.ts src/lib/config/defaults.ts src/features/editor/modules/SpecialInput.tsx
git commit -m "feat: add Lua script templates and wire CustomTrigger defaults"
```

---

## Phase 2: Progressive Disclosure UI Components

### Task 5: Create `<Details>` component

**Files:**
- Create: `src/components/shared/Details.tsx`
- Create: `src/components/shared/Details.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/shared/Details.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Details } from './Details'

describe('<Details>', () => {
  it('renders title and is collapsed by default', () => {
    render(
      <Details title="Advanced topic">
        <p>Hidden body</p>
      </Details>
    )
    expect(screen.getByText('Advanced topic')).toBeInTheDocument()
    expect(screen.queryByText('Hidden body')).not.toBeVisible()
  })

  it('expands when clicked', async () => {
    const user = userEvent.setup()
    render(
      <Details title="Click me">
        <p>Now visible</p>
      </Details>
    )
    await user.click(screen.getByText('Click me'))
    expect(screen.getByText('Now visible')).toBeVisible()
  })

  it('shows advanced badge when level=advanced', () => {
    render(
      <Details title="Deep dive" level="advanced">
        <p>body</p>
      </Details>
    )
    expect(screen.getByText('进阶')).toBeInTheDocument()
  })

  it('shows intermediate badge when level=intermediate', () => {
    render(
      <Details title="Mid level" level="intermediate">
        <p>body</p>
      </Details>
    )
    expect(screen.getByText('扩展')).toBeInTheDocument()
  })

  it('respects defaultOpen=true', () => {
    render(
      <Details title="Open by default" defaultOpen>
        <p>Immediately visible</p>
      </Details>
    )
    expect(screen.getByText('Immediately visible')).toBeVisible()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
npx vitest run src/components/shared/Details.test.tsx
```

Expected: FAIL with "Cannot find module './Details'".

- [ ] **Step 3: Create the Details component**

Create `src/components/shared/Details.tsx`:

```typescript
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

const LEVEL_CONFIG = {
  intermediate: {
    label: '扩展',
    badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    borderClass: 'border-l-blue-300 dark:border-l-blue-700',
    bgClass: 'bg-blue-50/40 dark:bg-blue-950/20',
  },
  advanced: {
    label: '进阶',
    badgeClass: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    borderClass: 'border-l-purple-300 dark:border-l-purple-700',
    bgClass: 'bg-purple-50/40 dark:bg-purple-950/20',
  },
  default: {
    label: '',
    badgeClass: '',
    borderClass: 'border-l-gray-300 dark:border-l-gray-600',
    bgClass: 'bg-gray-50/40 dark:bg-slate-900/30',
  },
} as const

interface DetailsProps {
  title: string
  level?: 'intermediate' | 'advanced'
  defaultOpen?: boolean
  children: ReactNode
}

export function Details({ title, level, defaultOpen = false, children }: DetailsProps) {
  const cfg = LEVEL_CONFIG[level ?? 'default']
  return (
    <details
      open={defaultOpen}
      className={cn(
        'my-4 rounded-r-md border-l-[3px] py-2 pl-4 pr-3 transition-colors',
        cfg.borderClass,
        cfg.bgClass,
      )}
    >
      <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-800 dark:text-slate-200 [&::-webkit-details-marker]:hidden">
        <span className="mr-1 inline-block text-xs text-gray-400 transition-transform group-open:rotate-90">▶</span>
        <span>{title}</span>
        {level && (
          <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-semibold', cfg.badgeClass)}>
            {cfg.label}
          </span>
        )}
      </summary>
      <div className="mt-3 text-[15px] leading-[1.7] text-gray-700 dark:text-slate-300">
        {children}
      </div>
    </details>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:
```bash
npx vitest run src/components/shared/Details.test.tsx
```

Expected: 5 tests passing.

Note: `queryByText('Hidden body').not.toBeVisible()` uses native `<details>` semantics — the body is in the DOM but the browser doesn't render the children when the summary is collapsed. With happy-dom, the test should still pass because the text won't be "visible" per CSS. If the test fails on this specific check, adjust to `expect(details.open).toBe(false)` pattern:

```typescript
const details = screen.getByText('Advanced topic').closest('details')
expect(details?.open).toBe(false)
```

- [ ] **Step 5: Commit**

```bash
git add src/components/shared/Details.tsx src/components/shared/Details.test.tsx
git commit -m "feat(mdx): add <Details> collapsible component for progressive disclosure"
```

---

### Task 6: Create `<StepGuide>` + `<Step>` components

**Files:**
- Create: `src/components/shared/StepGuide.tsx`
- Create: `src/components/shared/StepGuide.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/shared/StepGuide.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StepGuide, Step } from './StepGuide'

describe('<StepGuide>', () => {
  it('renders all step titles', () => {
    render(
      <StepGuide>
        <Step title="First step">First body</Step>
        <Step title="Second step">Second body</Step>
        <Step title="Third step">Third body</Step>
      </StepGuide>
    )
    expect(screen.getByText('First step')).toBeInTheDocument()
    expect(screen.getByText('Second step')).toBeInTheDocument()
    expect(screen.getByText('Third step')).toBeInTheDocument()
  })

  it('renders step bodies', () => {
    render(
      <StepGuide>
        <Step title="Step 1">Body content 1</Step>
      </StepGuide>
    )
    expect(screen.getByText('Body content 1')).toBeInTheDocument()
  })

  it('renders auto-numbered indicators 1, 2, 3', () => {
    render(
      <StepGuide>
        <Step title="A">a</Step>
        <Step title="B">b</Step>
        <Step title="C">c</Step>
      </StepGuide>
    )
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
npx vitest run src/components/shared/StepGuide.test.tsx
```

Expected: FAIL with "Cannot find module './StepGuide'".

- [ ] **Step 3: Create the component**

Create `src/components/shared/StepGuide.tsx`:

```typescript
import { Children, isValidElement, type ReactNode } from 'react'

interface StepGuideProps {
  children: ReactNode
}

export function StepGuide({ children }: StepGuideProps) {
  // Filter to only valid Step elements and inject numeric index
  const steps = Children.toArray(children).filter(isValidElement)

  return (
    <ol className="my-6 space-y-5 pl-0 [counter-reset:step]">
      {steps.map((child, idx) => (
        <li key={idx} className="relative flex gap-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
            {idx + 1}
          </div>
          <div className="flex-1">{child}</div>
          {idx < steps.length - 1 && (
            <div
              aria-hidden
              className="absolute left-4 top-10 h-[calc(100%+1rem)] w-px bg-gray-200 dark:bg-slate-700"
            />
          )}
        </li>
      ))}
    </ol>
  )
}

interface StepProps {
  title: string
  children: ReactNode
}

export function Step({ title, children }: StepProps) {
  return (
    <div>
      <div className="mb-2 text-[15px] font-semibold text-gray-900 dark:text-slate-100">
        {title}
      </div>
      <div className="text-[15px] leading-[1.7] text-gray-700 dark:text-slate-300 [&>*:last-child]:mb-0">
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:
```bash
npx vitest run src/components/shared/StepGuide.test.tsx
```

Expected: 3 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/components/shared/StepGuide.tsx src/components/shared/StepGuide.test.tsx
git commit -m "feat(mdx): add <StepGuide> + <Step> components for stepwise instructions"
```

---

### Task 7: Create `<YamlPreview>` component

**Files:**
- Create: `src/components/shared/YamlPreview.tsx`
- Create: `src/components/shared/YamlPreview.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/shared/YamlPreview.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { YamlPreview } from './YamlPreview'

describe('<YamlPreview>', () => {
  it('renders title when provided', () => {
    render(
      <YamlPreview title="example.yaml">
        <pre><code>foo: bar</code></pre>
      </YamlPreview>
    )
    expect(screen.getByText('example.yaml')).toBeInTheDocument()
  })

  it('renders caption when provided', () => {
    render(
      <YamlPreview caption="第 1 行是关键">
        <pre><code>key: value</code></pre>
      </YamlPreview>
    )
    expect(screen.getByText('第 1 行是关键')).toBeInTheDocument()
  })

  it('renders children code block', () => {
    render(
      <YamlPreview>
        <pre><code>schema: test</code></pre>
      </YamlPreview>
    )
    expect(screen.getByText(/schema: test/)).toBeInTheDocument()
  })

  it('applies highlight class when highlight prop is set', () => {
    const { container } = render(
      <YamlPreview highlight={[1]}>
        <pre><code>a: 1
b: 2</code></pre>
      </YamlPreview>
    )
    // Presence of a highlighted-line wrapper indicates the feature ran
    expect(container.querySelector('[data-highlight-lines]')).not.toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
npx vitest run src/components/shared/YamlPreview.test.tsx
```

Expected: FAIL with "Cannot find module './YamlPreview'".

- [ ] **Step 3: Create the component**

Create `src/components/shared/YamlPreview.tsx`:

```typescript
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface YamlPreviewProps {
  title?: string
  highlight?: number[]
  caption?: string
  diff?: boolean
  children: ReactNode
}

export function YamlPreview({
  title,
  highlight,
  caption,
  diff = false,
  children,
}: YamlPreviewProps) {
  return (
    <figure className="my-4">
      <div
        className={cn(
          'overflow-hidden rounded-lg border border-slate-700 bg-slate-900',
          diff && 'yaml-preview-diff',
        )}
        data-highlight-lines={highlight ? highlight.join(',') : undefined}
      >
        {title && (
          <div className="border-b border-slate-700 bg-slate-950 px-4 py-2 text-xs text-slate-400">
            {title}
          </div>
        )}
        <div
          className={cn(
            '[&_pre]:my-0 [&_pre]:overflow-x-auto [&_pre]:bg-transparent [&_pre]:p-4',
            '[&_pre]:text-sm [&_pre]:leading-relaxed [&_pre]:border-0',
            // Diff mode coloring
            diff && '[&_code_span[data-line-diff="add"]]:bg-green-500/10',
            diff && '[&_code_span[data-line-diff="del"]]:bg-red-500/10',
          )}
        >
          {children}
        </div>
      </div>
      {caption && (
        <figcaption className="mt-2 text-xs italic text-gray-500 dark:text-slate-400">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
```

Note: Line-level highlighting is implemented via the `data-highlight-lines` attribute — the actual visual highlight would be applied by extending the rehype-pretty-code pipeline. For Batch 1, the attribute is sufficient to demonstrate the interface; real per-line highlighting can be enhanced in a later batch. The test passes as long as the attribute is present.

- [ ] **Step 4: Run tests to verify they pass**

Run:
```bash
npx vitest run src/components/shared/YamlPreview.test.tsx
```

Expected: 4 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/components/shared/YamlPreview.tsx src/components/shared/YamlPreview.test.tsx
git commit -m "feat(mdx): add <YamlPreview> component for annotated YAML snippets"
```

---

### Task 8: Register new MDX components

**Files:**
- Modify: `src/components/shared/mdx-components.tsx`

- [ ] **Step 1: Add imports and registrations**

In `src/components/shared/mdx-components.tsx`, find the existing imports near the top:

```typescript
import { GoToConfigButton } from './GoToConfigButton'
import { ConfigSlot } from './ConfigSlot'
import { Pre, InlineCode } from './CodeBlock'
import { Callout } from './Callout'
```

Add after these:

```typescript
import { Details } from './Details'
import { StepGuide, Step } from './StepGuide'
import { YamlPreview } from './YamlPreview'
```

Then find the `mdxComponents` export (around line 22) and add the new components. Locate:

```typescript
export const mdxComponents = {
  GoToConfigButton,
  ConfigSlot,

  tip: (props: Record<string, unknown>) => <Callout calloutType="tip" {...props} />,
```

Change to:

```typescript
export const mdxComponents = {
  GoToConfigButton,
  ConfigSlot,
  Details,
  StepGuide,
  Step,
  YamlPreview,

  tip: (props: Record<string, unknown>) => <Callout calloutType="tip" {...props} />,
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Run all component tests**

Run:
```bash
npx vitest run src/components/shared/
```

Expected: All existing + new tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/shared/mdx-components.tsx
git commit -m "feat(mdx): register Details, StepGuide, YamlPreview in MDX component map"
```

---

## Phase 3: Store Extensions

### Task 9: Add custom trigger actions to config store

**Files:**
- Modify: `src/stores/config-store.ts`
- Modify: `src/stores/config-store.test.ts`

- [ ] **Step 1: Write failing tests**

In `src/stores/config-store.test.ts`, append these tests at the end of the main `describe` block (just before the closing `})`) — ensure you don't break existing tests:

```typescript
  describe('custom triggers', () => {
    beforeEach(() => {
      useConfigStore.getState().setSchemaList([{ schema: 'rime_ice' }])
    })

    it('addCustomTrigger appends a trigger with a generated id', () => {
      useConfigStore.getState().addCustomTrigger('rime_ice', {
        name: 'IP 查询',
        triggerCode: '/ip',
        description: '查询本机 IP',
        scriptId: 'script-1',
      })
      const triggers = useConfigStore.getState().project.schemaConfigs['rime_ice']?.specialInput?.customTriggers
      expect(triggers).toHaveLength(1)
      expect(triggers?.[0]?.name).toBe('IP 查询')
      expect(triggers?.[0]?.id).toBeTruthy()
    })

    it('updateCustomTrigger modifies fields', () => {
      useConfigStore.getState().addCustomTrigger('rime_ice', {
        name: 'old', triggerCode: '/a', description: '', scriptId: 's',
      })
      const id = useConfigStore.getState().project.schemaConfigs['rime_ice']!.specialInput!.customTriggers[0]!.id
      useConfigStore.getState().updateCustomTrigger('rime_ice', id, { name: 'new' })
      const updated = useConfigStore.getState().project.schemaConfigs['rime_ice']!.specialInput!.customTriggers[0]
      expect(updated.name).toBe('new')
    })

    it('deleteCustomTrigger removes the trigger', () => {
      useConfigStore.getState().addCustomTrigger('rime_ice', {
        name: 'x', triggerCode: '/x', description: '', scriptId: 's',
      })
      const id = useConfigStore.getState().project.schemaConfigs['rime_ice']!.specialInput!.customTriggers[0]!.id
      useConfigStore.getState().deleteCustomTrigger('rime_ice', id)
      expect(useConfigStore.getState().project.schemaConfigs['rime_ice']!.specialInput!.customTriggers).toHaveLength(0)
    })
  })
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```bash
npx vitest run src/stores/config-store.test.ts
```

Expected: 3 new tests fail with "addCustomTrigger is not a function" (or similar).

- [ ] **Step 3: Add the interface methods and implementations**

In `src/stores/config-store.ts`, add imports for new types at the top. Find the existing import block:

```typescript
import type {
  RimeProject,
  DefaultConfig,
  SchemaListItem,
  FuzzyRuleState,
  SwitchItem,
  PunctuatorConfig,
  CustomPhrase,
  EditorModule,
  ThemeStyle,
  ThemeColors,
  SchemaConfig,
  EditorUIState,
} from '@/types/config'
```

Add `CustomTrigger` (and `LuaScript` for Task 10) to the import:

```typescript
import type {
  RimeProject,
  DefaultConfig,
  SchemaListItem,
  FuzzyRuleState,
  SwitchItem,
  PunctuatorConfig,
  CustomPhrase,
  EditorModule,
  ThemeStyle,
  ThemeColors,
  SchemaConfig,
  EditorUIState,
  CustomTrigger,
  LuaScript,
} from '@/types/config'
```

Now extend the `ConfigState` interface. Find it and add these method signatures at the end (before the closing `}`):

```typescript
  addCustomTrigger: (schemaId: string, trigger: Omit<CustomTrigger, 'id'>) => void;
  updateCustomTrigger: (schemaId: string, id: string, partial: Partial<Omit<CustomTrigger, 'id'>>) => void;
  deleteCustomTrigger: (schemaId: string, id: string) => void;
  addLuaScript: (schemaId: string, script: Omit<LuaScript, 'id'>) => void;
  updateLuaScript: (schemaId: string, id: string, partial: Partial<Omit<LuaScript, 'id'>>) => void;
  deleteLuaScript: (schemaId: string, id: string) => void;
```

Then implement the 3 custom trigger actions. At the very end of the store implementation (right before the closing `}))`), add:

```typescript
  addCustomTrigger: (schemaId, trigger) =>
    set((s) => {
      const existing = s.project.schemaConfigs[schemaId]
      const currentSpecial = existing?.specialInput ?? { enabledTriggers: [], customTriggers: [] }
      const newTrigger: CustomTrigger = {
        ...trigger,
        id: crypto.randomUUID(),
      }
      return {
        project: {
          ...s.project,
          schemaConfigs: {
            ...s.project.schemaConfigs,
            [schemaId]: {
              ...(existing ?? { schemaId, fuzzyRules: [] }),
              specialInput: {
                enabledTriggers: currentSpecial.enabledTriggers,
                customTriggers: [...currentSpecial.customTriggers, newTrigger],
              },
            },
          },
        },
        isDirty: true,
      }
    }),

  updateCustomTrigger: (schemaId, id, partial) =>
    set((s) => {
      const existing = s.project.schemaConfigs[schemaId]
      if (!existing?.specialInput) return {}
      return {
        project: {
          ...s.project,
          schemaConfigs: {
            ...s.project.schemaConfigs,
            [schemaId]: {
              ...existing,
              specialInput: {
                ...existing.specialInput,
                customTriggers: existing.specialInput.customTriggers.map((t) =>
                  t.id === id ? { ...t, ...partial } : t,
                ),
              },
            },
          },
        },
        isDirty: true,
      }
    }),

  deleteCustomTrigger: (schemaId, id) =>
    set((s) => {
      const existing = s.project.schemaConfigs[schemaId]
      if (!existing?.specialInput) return {}
      return {
        project: {
          ...s.project,
          schemaConfigs: {
            ...s.project.schemaConfigs,
            [schemaId]: {
              ...existing,
              specialInput: {
                ...existing.specialInput,
                customTriggers: existing.specialInput.customTriggers.filter((t) => t.id !== id),
              },
            },
          },
        },
        isDirty: true,
      }
    }),
```

(Task 10 will add the Lua script actions.)

- [ ] **Step 4: Run tests to verify they pass**

Run:
```bash
npx vitest run src/stores/config-store.test.ts
```

Expected: 3 new custom trigger tests pass; existing tests also pass.

- [ ] **Step 5: Commit**

```bash
git add src/stores/config-store.ts src/stores/config-store.test.ts
git commit -m "feat(store): add custom trigger CRUD actions"
```

---

### Task 10: Add Lua script actions to config store

**Files:**
- Modify: `src/stores/config-store.ts`
- Modify: `src/stores/config-store.test.ts`

- [ ] **Step 1: Write failing tests**

Append to `src/stores/config-store.test.ts` after the `describe('custom triggers')` block:

```typescript
  describe('lua scripts', () => {
    beforeEach(() => {
      useConfigStore.getState().setSchemaList([{ schema: 'rime_ice' }])
    })

    it('addLuaScript appends a script with a generated id', () => {
      useConfigStore.getState().addLuaScript('rime_ice', {
        fileName: 'my_translator.lua',
        scriptType: 'translator',
        description: 'test script',
        code: '-- code',
      })
      const scripts = useConfigStore.getState().project.schemaConfigs['rime_ice']?.luaScripts
      expect(scripts).toHaveLength(1)
      expect(scripts?.[0]?.fileName).toBe('my_translator.lua')
      expect(scripts?.[0]?.id).toBeTruthy()
    })

    it('updateLuaScript modifies fields', () => {
      useConfigStore.getState().addLuaScript('rime_ice', {
        fileName: 'a.lua', scriptType: 'filter', description: '', code: '-- a',
      })
      const id = useConfigStore.getState().project.schemaConfigs['rime_ice']!.luaScripts![0]!.id
      useConfigStore.getState().updateLuaScript('rime_ice', id, { code: '-- b' })
      expect(useConfigStore.getState().project.schemaConfigs['rime_ice']!.luaScripts![0]!.code).toBe('-- b')
    })

    it('deleteLuaScript removes the script', () => {
      useConfigStore.getState().addLuaScript('rime_ice', {
        fileName: 'x.lua', scriptType: 'processor', description: '', code: '',
      })
      const id = useConfigStore.getState().project.schemaConfigs['rime_ice']!.luaScripts![0]!.id
      useConfigStore.getState().deleteLuaScript('rime_ice', id)
      expect(useConfigStore.getState().project.schemaConfigs['rime_ice']!.luaScripts).toHaveLength(0)
    })
  })
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```bash
npx vitest run src/stores/config-store.test.ts
```

Expected: 3 new lua script tests fail.

- [ ] **Step 3: Add implementations**

In `src/stores/config-store.ts`, after the `deleteCustomTrigger` implementation, add:

```typescript
  addLuaScript: (schemaId, script) =>
    set((s) => {
      const existing = s.project.schemaConfigs[schemaId]
      const currentScripts = existing?.luaScripts ?? []
      const newScript: LuaScript = {
        ...script,
        id: crypto.randomUUID(),
      }
      return {
        project: {
          ...s.project,
          schemaConfigs: {
            ...s.project.schemaConfigs,
            [schemaId]: {
              ...(existing ?? { schemaId, fuzzyRules: [] }),
              luaScripts: [...currentScripts, newScript],
            },
          },
        },
        isDirty: true,
      }
    }),

  updateLuaScript: (schemaId, id, partial) =>
    set((s) => {
      const existing = s.project.schemaConfigs[schemaId]
      if (!existing?.luaScripts) return {}
      return {
        project: {
          ...s.project,
          schemaConfigs: {
            ...s.project.schemaConfigs,
            [schemaId]: {
              ...existing,
              luaScripts: existing.luaScripts.map((sc) =>
                sc.id === id ? { ...sc, ...partial } : sc,
              ),
            },
          },
        },
        isDirty: true,
      }
    }),

  deleteLuaScript: (schemaId, id) =>
    set((s) => {
      const existing = s.project.schemaConfigs[schemaId]
      if (!existing?.luaScripts) return {}
      return {
        project: {
          ...s.project,
          schemaConfigs: {
            ...s.project.schemaConfigs,
            [schemaId]: {
              ...existing,
              luaScripts: existing.luaScripts.filter((sc) => sc.id !== id),
            },
          },
        },
        isDirty: true,
      }
    }),
```

- [ ] **Step 4: Run tests to verify they pass**

Run:
```bash
npx vitest run src/stores/config-store.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/stores/config-store.ts src/stores/config-store.test.ts
git commit -m "feat(store): add Lua script CRUD actions"
```

---

## Phase 4: YAML Integration

### Task 11: Merge `special-input` into `lua-extensions` in module-yaml key mapping

**Files:**
- Modify: `src/lib/yaml/module-yaml.ts`
- Modify: `src/lib/yaml/module-yaml.test.ts`

- [ ] **Step 1: Inspect existing tests**

Read `src/lib/yaml/module-yaml.test.ts` to understand test patterns. Check if there are existing tests referencing `special-input` or `lua-extensions` modules. Note any that need updating.

- [ ] **Step 2: Update MODULE_KEY_MAP**

In `src/lib/yaml/module-yaml.ts`, find the `MODULE_KEY_MAP` constant (around line 21). Locate:

```typescript
  'special-input': { file: 'schema', keys: ['recognizer'] },
  'lua-extensions': { file: 'schema', keys: ['super_comment', 'super_processor', 'user_predict', 'super_replacer', 'input_statistics'] },
```

Replace with a single merged entry:

```typescript
  'lua-extensions': {
    file: 'schema',
    keys: [
      // From original special-input
      'recognizer',
      // From original lua-extensions
      'super_comment',
      'super_processor',
      'user_predict',
      'super_replacer',
      'input_statistics',
    ],
  },
```

- [ ] **Step 3: Update any existing tests that reference `special-input` module ID**

In `src/lib/yaml/module-yaml.test.ts`, find any occurrences of `'special-input'` as a module ID in `extractModuleYaml`/`applyModuleYaml` test calls. Replace each with `'lua-extensions'`. If tests assert separate content for the two modules, merge them into a single test that verifies the merged module produces YAML containing both `recognizer` and `super_comment` (etc.) keys when the config has both.

- [ ] **Step 4: Run tests to verify no regressions**

Run:
```bash
npx vitest run src/lib/yaml/module-yaml.test.ts
```

Expected: all tests pass (with updated module IDs).

- [ ] **Step 5: Commit**

```bash
git add src/lib/yaml/module-yaml.ts src/lib/yaml/module-yaml.test.ts
git commit -m "refactor(yaml): merge special-input into lua-extensions module key map"
```

---

### Task 12: Parser — extract customTriggers and luaScripts from YAML

**Files:**
- Modify: `src/lib/yaml/parser.ts`
- Modify: `src/lib/yaml/parser.test.ts`

- [ ] **Step 1: Inspect parser.ts structure**

Read `src/lib/yaml/parser.ts` to understand how `mapToSchemaConfig` works. Locate the function that produces `specialInput` and `luaExtensions` from raw YAML. Note the patterns used for `recognizer` patch parsing.

- [ ] **Step 2: Write failing tests**

Append to `src/lib/yaml/parser.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { mapToSchemaConfig } from './parser'

describe('mapToSchemaConfig — custom triggers and Lua scripts', () => {
  it('extracts customTriggers from recognizer patterns not matching presets', () => {
    const yaml = {
      schema_id: 'test',
      'recognizer/patterns/custom_ip_query': '^/ip$',
      engine: {
        translators: [
          'script_translator@translator',
          'lua_translator@date_translator',
          'lua_translator@custom_ip_query',
        ],
      },
    }
    const cfg = mapToSchemaConfig('test', yaml)
    expect(cfg.specialInput?.customTriggers).toHaveLength(1)
    expect(cfg.specialInput?.customTriggers?.[0]?.triggerCode).toBe('/ip')
  })

  it('returns empty customTriggers when only preset triggers present', () => {
    const yaml = {
      schema_id: 'test',
      'recognizer/patterns/date': '^/rq$',
      engine: {
        translators: ['lua_translator@date_translator'],
      },
    }
    const cfg = mapToSchemaConfig('test', yaml)
    expect(cfg.specialInput?.customTriggers ?? []).toHaveLength(0)
  })

  it('does not populate luaScripts from YAML alone', () => {
    // Lua script contents come from separate .lua files.
    // Parser sees only YAML references; the luaScripts list starts empty
    // until .lua file contents are merged in at the import layer.
    const yaml = {
      schema_id: 'test',
      engine: { translators: ['lua_translator@my_custom'] },
    }
    const cfg = mapToSchemaConfig('test', yaml)
    expect(cfg.luaScripts ?? []).toHaveLength(0)
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run:
```bash
npx vitest run src/lib/yaml/parser.test.ts
```

Expected: New tests fail because the parser doesn't yet extract `customTriggers`.

- [ ] **Step 4: Implement custom trigger extraction in parser.ts**

In `src/lib/yaml/parser.ts`, import the new types if not already:

```typescript
import type { ..., CustomTrigger } from '@/types/config'
```

(Add `CustomTrigger` to the existing type imports.)

Find `mapToSchemaConfig` and locate where `specialInput` is constructed. Add logic to parse `recognizer/patterns/...` entries that aren't in the preset list. The set of preset trigger IDs is imported from `@/data/special-trigger-definitions`:

```typescript
import { SPECIAL_TRIGGER_DEFINITIONS } from '@/data/special-trigger-definitions'
```

Then inside `mapToSchemaConfig` (or a helper it calls), after computing `enabledTriggers`, add:

```typescript
// Extract custom triggers from recognizer/patterns entries whose key is not a preset
const presetIds = new Set(SPECIAL_TRIGGER_DEFINITIONS.map((d) => d.id))
const customTriggers: CustomTrigger[] = []

for (const [key, value] of Object.entries(yaml)) {
  const match = key.match(/^recognizer\/patterns\/(.+)$/)
  if (!match) continue
  const patternId = match[1]!
  if (presetIds.has(patternId)) continue
  if (typeof value !== 'string') continue

  // Extract the trigger code from the regex pattern (strip ^ and $)
  const triggerCode = value.replace(/^\^/, '').replace(/\$$/, '')

  customTriggers.push({
    id: crypto.randomUUID(),
    name: patternId,                // User can edit the name later
    triggerCode,
    description: '',
    scriptId: '',                   // Will be linked when matching Lua script is imported
  })
}
```

Then ensure the returned `specialInput` has `customTriggers` populated:

```typescript
specialInput: {
  enabledTriggers,
  customTriggers,
},
```

And add `luaScripts: []` to the returned config (scripts populated elsewhere from `.lua` files).

- [ ] **Step 5: Run tests to verify they pass**

Run:
```bash
npx vitest run src/lib/yaml/parser.test.ts
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/yaml/parser.ts src/lib/yaml/parser.test.ts
git commit -m "feat(yaml): parse custom trigger recognizer patterns"
```

---

### Task 13: Serializer — emit customTriggers and luaScript references to YAML

**Files:**
- Modify: `src/lib/yaml/serializer.ts`
- Modify: `src/lib/yaml/serializer.test.ts`

- [ ] **Step 1: Inspect serializer.ts structure**

Read `src/lib/yaml/serializer.ts`. Find `serializeSchemaConfig` and note how it builds the patch object and handles `specialInput`.

- [ ] **Step 2: Write failing tests**

Append to `src/lib/yaml/serializer.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { serializeSchemaConfig } from './serializer'
import type { SchemaConfig } from '@/types/config'

describe('serializeSchemaConfig — custom triggers and lua scripts', () => {
  it('emits recognizer patterns for custom triggers', () => {
    const cfg: SchemaConfig = {
      schemaId: 'test',
      fuzzyRules: [],
      specialInput: {
        enabledTriggers: [],
        customTriggers: [{
          id: 'uuid-1',
          name: 'IP 查询',
          triggerCode: '/ip',
          description: '',
          scriptId: 'script-1',
        }],
      },
      luaScripts: [{
        id: 'script-1',
        fileName: 'ip_query.lua',
        scriptType: 'translator',
        description: '',
        code: '-- lua',
      }],
    }
    const out = serializeSchemaConfig(cfg)
    // Recognizer pattern key must be present
    const recognizerKey = Object.keys(out).find((k) =>
      k.startsWith('recognizer/patterns/') && k.endsWith('ip_query'),
    )
    expect(recognizerKey).toBeDefined()
    expect(out[recognizerKey!]).toBe('^/ip$')
  })

  it('emits lua_translator registration under engine/translators/+', () => {
    const cfg: SchemaConfig = {
      schemaId: 'test',
      fuzzyRules: [],
      luaScripts: [{
        id: 'script-1',
        fileName: 'my_t.lua',
        scriptType: 'translator',
        description: '',
        code: '',
      }],
    }
    const out = serializeSchemaConfig(cfg)
    const translatorsKey = Object.keys(out).find((k) => k.startsWith('engine/translators'))
    expect(translatorsKey).toBeDefined()
    const list = out[translatorsKey!] as string[]
    expect(list).toContain('lua_translator@my_t')
  })

  it('uses the correct engine key per script type', () => {
    const cfg: SchemaConfig = {
      schemaId: 'test',
      fuzzyRules: [],
      luaScripts: [
        { id: '1', fileName: 't.lua', scriptType: 'translator', description: '', code: '' },
        { id: '2', fileName: 'f.lua', scriptType: 'filter', description: '', code: '' },
        { id: '3', fileName: 'p.lua', scriptType: 'processor', description: '', code: '' },
      ],
    }
    const out = serializeSchemaConfig(cfg)
    const keys = Object.keys(out)
    expect(keys.some((k) => k.startsWith('engine/translators') && (out[k] as string[]).includes('lua_translator@t'))).toBe(true)
    expect(keys.some((k) => k.startsWith('engine/filters') && (out[k] as string[]).includes('lua_filter@f'))).toBe(true)
    expect(keys.some((k) => k.startsWith('engine/processors') && (out[k] as string[]).includes('lua_processor@p'))).toBe(true)
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run:
```bash
npx vitest run src/lib/yaml/serializer.test.ts
```

Expected: 3 new tests fail.

- [ ] **Step 4: Implement the serializer changes**

In `src/lib/yaml/serializer.ts`, locate `serializeSchemaConfig`. After the existing `specialInput` handling and `luaExtensions` handling, add custom trigger and lua script emission. Pseudocode structure (adapt to the actual function shape):

```typescript
// ... existing serialization ...

// Emit recognizer patterns for custom triggers
if (config.specialInput?.customTriggers) {
  for (const trigger of config.specialInput.customTriggers) {
    // Use the fileName root (without .lua) of the linked script as the pattern ID,
    // or the trigger.id as fallback when no script link exists yet.
    const script = config.luaScripts?.find((s) => s.id === trigger.scriptId)
    const patternId = script
      ? script.fileName.replace(/\.lua$/, '')
      : trigger.id
    // Regex: anchor both ends; escape regex specials in triggerCode if needed.
    patch[`recognizer/patterns/${patternId}`] = `^${escapeRegExp(trigger.triggerCode)}$`
  }
}

// Emit lua module registrations for custom scripts
if (config.luaScripts && config.luaScripts.length > 0) {
  const translators: string[] = []
  const filters: string[] = []
  const processors: string[] = []

  for (const script of config.luaScripts) {
    const identifier = script.fileName.replace(/\.lua$/, '')
    switch (script.scriptType) {
      case 'translator':
        translators.push(`lua_translator@${identifier}`)
        break
      case 'filter':
        filters.push(`lua_filter@${identifier}`)
        break
      case 'processor':
        processors.push(`lua_processor@${identifier}`)
        break
    }
  }

  if (translators.length > 0) patch['engine/translators/+'] = translators
  if (filters.length > 0) patch['engine/filters/+'] = filters
  if (processors.length > 0) patch['engine/processors/+'] = processors
}
```

Add a helper at the top of the file if `escapeRegExp` does not already exist:

```typescript
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run:
```bash
npx vitest run src/lib/yaml/serializer.test.ts
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/yaml/serializer.ts src/lib/yaml/serializer.test.ts
git commit -m "feat(yaml): serialize custom triggers and Lua script registrations"
```

---

## Phase 5: Tab Components

### Task 14: Extract existing Lua Extensions content into `BuiltinEnhancementsTab`

**Files:**
- Create: `src/features/editor/modules/lua/BuiltinEnhancementsTab.tsx`

- [ ] **Step 1: Copy existing content into new file**

Create `src/features/editor/modules/lua/BuiltinEnhancementsTab.tsx`. Copy the entire body of the current `src/features/editor/modules/LuaExtensions.tsx` into this file but rename the exported function. Open the current `LuaExtensions.tsx` and mirror the body (minus the top wrapping `<div>` that contains the header with `<h3>Lua 扩展</h3>` — the new 3-Tab container will own that header):

```typescript
import { useConfigStore } from '@/stores/config-store'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { SettingHelp } from '@/components/shared/SettingHelp'
import type { LuaExtensionsConfig } from '@/types/config'

const DEFAULT_CONFIG: LuaExtensionsConfig = {
  superComment: { candidateLength: 2, correctorType: '〔纠错〕' },
  superProcessor: { backspaceLimit: true, segLoop: true, toneFallback: true, limitRepeated: '8,40' },
  userPredict: { maxCandidates: 10, expiryDays: 90, activationDays: 7 },
  superReplacer: { chain: true, delimiter: '|' },
  inputStatistics: { enabled: true },
}

export function BuiltinEnhancementsTab() {
  const schemaList = useConfigStore((s) => s.project.defaultConfig.schemaList)
  const schemaConfigs = useConfigStore((s) => s.project.schemaConfigs)
  const updateSchemaConfig = useConfigStore((s) => s.updateSchemaConfig)

  const primarySchemaId = schemaList[0]?.schema ?? ''
  const config = schemaConfigs[primarySchemaId]?.luaExtensions ?? DEFAULT_CONFIG

  function update(partial: Partial<LuaExtensionsConfig>) {
    updateSchemaConfig(primarySchemaId, { luaExtensions: { ...config, ...partial } })
  }

  if (!primarySchemaId) {
    return <div className="text-gray-500">请先在「输入方案管理」中添加至少一个方案。</div>
  }

  return (
    <div className="space-y-6">
      {/* 超级注释 */}
      <div className="rounded-lg border p-5 space-y-4">
        {/* ... identical content to current LuaExtensions.tsx cards ... */}
      </div>
      {/* ... all 5 cards: superComment, superProcessor, superReplacer, userPredict, inputStatistics ... */}
    </div>
  )
}
```

For brevity, the full body is not repeated here. Execute the following: **open** `src/features/editor/modules/LuaExtensions.tsx`, **copy lines 44-238** (the 5 section cards), and paste them inside the `<div className="space-y-6">` of the new `BuiltinEnhancementsTab` function. Remove the outer header `<div>` (lines 36-42) since the parent container will provide it.

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors. (The old `LuaExtensions.tsx` still exists and works — we'll replace it in Task 19.)

- [ ] **Step 3: Commit**

```bash
git add src/features/editor/modules/lua/BuiltinEnhancementsTab.tsx
git commit -m "feat(editor): extract builtin enhancements into BuiltinEnhancementsTab"
```

---

### Task 15: Create `SpecialInputTab` with preset section

**Files:**
- Create: `src/features/editor/modules/lua/SpecialInputTab.tsx`

- [ ] **Step 1: Create the SpecialInputTab component with preset triggers**

Create `src/features/editor/modules/lua/SpecialInputTab.tsx`:

```typescript
import { useConfigStore } from '@/stores/config-store'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { SettingHelp } from '@/components/shared/SettingHelp'
import { SPECIAL_TRIGGER_DEFINITIONS, TRIGGER_CATEGORIES } from '@/data/special-trigger-definitions'
import type { SpecialInputConfig, SpecialTrigger } from '@/types/config'
import { CustomTriggerList } from './CustomTriggerList'

export function SpecialInputTab() {
  const schemaList = useConfigStore((s) => s.project.defaultConfig.schemaList)
  const schemaConfigs = useConfigStore((s) => s.project.schemaConfigs)
  const updateSchemaConfig = useConfigStore((s) => s.updateSchemaConfig)

  const primarySchemaId = schemaList[0]?.schema ?? ''
  const config: SpecialInputConfig = schemaConfigs[primarySchemaId]?.specialInput ?? {
    enabledTriggers: SPECIAL_TRIGGER_DEFINITIONS.map((d) => ({
      id: d.id, enabled: true, triggerCode: d.defaultCode,
    })),
    customTriggers: [],
  }

  function getTrigger(id: string): SpecialTrigger {
    const def = SPECIAL_TRIGGER_DEFINITIONS.find((d) => d.id === id)!
    return config.enabledTriggers.find((t) => t.id === id)
      ?? { id, enabled: true, triggerCode: def.defaultCode }
  }

  function updateTrigger(id: string, partial: Partial<SpecialTrigger>) {
    const triggers = config.enabledTriggers.map((t) => t.id === id ? { ...t, ...partial } : t)
    if (!triggers.find((t) => t.id === id)) {
      const def = SPECIAL_TRIGGER_DEFINITIONS.find((d) => d.id === id)!
      triggers.push({ id, enabled: true, triggerCode: def.defaultCode, ...partial })
    }
    updateSchemaConfig(primarySchemaId, {
      specialInput: {
        enabledTriggers: triggers,
        customTriggers: config.customTriggers,
      },
    })
  }

  if (!primarySchemaId) {
    return <div className="text-gray-500">请先在「输入方案管理」中添加至少一个方案。</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-2 text-sm text-gray-500">
        <p>管理日期、时间、计算器等预设触发器，以及你自定义的 Lua 触发器。</p>
        <SettingHelp>
          <p>预设触发器是万象拼音内置的特殊输入功能，由 Lua 脚本实现。</p>
          <p>自定义触发器需要你在「自定义脚本」Tab 先创建 Lua 脚本，然后在此添加触发码与脚本的关联。</p>
        </SettingHelp>
      </div>

      {/* Preset trigger groups */}
      {TRIGGER_CATEGORIES.map((cat) => {
        const defs = SPECIAL_TRIGGER_DEFINITIONS.filter((d) => d.category === cat.id)
        return (
          <div key={cat.id}>
            <h4 className="mb-2 flex items-center gap-2 font-medium text-gray-700 dark:text-slate-300">
              {cat.label}
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">内置</Badge>
            </h4>
            <div className="space-y-2">
              {defs.map((def) => {
                const trigger = getTrigger(def.id)
                return (
                  <div key={def.id} className="flex items-center gap-3">
                    <Switch
                      checked={trigger.enabled}
                      onCheckedChange={(v) => updateTrigger(def.id, { enabled: v })}
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium">{def.label}</span>
                      <span className="ml-2 text-xs text-gray-400">{def.description}</span>
                    </div>
                    <Input
                      className="w-20 text-center text-sm"
                      value={trigger.triggerCode}
                      onChange={(e) => updateTrigger(def.id, { triggerCode: e.target.value })}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Custom triggers section */}
      <div>
        <h4 className="mb-2 flex items-center gap-2 font-medium text-gray-700 dark:text-slate-300">
          自定义触发器
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">用户</Badge>
        </h4>
        <CustomTriggerList schemaId={primarySchemaId} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles (CustomTriggerList not yet created — allow error)**

Run:
```bash
npx tsc --noEmit
```

Expected: Error about missing `./CustomTriggerList` — fine, will be fixed in Task 16.

- [ ] **Step 3: Commit**

```bash
git add src/features/editor/modules/lua/SpecialInputTab.tsx
git commit -m "feat(editor): create SpecialInputTab with preset triggers"
```

---

### Task 16: Create `CustomTriggerForm` dialog and `CustomTriggerList`

**Files:**
- Create: `src/features/editor/modules/lua/CustomTriggerForm.tsx`
- Create: `src/features/editor/modules/lua/CustomTriggerList.tsx`

- [ ] **Step 1: Create the form dialog**

Create `src/features/editor/modules/lua/CustomTriggerForm.tsx`:

```typescript
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { CustomTrigger, LuaScript } from '@/types/config'

interface CustomTriggerFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  scripts: LuaScript[]
  initial?: CustomTrigger
  onSubmit: (data: Omit<CustomTrigger, 'id'>) => void
}

export function CustomTriggerForm({
  open,
  onOpenChange,
  scripts,
  initial,
  onSubmit,
}: CustomTriggerFormProps) {
  const [name, setName] = useState('')
  const [triggerCode, setTriggerCode] = useState('')
  const [description, setDescription] = useState('')
  const [scriptId, setScriptId] = useState('')

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? '')
      setTriggerCode(initial?.triggerCode ?? '')
      setDescription(initial?.description ?? '')
      setScriptId(initial?.scriptId ?? '')
    }
  }, [open, initial])

  const canSubmit = name.trim().length > 0 && triggerCode.trim().length > 0 && scriptId.length > 0

  function handleSubmit() {
    if (!canSubmit) return
    onSubmit({
      name: name.trim(),
      triggerCode: triggerCode.trim(),
      description: description.trim(),
      scriptId,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? '编辑自定义触发器' : '添加自定义触发器'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="ct-name">名称</Label>
            <Input
              id="ct-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如：IP 地址查询"
            />
          </div>
          <div>
            <Label htmlFor="ct-code">触发码</Label>
            <Input
              id="ct-code"
              value={triggerCode}
              onChange={(e) => setTriggerCode(e.target.value)}
              placeholder="如：/ip"
            />
            <p className="mt-1 text-xs text-gray-500">用户输入此编码时将调用关联的 Lua 脚本。</p>
          </div>
          <div>
            <Label htmlFor="ct-desc">描述（可选）</Label>
            <Input
              id="ct-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="这个触发器的用途"
            />
          </div>
          <div>
            <Label>关联 Lua 脚本</Label>
            {scripts.length === 0 ? (
              <p className="mt-1 text-xs text-orange-600 dark:text-orange-400">
                尚未创建 Lua 脚本。请先在「自定义脚本」Tab 创建一个 Translator 类型的脚本。
              </p>
            ) : (
              <Select value={scriptId} onValueChange={setScriptId}>
                <SelectTrigger>
                  <SelectValue placeholder="选择一个脚本" />
                </SelectTrigger>
                <SelectContent>
                  {scripts
                    .filter((s) => s.scriptType === 'translator')
                    .map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.fileName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button disabled={!canSubmit} onClick={handleSubmit}>
            {initial ? '保存' : '添加'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Create the list component**

Create `src/features/editor/modules/lua/CustomTriggerList.tsx`:

```typescript
import { useState } from 'react'
import { useConfigStore } from '@/stores/config-store'
import { Button } from '@/components/ui/button'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { CustomTriggerForm } from './CustomTriggerForm'
import type { CustomTrigger } from '@/types/config'

interface CustomTriggerListProps {
  schemaId: string
}

export function CustomTriggerList({ schemaId }: CustomTriggerListProps) {
  const schemaConfigs = useConfigStore((s) => s.project.schemaConfigs)
  const addCustomTrigger = useConfigStore((s) => s.addCustomTrigger)
  const updateCustomTrigger = useConfigStore((s) => s.updateCustomTrigger)
  const deleteCustomTrigger = useConfigStore((s) => s.deleteCustomTrigger)

  const triggers = schemaConfigs[schemaId]?.specialInput?.customTriggers ?? []
  const scripts = schemaConfigs[schemaId]?.luaScripts ?? []

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<CustomTrigger | undefined>(undefined)

  function handleAdd() {
    setEditing(undefined)
    setFormOpen(true)
  }

  function handleEdit(trigger: CustomTrigger) {
    setEditing(trigger)
    setFormOpen(true)
  }

  function handleSubmit(data: Omit<CustomTrigger, 'id'>) {
    if (editing) {
      updateCustomTrigger(schemaId, editing.id, data)
    } else {
      addCustomTrigger(schemaId, data)
    }
  }

  function handleDelete(id: string) {
    if (window.confirm('确定删除此自定义触发器吗？')) {
      deleteCustomTrigger(schemaId, id)
    }
  }

  return (
    <div className="space-y-2">
      {triggers.length === 0 ? (
        <p className="text-xs text-gray-400">尚未添加自定义触发器。</p>
      ) : (
        <div className="space-y-1">
          {triggers.map((trigger) => {
            const script = scripts.find((s) => s.id === trigger.scriptId)
            return (
              <div
                key={trigger.id}
                className="flex items-center gap-3 rounded border border-gray-200 p-2 dark:border-slate-700"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{trigger.name}</span>
                    <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-700 dark:bg-slate-800 dark:text-slate-200">
                      {trigger.triggerCode}
                    </code>
                  </div>
                  <div className="mt-0.5 text-xs text-gray-500">
                    {script ? `→ ${script.fileName}` : '⚠ 未关联脚本'}
                    {trigger.description && ` · ${trigger.description}`}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(trigger)}>
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(trigger.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                </Button>
              </div>
            )
          })}
        </div>
      )}
      <Button variant="outline" size="sm" onClick={handleAdd}>
        <Plus className="mr-1 h-3.5 w-3.5" />
        添加自定义触发器
      </Button>
      <CustomTriggerForm
        open={formOpen}
        onOpenChange={setFormOpen}
        scripts={scripts}
        initial={editing}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors related to these new files. (The `lua-extensions` module container still compiles because old `LuaExtensions.tsx` is unchanged.)

- [ ] **Step 4: Commit**

```bash
git add src/features/editor/modules/lua/CustomTriggerForm.tsx src/features/editor/modules/lua/CustomTriggerList.tsx
git commit -m "feat(editor): add custom trigger form dialog and list"
```

---

### Task 17: Create `LuaCodeEditor` (CodeMirror wrapper)

**Files:**
- Create: `src/features/editor/modules/lua/LuaCodeEditor.tsx`

- [ ] **Step 1: Create the editor component with lazy CodeMirror loading**

Create `src/features/editor/modules/lua/LuaCodeEditor.tsx`:

```typescript
import { lazy, Suspense, useMemo } from 'react'

// Lazy-load CodeMirror so the editor's JS only loads when users open this tab.
const CodeMirror = lazy(() => import('@uiw/react-codemirror'))

interface LuaCodeEditorProps {
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
  height?: string
}

export function LuaCodeEditor({ value, onChange, readOnly = false, height = '400px' }: LuaCodeEditorProps) {
  // Lua extension is imported dynamically inside a lazy block.
  const LazyEditor = useMemo(
    () =>
      lazy(async () => {
        const [{ default: CM }, { lua }, { oneDark }] = await Promise.all([
          import('@uiw/react-codemirror'),
          import('@codemirror/lang-lua'),
          import('@codemirror/theme-one-dark'),
        ])
        return {
          default: (innerProps: {
            value: string
            onChange: (v: string) => void
            readOnly?: boolean
            height?: string
          }) => (
            <CM
              value={innerProps.value}
              height={innerProps.height}
              extensions={[lua()]}
              theme={oneDark}
              editable={!innerProps.readOnly}
              onChange={(v) => innerProps.onChange(v)}
            />
          ),
        }
      }),
    [],
  )

  return (
    <Suspense fallback={<EditorFallback height={height} />}>
      <LazyEditor value={value} onChange={onChange} readOnly={readOnly} height={height} />
    </Suspense>
  )
}

function EditorFallback({ height }: { height: string }) {
  return (
    <div
      className="flex items-center justify-center rounded border border-slate-700 bg-slate-900 text-sm text-slate-400"
      style={{ height }}
    >
      加载代码编辑器...
    </div>
  )
}
```

Note: `CodeMirror` at the top is unused since we use the inner lazy memo; if TypeScript complains, remove the top `const CodeMirror = lazy(...)` line and keep only the `LazyEditor` memo.

- [ ] **Step 2: Simplify — remove unused top-level lazy**

Replace the top `const CodeMirror = lazy(() => import('@uiw/react-codemirror'))` line with nothing (delete it). The single `LazyEditor` inside the component is sufficient.

The final version is:

```typescript
import { lazy, Suspense, useMemo } from 'react'

interface LuaCodeEditorProps {
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
  height?: string
}

export function LuaCodeEditor({ value, onChange, readOnly = false, height = '400px' }: LuaCodeEditorProps) {
  const LazyEditor = useMemo(
    () =>
      lazy(async () => {
        const [{ default: CM }, { lua }, { oneDark }] = await Promise.all([
          import('@uiw/react-codemirror'),
          import('@codemirror/lang-lua'),
          import('@codemirror/theme-one-dark'),
        ])
        return {
          default: (innerProps: {
            value: string
            onChange: (v: string) => void
            readOnly?: boolean
            height?: string
          }) => (
            <CM
              value={innerProps.value}
              height={innerProps.height}
              extensions={[lua()]}
              theme={oneDark}
              editable={!innerProps.readOnly}
              onChange={(v) => innerProps.onChange(v)}
            />
          ),
        }
      }),
    [],
  )

  return (
    <Suspense fallback={<EditorFallback height={height} />}>
      <LazyEditor value={value} onChange={onChange} readOnly={readOnly} height={height} />
    </Suspense>
  )
}

function EditorFallback({ height }: { height: string }) {
  return (
    <div
      className="flex items-center justify-center rounded border border-slate-700 bg-slate-900 text-sm text-slate-400"
      style={{ height }}
    >
      加载代码编辑器...
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors. (`@codemirror/theme-one-dark` is a sub-package of `@uiw/react-codemirror`'s dependency tree — it's already available.)

If error about `@codemirror/theme-one-dark` missing, install it:
```bash
npm install @codemirror/theme-one-dark
```

- [ ] **Step 4: Commit**

```bash
git add src/features/editor/modules/lua/LuaCodeEditor.tsx package.json package-lock.json
git commit -m "feat(editor): add lazy-loaded LuaCodeEditor wrapping CodeMirror"
```

---

### Task 18: Create `LuaScriptList`, `LuaScriptYamlPreview`, and `CustomScriptsTab`

**Files:**
- Create: `src/features/editor/modules/lua/LuaScriptYamlPreview.tsx`
- Create: `src/features/editor/modules/lua/LuaScriptList.tsx`
- Create: `src/features/editor/modules/lua/CustomScriptsTab.tsx`

- [ ] **Step 1: Create the YAML preview sub-component**

Create `src/features/editor/modules/lua/LuaScriptYamlPreview.tsx`:

```typescript
import type { LuaScript } from '@/types/config'

interface LuaScriptYamlPreviewProps {
  script: LuaScript
}

export function LuaScriptYamlPreview({ script }: LuaScriptYamlPreviewProps) {
  const identifier = script.fileName.replace(/\.lua$/, '')
  const componentKey = script.scriptType === 'translator'
    ? 'translators'
    : script.scriptType === 'filter'
      ? 'filters'
      : 'processors'
  const modulePrefix = script.scriptType === 'translator'
    ? 'lua_translator'
    : script.scriptType === 'filter'
      ? 'lua_filter'
      : 'lua_processor'

  const yaml = `patch:
  engine/${componentKey}/+:
    - ${modulePrefix}@${identifier}`

  return (
    <div className="mt-3 rounded border border-gray-200 bg-gray-50 p-3 dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-1 text-xs font-medium text-gray-600 dark:text-slate-400">
        自动生成的 YAML patch（保存时合并到 schema）
      </div>
      <pre className="overflow-x-auto text-xs leading-relaxed text-gray-700 dark:text-slate-300">
        <code>{yaml}</code>
      </pre>
    </div>
  )
}
```

- [ ] **Step 2: Create the script list with create/edit/delete**

Create `src/features/editor/modules/lua/LuaScriptList.tsx`:

```typescript
import { useState } from 'react'
import { useConfigStore } from '@/stores/config-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'
import { LuaCodeEditor } from './LuaCodeEditor'
import { LuaScriptYamlPreview } from './LuaScriptYamlPreview'
import { renderLuaTemplate } from '@/data/lua-script-templates'
import type { LuaScript } from '@/types/config'

interface LuaScriptListProps {
  schemaId: string
}

export function LuaScriptList({ schemaId }: LuaScriptListProps) {
  const scripts = useConfigStore((s) => s.project.schemaConfigs[schemaId]?.luaScripts ?? [])
  const addLuaScript = useConfigStore((s) => s.addLuaScript)
  const updateLuaScript = useConfigStore((s) => s.updateLuaScript)
  const deleteLuaScript = useConfigStore((s) => s.deleteLuaScript)

  const [selectedId, setSelectedId] = useState<string | null>(scripts[0]?.id ?? null)
  const selected = scripts.find((s) => s.id === selectedId) ?? null

  function handleCreate(type: LuaScript['scriptType']) {
    const identifier = `my_${type}`
    addLuaScript(schemaId, {
      fileName: `${identifier}.lua`,
      scriptType: type,
      description: '',
      code: renderLuaTemplate(type, identifier),
    })
    // Select the newly added script on next render
    setTimeout(() => {
      const updated = useConfigStore.getState().project.schemaConfigs[schemaId]?.luaScripts ?? []
      const last = updated[updated.length - 1]
      if (last) setSelectedId(last.id)
    }, 0)
  }

  function handleDelete(id: string) {
    if (window.confirm('确定删除此脚本吗？关联的自定义触发器将失效。')) {
      deleteLuaScript(schemaId, id)
      if (selectedId === id) setSelectedId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">新建脚本：</span>
        <Button variant="outline" size="sm" onClick={() => handleCreate('translator')}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          Translator
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleCreate('filter')}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          Filter
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleCreate('processor')}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          Processor
        </Button>
      </div>

      {scripts.length === 0 ? (
        <p className="text-sm text-gray-500">
          尚未创建任何 Lua 脚本。点击上方按钮以某个类型的模板开始。
        </p>
      ) : (
        <>
          <div className="space-y-1">
            {scripts.map((script) => (
              <div
                key={script.id}
                className={`flex cursor-pointer items-center gap-3 rounded border p-2 ${
                  selectedId === script.id
                    ? 'border-blue-400 bg-blue-50 dark:border-blue-600 dark:bg-blue-950/30'
                    : 'border-gray-200 dark:border-slate-700'
                }`}
                onClick={() => setSelectedId(script.id)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{script.fileName}</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {script.scriptType}
                    </Badge>
                  </div>
                  {script.description && (
                    <div className="mt-0.5 text-xs text-gray-500">{script.description}</div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(script.id)
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                </Button>
              </div>
            ))}
          </div>

          {selected && (
            <div className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="ls-filename">文件名</Label>
                  <Input
                    id="ls-filename"
                    value={selected.fileName}
                    onChange={(e) => {
                      const v = e.target.value
                      // Accept only letters, digits, underscore, hyphen, and the .lua suffix
                      if (!/^[a-zA-Z0-9_-]*\.?l?u?a?$/.test(v)) return
                      updateLuaScript(schemaId, selected.id, { fileName: v })
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="ls-type">类型</Label>
                  <Select
                    value={selected.scriptType}
                    onValueChange={(v) =>
                      updateLuaScript(schemaId, selected.id, {
                        scriptType: v as LuaScript['scriptType'],
                      })
                    }
                  >
                    <SelectTrigger id="ls-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="translator">Translator</SelectItem>
                      <SelectItem value="filter">Filter</SelectItem>
                      <SelectItem value="processor">Processor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="ls-desc">描述</Label>
                <Input
                  id="ls-desc"
                  value={selected.description}
                  onChange={(e) =>
                    updateLuaScript(schemaId, selected.id, { description: e.target.value })
                  }
                  placeholder="这个脚本的用途"
                />
              </div>
              <div>
                <Label>代码</Label>
                <div className="mt-1">
                  <LuaCodeEditor
                    value={selected.code}
                    onChange={(code) => updateLuaScript(schemaId, selected.id, { code })}
                    height="400px"
                  />
                </div>
              </div>
              <LuaScriptYamlPreview script={selected} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create the Tab 3 container**

Create `src/features/editor/modules/lua/CustomScriptsTab.tsx`:

```typescript
import { useConfigStore } from '@/stores/config-store'
import { SettingHelp } from '@/components/shared/SettingHelp'
import { LuaScriptList } from './LuaScriptList'

export function CustomScriptsTab() {
  const schemaList = useConfigStore((s) => s.project.defaultConfig.schemaList)
  const primarySchemaId = schemaList[0]?.schema ?? ''

  if (!primarySchemaId) {
    return <div className="text-gray-500">请先在「输入方案管理」中添加至少一个方案。</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 text-sm text-gray-500">
        <p>管理你的自定义 Lua 脚本。可以编写 Translator、Filter、Processor 三种类型的脚本。</p>
        <SettingHelp>
          <p>Translator：将特定输入映射为候选词。写完后可在「特殊输入」Tab 关联触发码使用。</p>
          <p>Filter：对已有候选词进行过滤、排序或修改。</p>
          <p>Processor：拦截按键事件，适合实现快捷键或输入流程增强。</p>
          <p>代码编辑器不做语义校验。脚本错误会在 RIME 部署时暴露。</p>
        </SettingHelp>
      </div>
      <LuaScriptList schemaId={primarySchemaId} />
    </div>
  )
}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/features/editor/modules/lua/LuaScriptYamlPreview.tsx src/features/editor/modules/lua/LuaScriptList.tsx src/features/editor/modules/lua/CustomScriptsTab.tsx
git commit -m "feat(editor): add Lua script list, editor, and YAML preview for Tab 3"
```

---

## Phase 6: Container Rewrite

### Task 19: Rewrite `LuaExtensions.tsx` as 3-Tab container

**Files:**
- Modify: `src/features/editor/modules/LuaExtensions.tsx` (complete rewrite)

- [ ] **Step 1: Replace the entire file**

Replace `src/features/editor/modules/LuaExtensions.tsx` with:

```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LearnMoreLink } from '@/components/shared/LearnMoreLink'
import { SpecialInputTab } from './lua/SpecialInputTab'
import { BuiltinEnhancementsTab } from './lua/BuiltinEnhancementsTab'
import { CustomScriptsTab } from './lua/CustomScriptsTab'

export function LuaExtensions() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Lua 扩展</h3>
          <LearnMoreLink module="lua-extensions" />
        </div>
        <p className="mt-1 text-sm text-gray-500">
          管理特殊输入触发器、内置 Lua 功能增强，以及自定义 Lua 脚本。
        </p>
      </div>

      <Tabs defaultValue="special-input" className="w-full">
        <TabsList>
          <TabsTrigger value="special-input">特殊输入</TabsTrigger>
          <TabsTrigger value="builtin">内置功能增强</TabsTrigger>
          <TabsTrigger value="custom-scripts">自定义脚本</TabsTrigger>
        </TabsList>

        <TabsContent value="special-input" className="mt-6">
          <SpecialInputTab />
        </TabsContent>

        <TabsContent value="builtin" className="mt-6">
          <BuiltinEnhancementsTab />
        </TabsContent>

        <TabsContent value="custom-scripts" className="mt-6">
          <CustomScriptsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Run all tests**

Run:
```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/features/editor/modules/LuaExtensions.tsx
git commit -m "refactor(editor): rewrite LuaExtensions as 3-Tab container"
```

---

### Task 20: Remove old `SpecialInput.tsx` and update module registry

**Files:**
- Delete: `src/features/editor/modules/SpecialInput.tsx`
- Modify: `src/data/module-registry.ts`

- [ ] **Step 1: Delete the obsolete file**

Run:
```bash
rm src/features/editor/modules/SpecialInput.tsx
```

- [ ] **Step 2: Remove from module registry**

In `src/data/module-registry.ts`, find and delete the entire `special-input` module entry in `MODULE_REGISTRY`:

```typescript
  {
    id: 'special-input',
    label: '特殊输入',
    group: 'auxiliary',
    tutorialSlug: 'special-input',
    applicability: { type: 'capability', cap: 'special-input' },
  },
```

Then in `MODULE_COMPONENTS` (bottom of file), delete the corresponding lazy import line:

```typescript
  'special-input': lazy(() => import('@/features/editor/modules/SpecialInput').then(m => ({ default: m.SpecialInput }))),
```

- [ ] **Step 3: Update `lua-extensions` applicability to include special-input users**

In `MODULE_REGISTRY`, find the `lua-extensions` entry and make sure schemas that previously declared only `special-input` capability still see this module. The simplest fix: change applicability to check either capability.

Locate:

```typescript
  {
    id: 'lua-extensions',
    label: 'Lua 扩展',
    group: 'auxiliary',
    tutorialSlug: 'lua-extensions',
    applicability: { type: 'capability', cap: 'lua-extensions' },
  },
```

For a minimal-risk change, Task 21 will instead update `schemas-detail.json` to ensure every schema declaring `special-input` also declares `lua-extensions`. Keep the applicability on `lua-extensions` unchanged here.

- [ ] **Step 4: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Run tests**

Run:
```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/features/editor/modules/SpecialInput.tsx src/data/module-registry.ts
git commit -m "refactor(editor): remove SpecialInput module in favor of merged LuaExtensions"
```

---

## Phase 7: Migration & Cross-references

### Task 21: Migrate schema capability declarations

**Files:**
- Modify: `src/data/schemas-detail.json`

- [ ] **Step 1: Scan for schemas declaring `special-input` capability**

Use Grep (via your shell or editor) to find all occurrences of `"special-input"` inside `src/data/schemas-detail.json`:

```bash
grep -n '"special-input"' src/data/schemas-detail.json
```

Expected: A list of line numbers where `"special-input"` appears in capability arrays.

- [ ] **Step 2: For each match, ensure `"lua-extensions"` is in the same capabilities array**

Open `src/data/schemas-detail.json` and for every `capabilities` array that contains `"special-input"`:
- If the array already contains `"lua-extensions"`, leave it alone.
- If not, add `"lua-extensions"` to the array (keep `"special-input"` — it's harmless extra data, and schemas may reference it elsewhere).

Example transformation:

Before:
```json
"capabilities": ["special-input", "super-comment"]
```

After:
```json
"capabilities": ["special-input", "lua-extensions", "super-comment"]
```

- [ ] **Step 3: Verify the JSON is still valid**

Run:
```bash
node -e "JSON.parse(require('fs').readFileSync('src/data/schemas-detail.json', 'utf-8')); console.log('ok')"
```

Expected: prints `ok`.

- [ ] **Step 4: Run tests**

Run:
```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/data/schemas-detail.json
git commit -m "data: ensure schemas with special-input capability also declare lua-extensions"
```

---

### Task 22: Fix MDX cross-references from `./special-input` to `./lua-extensions`

**Files:**
- Modify: any MDX files referencing `./special-input`

- [ ] **Step 1: Find all MDX files that link to `./special-input`**

Run:
```bash
grep -l 'special-input' src/content/*.mdx
```

Expected: A list of files. Typically will include at least `reverse-lookup.mdx` and `special-input.mdx` itself (which will be deleted later).

- [ ] **Step 2: Replace references (excluding special-input.mdx)**

For each file listed (except `src/content/special-input.mdx` — that file will be deleted in Task 24):

1. Open the file.
2. Replace every `](./special-input)` with `](./lua-extensions)`.
3. If the link text says "特殊输入", either keep it (the editor will still land on the merged module which has a 特殊输入 Tab) or update to "Lua 扩展" if the context makes more sense that way. Exercise judgment per occurrence.

- [ ] **Step 3: Verify no stale references remain (other than in special-input.mdx)**

Run:
```bash
grep -n 'special-input' src/content/*.mdx | grep -v 'special-input.mdx'
```

Expected: Empty output (no matches outside of `special-input.mdx`).

- [ ] **Step 4: Commit**

```bash
git add src/content/
git commit -m "docs(mdx): update cross-references from special-input to lua-extensions"
```

---

## Phase 8: Tutorial Content

### Task 23: Rewrite `lua-extensions.mdx` per depth guide

**Files:**
- Modify: `src/content/lua-extensions.mdx` (complete rewrite)

- [ ] **Step 1: Rewrite the file**

Replace the entire contents of `src/content/lua-extensions.mdx` with the following. This content demonstrates the depth guide's three-layer model: Layer 1 (是什么、快速上手、配置项详解), Layer 2 (原理机制、完整示例、常见场景), and Layer 3 (inside `<Details>` blocks: 进阶原理、排错、维护、社区复用):

```mdx
# Lua 扩展

**Lua 扩展** 是 RIME 引擎可编程能力的统一入口。本模块将你看到的"特殊输入功能"、"输入统计"、"候选词注释增强"等能力集中管理，并允许你编写自定义 Lua 脚本扩展输入法行为。

## 这是什么

RIME 在处理输入时会依次调用一系列组件：按键处理（Processor）、分段（Segmentor）、翻译（Translator）、过滤（Filter）。Lua 让用户可以用脚本替代或增强其中任一环节。

- **特殊输入** 触发器（如 `/rq` 日期、`V` 计算器）本质上就是 Translator 类型的 Lua 脚本
- **超级注释**、**超级替换** 等增强功能是 Filter 类型的 Lua 脚本
- **超级处理器** 是 Processor 类型的 Lua 脚本

本模块的三个 Tab 对应三类使用方式：
- **特殊输入**：开关预设触发器、添加自定义触发器
- **内置功能增强**：调整万象方案自带的 Lua 功能参数
- **自定义脚本**：编写和管理你自己的 Lua 脚本

## 快速上手

:::tip
如果你只是想使用预设的日期、时间、计算器等功能，直接在「特殊输入」Tab 确认开关状态即可。
:::

<StepGuide>
  <Step title="打开特殊输入 Tab">
    在编辑器的「Lua 扩展」模块下，默认打开的就是「特殊输入」Tab。
  </Step>
  <Step title="确认预设触发器状态">
    看到三组触发器：日期时间、工具、统计。每个触发器前面有开关，右侧是触发码。开关开启的触发器在输入时会生效。
  </Step>
  <Step title="尝试输入">
    保存并部署后，在任意输入框输入 `/rq`，应在候选词中看到今天的日期。
  </Step>
</StepGuide>

## 配置项详解

### 特殊输入 · 预设触发器

| 触发码 | 功能 | 输出示例 |
|--------|------|---------|
| `/rq` | 当前日期 | 2026年4月10日 |
| `/sj` | 当前时间 | 14:30 |
| `/xq` | 当前星期 | 星期五 |
| `/nl` | 农历日期 | 三月十一 |
| `/jq` | 当前节气 | 清明 |
| `/jr` | 近期节日 | 清明节 |
| `/tt` | Unix 时间戳 | 1775808000 |
| `V` | 计算器 | V1+2 → 3 |
| `U` | Unicode | U4e07 → 万 |
| `/rtj` | 今日输入统计 | 今日输入 1234 字 |
| `/tj` | 累计输入统计 | 累计输入 56789 字 |

每个触发器可以单独开关，也可以改触发码。改触发码时注意避免和拼音编码冲突。

### 内置功能增强

| 子系统 | 作用 | 关键参数 |
|--------|------|---------|
| 超级注释 | 为候选词添加辅助码、拼音等注释 | 注释候选长度、纠错格式 |
| 超级处理器 | 增强键盘处理（退格保护、音节循环等） | 退格限制、音节循环、声调回落 |
| 超级替换 | 对候选词自动替换 | 链式替换、分隔符 |
| 用户预测 | 基于历史智能预测下一词 | 最大候选数、过期天数、激活天数 |
| 输入统计 | 记录输入字数/词数 | 启用开关 |

### 自定义脚本

每个脚本有三个属性：
- **文件名**：Lua 文件名（仅字母、数字、下划线、连字符），系统自动加 `.lua` 后缀
- **类型**：Translator / Filter / Processor
- **描述**：用于你自己识别的备注

## 原理机制

<YamlPreview
  title="RIME engine 组件链（概念示意）"
  caption="一次输入的处理流程"
>
```
输入按键 → Processor → Segmentor → Translator → Filter → 候选词输出
```
</YamlPreview>

当你在 schema 中注册一个 Lua 组件时，RIME 会将它插入到对应的组件链：

<YamlPreview
  title="xxx.custom.yaml（注册 Lua 组件的 patch 结构）"
  caption="lua_translator 会添加到 translator 链的末尾"
>
```yaml
patch:
  engine/translators/+:
    - lua_translator@my_translator
  recognizer/patterns/my_translator: "^/hello$"
```
</YamlPreview>

- `engine/translators/+` 中的 `+` 表示"追加到现有数组"，而不是替换
- `recognizer/patterns/xxx` 定义了触发该翻译器的输入模式（正则）
- `lua_translator@my_translator` 中的 `my_translator` 必须对应 `lua/my_translator.lua` 文件，且文件返回的 Lua 函数名也应该是 `my_translator`

## 完整示例：自定义 IP 查询触发器

目标：输入 `/ip` 时弹出候选词显示本机 IP 地址。

<StepGuide>
  <Step title="创建 Lua 脚本">
    进入「自定义脚本」Tab，点击「新建脚本 → Translator」。编辑器会用模板填充代码。将文件名改为 `ip_query.lua`，代码改为：

    ```lua
    local function ip_query(input, seg, env)
      if input == "/ip" then
        -- 示例：实际项目中可通过外部命令或 RIME API 获取 IP
        local ip = "192.168.1.100"
        yield(Candidate("word", seg.start, seg._end, ip, "本机 IP"))
      end
    end

    return ip_query
    ```
  </Step>
  <Step title="添加自定义触发器">
    切回「特殊输入」Tab，滚动到页面底部的「自定义触发器」区域，点击「+ 添加自定义触发器」。
    - 名称：IP 地址查询
    - 触发码：/ip
    - 关联脚本：ip_query.lua
  </Step>
  <Step title="导出并部署">
    保存配置并用「导出」按钮下载 schema 的 YAML patch 和 Lua 脚本文件。将它们放到 RIME 用户目录，重新部署。
  </Step>
  <Step title="验证">
    在任意应用输入 `/ip`，候选词列表应显示 "192.168.1.100"。
  </Step>
</StepGuide>

## 常见场景

- **办公场景**：日期、时间、星期是最常用的预设触发器。考虑关闭不常用的农历/节气以减少候选词干扰。
- **程序员场景**：时间戳 `/tt`、计算器 `V`、Unicode `U` 都非常实用。可以自定义触发器查询 IP、生成 UUID 等。
- **写作场景**：农历、节气、节日类触发器适合写古风、纪实类文章。

<Details title="进阶：RIME 引擎的完整组件链" level="advanced">

RIME 的数据流比上文简图更复杂。完整顺序是：

1. **Schema 加载**：编译 prism（词典前缀树）、symbols 等静态资源
2. **Processor 链**：按注册顺序调用每个处理器。返回 kAccepted 则后续处理器不再执行
3. **Segmentor 链**：将已输入的编码划分为音节或其它单位
4. **Translator 链**：每个翻译器独立产生候选词列表
5. **Filter 链**：顺序修改上一步的候选列表
6. 最终候选列表呈现给用户

Lua 组件可以插入到步骤 2、4、5 的任何位置。`engine/translators/+` 中的 `+` 是追加，`engine/translators/@before xxx` 可以指定前置顺序（高级用法）。

</Details>

<Details title="排错指南：配置不生效怎么办" level="advanced">

**场景一：触发码不触发**

1. 检查「开关」是否开启
2. 检查触发码是否和其他输入冲突（比如 `/v` 可能撞到 `V` 计算器）
3. 检查 RIME 部署日志（用户目录下的 `rime.log`），搜索 `error` 或 Lua 相关报错
4. 确认 Lua 脚本文件已放到用户目录的 `lua/` 子目录
5. 确认 `xxx.custom.yaml` 中的 patch 已合并到正确位置

**场景二：Lua 脚本语法错误**

1. RIME 部署时会把错误写到日志。典型错误：
   - `attempt to call a nil value` — 函数名和 `return xxx` 的名字不一致
   - `unexpected symbol` — 语法错误，检查引号、括号匹配
2. 编辑器不做语义校验，建议在本地用 Lua 解释器先跑一遍（`lua -e 'dofile("my_translator.lua")'`）
3. 推荐配合 rime-ice 仓库的示例脚本比对你的代码

**场景三：自定义触发器 trigger 代码不起作用**

1. 检查 `recognizer/patterns/xxx` 的正则是否正确
2. 检查 schema 的其他 recognizer 是否抢先匹配了你的输入

</Details>

<Details title="注意事项与维护" level="advanced">

- **升级方案时**：更新万象拼音等方案时，你的自定义 `.lua` 文件不会被覆盖，但 `custom.yaml` 里的 patch 可能需要和新版本合并
- **多设备同步**：RIME 用户目录的 `lua/` 文件夹需要纳入同步范围。不同平台 RIME 用户目录路径不同，参考 [多设备同步](./multi-device-sync)
- **备份**：在对 Lua 脚本做较大修改前，建议用 Git 管理用户目录或至少复制一份备份
- **性能**：Lua 脚本每次输入都会被调用。避免在脚本中执行重量级操作（如同步 HTTP 请求）

</Details>

<Details title="复用社区 Lua 脚本" level="intermediate">

- [rime-ice 的 Lua 仓库](https://github.com/iDvel/rime-ice/tree/main/lua) 有许多实用脚本
- 万象拼音也自带多个 Lua 脚本，可以参考它们的实现
- 复用前请审阅代码，注意和你的 schema 的兼容性

</Details>

## 相关模块

- [反查与筛选](./reverse-lookup) — 另一种通过特殊方式输入字符的功能
- [开关与杂项](./switches) — 某些 Lua 功能的行为可以通过开关控制
- [多设备同步](./multi-device-sync) — 同步 Lua 脚本的注意事项

<ConfigSlot module="lua-extensions" />
```

- [ ] **Step 2: Verify MDX renders (visual check via dev server)**

Run:
```bash
npm run dev
```

In your browser, navigate to `/docs/lua-extensions` and scroll through the page. Verify:
- All headings render
- `<StepGuide>` shows numbered steps with connecting lines
- `<Details>` sections are collapsed by default with badges
- `<YamlPreview>` shows title, code, and caption
- Links to other modules work

Stop the dev server with Ctrl+C when done.

- [ ] **Step 3: Commit**

```bash
git add src/content/lua-extensions.mdx
git commit -m "docs: rewrite lua-extensions tutorial following content depth guide"
```

---

### Task 24: Delete `special-input.mdx`

**Files:**
- Delete: `src/content/special-input.mdx`

- [ ] **Step 1: Delete the file**

Run:
```bash
rm src/content/special-input.mdx
```

- [ ] **Step 2: Verify no imports or references remain**

Run:
```bash
grep -rn 'special-input' src/ --include="*.ts" --include="*.tsx" --include="*.mdx"
```

Expected: Only matches should be in:
- `src/data/special-trigger-definitions.ts` (the CSS class / ID `special-input` — unrelated)
- `src/data/schemas-detail.json` (capability declarations — intentional per Task 21)

If you find references in code files (e.g., `TutorialPanel.tsx` mapping slugs), remove or redirect them to `lua-extensions`.

- [ ] **Step 3: Run full build to verify no broken references**

Run:
```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/content/special-input.mdx
git commit -m "docs: remove special-input.mdx (content merged into lua-extensions.mdx)"
```

---

## Phase 9: Verification

### Task 25: Run full test suite and fix any regressions

**Files:**
- Any files with failing tests

- [ ] **Step 1: Run all tests**

Run:
```bash
npm test
```

Expected: All tests pass. If any fail:
1. Read the failure
2. Determine if it's a regression from earlier tasks or a new issue
3. Fix the root cause (not the test expectation) unless the test is clearly wrong
4. Rerun until clean

- [ ] **Step 2: If any fixes were needed, commit them**

```bash
git add <fixed files>
git commit -m "fix: address test regressions from Lua extensions refactor"
```

---

### Task 26: Build, bundle size check, and manual QA

**Files:**
- None (verification only)

- [ ] **Step 1: Run production build**

Run:
```bash
npm run build
```

Expected: Build succeeds. Note the output chunk sizes — specifically any chunk related to CodeMirror / Lua should appear as a separate async chunk (because `LuaCodeEditor` uses `lazy` + dynamic imports).

- [ ] **Step 2: Check bundle size impact**

Inspect the build output. The main bundle should NOT include CodeMirror's Lua support by default. Look for lines like `dist/assets/LuaCodeEditor-<hash>.js` or similar — that chunk should only load when visiting the "自定义脚本" Tab.

**Acceptance criteria**:
- Main JS bundle gzipped size increase: ≤ 50KB
- Lazy Lua editor chunk: ≤ 200KB gzipped

If the main bundle grew more than 50KB, investigate — likely a direct import slipped in somewhere. Common culprit: importing from `@codemirror/lang-lua` in a non-lazy file. Fix by moving to dynamic import.

- [ ] **Step 3: Manual QA walkthrough**

Run `npm run dev` and walk through these scenarios:

1. Open editor, navigate to «Lua 扩展» module — 3 Tabs should appear
2. «特殊输入» Tab:
   - All 11 preset triggers shown with toggles and trigger codes
   - Toggle one off and on — state should persist
   - Change a trigger code — should persist
   - Click «+ 添加自定义触发器» — dialog opens
   - Try to submit with empty fields — button should be disabled
3. «自定义脚本» Tab:
   - CodeMirror editor loads after a brief flash (lazy)
   - Create a Translator script — template populates
   - Edit the filename to `ip_query` — should update
   - Edit the code — should persist
   - YAML preview updates to reflect script type changes
4. Go back to «特殊输入» Tab:
   - Click «+ 添加自定义触发器» again
   - Select `ip_query.lua` from the dropdown
   - Fill name + trigger code `/ip`
   - Save — trigger appears in the list
5. «内置功能增强» Tab:
   - All 5 cards (超级注释, 超级处理器, 超级替换, 用户预测, 输入统计) render as before
   - Adjust a parameter — should persist
6. Open the tutorial panel (click «了解更多» or open `/docs/lua-extensions`):
   - Page renders with `<Details>` sections collapsed
   - Click to expand — content shows
   - `<StepGuide>` numbers are visible
   - `<YamlPreview>` shows correctly
7. Verify sidebar: old «特殊输入» module should NOT appear; only «Lua 扩展»
8. Click any link to another module (e.g., «反查与筛选») — navigation should work

- [ ] **Step 4: If any QA issues found, file as follow-up or fix immediately**

For blocking issues (crash, wrong data, obvious visual break), fix before marking Task 26 complete. For cosmetic issues (spacing, color), log them as a TODO list in a new file `docs/superpowers/followups/2026-04-10-batch-1-polish.md` for a future polish pass.

- [ ] **Step 5: Commit any final fixes**

```bash
git add <any final fixes>
git commit -m "fix: resolve QA findings from batch 1 verification"
```

- [ ] **Step 6: Final sanity — run tests and build one more time**

Run:
```bash
npm test && npm run build
```

Expected: Both succeed.

---

## Self-Review

Final check against the spec (`docs/superpowers/specs/2026-04-10-deep-content-and-custom-lua-extensions-design.md`):

**Spec section coverage:**
- §3 Content depth guide → Task 1 ✓
- §4 Progressive disclosure UI components (Details, StepGuide, YamlPreview) → Tasks 5, 6, 7, 8 ✓
- §5.2 3-Tab structure → Task 19 ✓
- §5.3 Type extensions → Task 3 ✓
- §5.4 Module registry merge → Task 20 ✓
- §5.5 Schema capability migration → Task 21 ✓
- §5.6 File organization under `lua/` directory → Tasks 14–18 ✓
- §5.7 Store actions → Tasks 9, 10 ✓
- §5.8 YAML serialization → Tasks 12, 13 ✓
- §5.9 Lua script templates → Task 4 ✓
- §5.10 Tutorial rewrite → Task 23 ✓
- §5.11 Cross-reference fixes → Task 22 ✓
- §7.1 Deliverables list — all 25 items mapped to tasks above ✓
- §7.1 Acceptance criteria (build passes, bundle size, lazy loading, QA) → Task 26 ✓

**Out of scope for Batch 1 (deferred to later batches per spec §7):**
- Other 14 modules' content deepening
- Concept doc rewrites (what-is-rime, config-structure, etc.)
- UI additions for other modules (custom key-bindings, custom switches, etc.)

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-10-deep-content-and-custom-lua-extensions-batch-1.md`. Two execution options:

**1. Subagent-Driven (recommended)** — Dispatch a fresh subagent per task, review between tasks, fast iteration. Uses `superpowers:subagent-driven-development`.

**2. Inline Execution** — Execute tasks in this session using `superpowers:executing-plans`, batch execution with checkpoints.

Which approach?
