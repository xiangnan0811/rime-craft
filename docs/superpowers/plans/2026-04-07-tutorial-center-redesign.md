# Tutorial Center Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the `/docs` tutorial center — fix broken MDX pages, add a visual design system with light/dark mode, and add full UX features (TOC, search, breadcrumbs, prev/next, mobile nav).

**Architecture:** Enhance the existing Vite + React Router + MDX stack. Fix the MDX provider pipeline so custom components resolve. Build a three-column responsive layout (sidebar / content / TOC). Add client-side search via minisearch, syntax highlighting via shiki/rehype-pretty-code, and callout directives via remark-directive.

**Tech Stack:** React 18, React Router v7, MDX v3, Tailwind CSS 3, Radix UI, Zustand, shiki, rehype-pretty-code, minisearch, remark-directive, lucide-react (icons)

**Spec:** `docs/superpowers/specs/2026-04-07-tutorial-center-redesign-design.md`

---

## File Structure

### New Files

| File | Responsibility |
|------|---------------|
| `src/components/shared/CodeBlock.tsx` | Code block with filename header, copy button, always-dark styling |
| `src/components/shared/Callout.tsx` | Tip/Warning/Note/Caution callout component |
| `src/app/docs/DocsToc.tsx` | Right-side table of contents with scroll-tracking |
| `src/app/docs/DocsPagination.tsx` | Prev/next page navigation |
| `src/app/docs/DocsBreadcrumb.tsx` | Section / Page breadcrumb |
| `src/app/docs/DocsMobileSidebar.tsx` | Mobile hamburger sidebar overlay |
| `src/app/docs/DocsSearch.tsx` | Cmd+K search dialog |
| `src/lib/docs/search-index.ts` | Build-time search index from MDX content metadata |
| `src/lib/docs/use-active-heading.ts` | Hook for TOC scroll-tracking via IntersectionObserver |
| `src/lib/docs/use-headings.ts` | Hook to extract h2/h3 headings from rendered DOM |
| `src/lib/docs/tutorial-helpers.ts` | Helper functions: flatten nav, find prev/next, find section |
| `src/components/shared/DarkModeToggle.tsx` | Sun/moon toggle button |

### Modified Files

| File | Change |
|------|--------|
| `vite.config.ts` | Add `providerImportSource`, rehype-pretty-code, remark-directive plugins |
| `package.json` | Add new dependencies |
| `src/index.css` | Add dark mode CSS variables for docs tokens |
| `src/components/shared/mdx-components.tsx` | Full rewrite — styled components + CodeBlock + Callout |
| `src/app/docs/DocsLayout.tsx` | Rewrite to three-column responsive layout |
| `src/app/docs/DocsPage.tsx` | Add heading extraction, pass data to TOC/breadcrumb/pagination |
| `src/app/layout/AppLayout.tsx` | Add dark mode toggle, search trigger, active nav indicator |
| `src/components/shared/GoToConfigButton.tsx` | Restyle as card CTA |
| `src/content/*.mdx` | Convert tip/warning blockquotes to `:::tip` / `:::warning` |

---

## Task 1: Install Dependencies and Fix MDX Pipeline

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`

This is the critical bug fix. After this task, the blank pages in "配置详解" will render correctly.

- [ ] **Step 1: Install new dependencies**

```bash
npm install shiki rehype-pretty-code minisearch remark-directive remark-directive-rehype
```

- [ ] **Step 2: Update vite.config.ts to fix MDX provider and add plugins**

Replace the entire `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import mdx from '@mdx-js/rollup'
import remarkGfm from 'remark-gfm'
import remarkDirective from 'remark-directive'
import remarkDirectiveRehype from 'remark-directive-rehype'
import rehypePrettyCode from 'rehype-pretty-code'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [
    mdx({
      providerImportSource: '@mdx-js/react',
      remarkPlugins: [remarkGfm, remarkDirective, remarkDirectiveRehype],
      rehypePlugins: [
        [rehypePrettyCode, { theme: 'one-dark-pro', keepBackground: true }],
      ],
    }),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

Key change: `providerImportSource: '@mdx-js/react'` makes compiled MDX files look up components from the nearest `<MDXProvider>`, fixing the GoToConfigButton resolution error.

- [ ] **Step 3: Verify the fix**

```bash
npm run dev
```

Open `http://localhost:5173/docs/schema-manager` in the browser. The page should render content instead of showing a blank page. The GoToConfigButton at the bottom should be visible. Check the browser console — the `GoToConfigHighlighter` and `GoToConfigButton` errors should be gone.

- [ ] **Step 4: Verify build succeeds**

```bash
npm run build
```

Expected: Build completes without errors.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vite.config.ts
git commit -m "fix: resolve MDX component injection by adding providerImportSource

Add rehype-pretty-code, remark-directive, and minisearch dependencies
for upcoming tutorial center redesign."
```

---

## Task 2: Dark Mode Infrastructure

**Files:**
- Modify: `src/index.css`
- Create: `src/components/shared/DarkModeToggle.tsx`
- Modify: `src/app/layout/AppLayout.tsx`

- [ ] **Step 1: Add dark mode initialization script to index.html**

Add this script in `index.html` inside `<head>`, before any CSS loads, to prevent flash of wrong theme:

```html
<script>
  (function() {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  })();
</script>
```

- [ ] **Step 2: Update index.css with dark mode docs tokens**

Add these CSS variables inside the existing `.dark` block in `src/index.css`, after line 48 (`--ring: 0 0% 83.1%;`):

```css
    --docs-sidebar: 217 33% 17%;
    --docs-code-bg: 222 47% 11%;
    --docs-code-header: 222 47% 5%;
```

And add matching light mode tokens inside `:root`, after line 26 (`--ring: 0 0% 3.9%;`):

```css
    --docs-sidebar: 0 0% 98%;
    --docs-code-bg: 217 33% 17%;
    --docs-code-header: 222 47% 5%;
```

- [ ] **Step 3: Create DarkModeToggle component**

Create `src/components/shared/DarkModeToggle.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function DarkModeToggle() {
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains('dark')
  )

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [dark])

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setDark((d) => !d)}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="h-9 w-9"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}
```

- [ ] **Step 4: Update AppLayout with dark mode toggle and active nav**

Replace `src/app/layout/AppLayout.tsx`:

```tsx
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { DarkModeToggle } from '@/components/shared/DarkModeToggle'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/docs', label: '教程中心' },
  { to: '/editor', label: '配置编辑器' },
  { to: '/theme', label: '主题工作室' },
  { to: '/compare', label: '方案对比' },
]

export function AppLayout() {
  const { pathname } = useLocation()

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b bg-background px-6 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link to="/" className="text-xl font-bold">
            Rime Craft
          </Link>
          <nav className="flex items-center gap-2">
            {NAV_ITEMS.map(({ to, label }) => (
              <Link key={to} to={to}>
                <Button
                  variant="ghost"
                  className={cn(
                    pathname.startsWith(to) &&
                      'bg-accent text-accent-foreground',
                  )}
                >
                  {label}
                </Button>
              </Link>
            ))}
            <DarkModeToggle />
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
```

- [ ] **Step 5: Verify dark mode works**

```bash
npm run dev
```

Open the app. Click the moon icon — the entire page should switch to dark mode. Refresh — it should persist. Click again to go back to light mode. Check that all existing pages (home, editor, theme studio) still look correct in both modes.

- [ ] **Step 6: Commit**

```bash
git add index.html src/index.css src/components/shared/DarkModeToggle.tsx src/app/layout/AppLayout.tsx
git commit -m "feat: add dark mode toggle with localStorage persistence

Add sun/moon toggle in header, initialize from localStorage/system
preference, add docs-specific CSS tokens for both modes."
```

---

## Task 3: Tutorial Navigation Helpers

**Files:**
- Create: `src/lib/docs/tutorial-helpers.ts`

These pure functions are used by breadcrumbs, pagination, and search. Easy to test.

- [ ] **Step 1: Create tutorial-helpers.ts**

Create `src/lib/docs/tutorial-helpers.ts`:

```ts
import { TUTORIAL_NAV, type TutorialItem, type TutorialSection } from '@/data/tutorial-nav'

export interface FlatTutorialItem extends TutorialItem {
  sectionTitle: string
}

/** Flatten TUTORIAL_NAV into a single ordered array with section info */
export function flattenNav(): FlatTutorialItem[] {
  return TUTORIAL_NAV.flatMap((section) =>
    section.items.map((item) => ({
      ...item,
      sectionTitle: section.title,
    })),
  )
}

/** Find the section a slug belongs to */
export function findSectionBySlug(slug: string): TutorialSection | undefined {
  return TUTORIAL_NAV.find((section) =>
    section.items.some((item) => item.slug === slug),
  )
}

/** Get previous and next items for a given slug */
export function getPrevNext(slug: string): {
  prev: FlatTutorialItem | null
  next: FlatTutorialItem | null
} {
  const flat = flattenNav()
  const index = flat.findIndex((item) => item.slug === slug)
  if (index === -1) return { prev: null, next: null }
  return {
    prev: index > 0 ? flat[index - 1]! : null,
    next: index < flat.length - 1 ? flat[index + 1]! : null,
  }
}
```

- [ ] **Step 2: Write tests for tutorial helpers**

Create `src/lib/docs/__tests__/tutorial-helpers.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { flattenNav, findSectionBySlug, getPrevNext } from '../tutorial-helpers'

describe('flattenNav', () => {
  it('returns all items with section titles', () => {
    const flat = flattenNav()
    expect(flat.length).toBe(17)
    expect(flat[0]).toEqual({
      slug: 'what-is-rime',
      title: 'Rime 是什么',
      sectionTitle: '入门指南',
    })
  })

  it('preserves order across sections', () => {
    const flat = flattenNav()
    const slugs = flat.map((i) => i.slug)
    expect(slugs.indexOf('config-structure')).toBeLessThan(
      slugs.indexOf('schema-manager'),
    )
  })
})

describe('findSectionBySlug', () => {
  it('finds section for a known slug', () => {
    const section = findSectionBySlug('schema-manager')
    expect(section?.title).toBe('配置详解')
  })

  it('returns undefined for unknown slug', () => {
    expect(findSectionBySlug('nonexistent')).toBeUndefined()
  })
})

describe('getPrevNext', () => {
  it('returns null prev for first item', () => {
    const { prev, next } = getPrevNext('what-is-rime')
    expect(prev).toBeNull()
    expect(next?.slug).toBe('installation')
  })

  it('returns null next for last item', () => {
    const { prev, next } = getPrevNext('multi-device-sync')
    expect(prev?.slug).toBe('lua-scripting')
    expect(next).toBeNull()
  })

  it('spans across sections', () => {
    const { prev, next } = getPrevNext('config-structure')
    expect(prev?.slug).toBe('first-deploy')
    expect(next?.slug).toBe('schema-manager')
    expect(next?.sectionTitle).toBe('配置详解')
  })

  it('returns both null for unknown slug', () => {
    const { prev, next } = getPrevNext('nonexistent')
    expect(prev).toBeNull()
    expect(next).toBeNull()
  })
})
```

- [ ] **Step 3: Run tests**

```bash
npm test -- src/lib/docs/__tests__/tutorial-helpers.test.ts
```

Expected: All 7 tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/lib/docs/tutorial-helpers.ts src/lib/docs/__tests__/tutorial-helpers.test.ts
git commit -m "feat: add tutorial navigation helper functions

flattenNav, findSectionBySlug, getPrevNext for breadcrumbs,
pagination, and search. Fully tested."
```

---

## Task 4: CodeBlock Component

**Files:**
- Create: `src/components/shared/CodeBlock.tsx`

rehype-pretty-code transforms `<pre>` and `<code>` elements with data attributes. This component adds the filename header and copy button.

- [ ] **Step 1: Create CodeBlock component**

Create `src/components/shared/CodeBlock.tsx`:

```tsx
import { useState, useRef, type ComponentPropsWithoutRef } from 'react'
import { Copy, Check } from 'lucide-react'

export function Pre({ children, ...props }: ComponentPropsWithoutRef<'pre'>) {
  const [copied, setCopied] = useState(false)
  const preRef = useRef<HTMLPreElement>(null)

  // rehype-pretty-code sets data-language on <code> inside <pre>
  const codeEl = preRef.current?.querySelector('code')
  const rawTitle =
    (props as Record<string, unknown>)['data-title'] ??
    (props as Record<string, unknown>)['data-language']

  const title = typeof rawTitle === 'string' ? rawTitle : undefined

  function handleCopy() {
    const text = preRef.current?.textContent ?? ''
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="group relative my-4 overflow-hidden rounded-lg border border-slate-700 bg-slate-800 dark:border-slate-700 dark:bg-slate-950">
      {title && (
        <div className="flex items-center justify-between border-b border-slate-700 bg-slate-900 px-4 py-2 dark:bg-slate-950">
          <span className="text-xs text-slate-400">{title}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-slate-500 transition-colors hover:text-slate-300"
            aria-label="Copy code"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      )}
      {!title && (
        <button
          onClick={handleCopy}
          className="absolute right-3 top-3 flex items-center gap-1 rounded bg-slate-700/50 px-2 py-1 text-xs text-slate-400 opacity-0 transition-opacity hover:text-slate-200 group-hover:opacity-100"
          aria-label="Copy code"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      )}
      <pre
        ref={preRef}
        className="overflow-x-auto p-4 text-sm leading-relaxed"
        {...props}
      >
        {children}
      </pre>
    </div>
  )
}

export function InlineCode(props: ComponentPropsWithoutRef<'code'>) {
  // rehype-pretty-code wraps code blocks in <code data-language>
  // If this <code> has data-language, it's inside a <pre> — don't style it as inline
  if ((props as Record<string, unknown>)['data-language']) {
    return <code {...props} />
  }

  return (
    <code
      className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[13px] text-gray-800 dark:bg-slate-800 dark:text-slate-200"
      {...props}
    />
  )
}
```

- [ ] **Step 2: Verify visually**

After integrating in Task 6 (mdx-components), open any docs page with code blocks (e.g., `/docs/schema-manager`). Verify:
- Code block has dark background in both light and dark mode
- YAML syntax is highlighted with colors
- Copy button appears (in header if filename present, floating on hover otherwise)
- Clicking Copy shows "Copied!" for 2 seconds

- [ ] **Step 3: Commit**

```bash
git add src/components/shared/CodeBlock.tsx
git commit -m "feat: add CodeBlock with filename header and copy button

Always-dark code blocks with syntax highlighting via rehype-pretty-code.
Copy-to-clipboard with visual feedback."
```

---

## Task 5: Callout Component

**Files:**
- Create: `src/components/shared/Callout.tsx`

remark-directive-rehype converts `:::tip[Title]` into a `<div>` with `data-directive="tip"`. This component renders the styled callout.

- [ ] **Step 1: Create Callout component**

Create `src/components/shared/Callout.tsx`:

```tsx
import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/lib/utils'

const CALLOUT_CONFIG = {
  tip: {
    icon: '💡',
    label: 'Tip',
    styles: 'border-blue-400 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/50',
    textColor: 'text-blue-800 dark:text-blue-200',
    labelColor: 'text-blue-700 dark:text-blue-300',
  },
  warning: {
    icon: '⚠️',
    label: 'Warning',
    styles: 'border-yellow-400 bg-yellow-50 dark:border-yellow-500 dark:bg-yellow-950/50',
    textColor: 'text-yellow-800 dark:text-yellow-200',
    labelColor: 'text-yellow-700 dark:text-yellow-300',
  },
  note: {
    icon: '✅',
    label: 'Note',
    styles: 'border-green-400 bg-green-50 dark:border-green-500 dark:bg-green-950/50',
    textColor: 'text-green-800 dark:text-green-200',
    labelColor: 'text-green-700 dark:text-green-300',
  },
  caution: {
    icon: '🚨',
    label: 'Caution',
    styles: 'border-red-400 bg-red-50 dark:border-red-500 dark:bg-red-950/50',
    textColor: 'text-red-800 dark:text-red-200',
    labelColor: 'text-red-700 dark:text-red-300',
  },
} as const

type CalloutType = keyof typeof CALLOUT_CONFIG

export function Callout({
  children,
  ...props
}: ComponentPropsWithoutRef<'div'>) {
  const directive = (props as Record<string, unknown>)['data-directive'] as string | undefined
  const type: CalloutType =
    directive && directive in CALLOUT_CONFIG
      ? (directive as CalloutType)
      : 'note'
  const config = CALLOUT_CONFIG[type]

  return (
    <div
      className={cn(
        'my-4 rounded-r-lg border-l-[3px] p-4',
        config.styles,
      )}
    >
      <div className={cn('mb-1 text-sm font-semibold', config.labelColor)}>
        {config.icon} {config.label}
      </div>
      <div className={cn('text-sm leading-relaxed [&>p]:mb-0', config.textColor)}>
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/shared/Callout.tsx
git commit -m "feat: add Callout component with 4 variants

Tip (blue), Warning (yellow), Note (green), Caution (red).
Reads data-directive attribute from remark-directive-rehype."
```

---

## Task 6: MDX Components Rewrite

**Files:**
- Modify: `src/components/shared/mdx-components.tsx`

Full rewrite of the MDX component map with proper typography, dark mode support, and integration of CodeBlock and Callout.

- [ ] **Step 1: Rewrite mdx-components.tsx**

Replace `src/components/shared/mdx-components.tsx` entirely:

```tsx
import type { ComponentPropsWithoutRef } from 'react'
import { GoToConfigButton } from './GoToConfigButton'
import { Pre, InlineCode } from './CodeBlock'
import { Callout } from './Callout'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const mdxComponents = {
  GoToConfigButton,

  // Headings with anchor IDs for TOC linking
  h1: (props: ComponentPropsWithoutRef<'h1'>) => {
    const id = typeof props.children === 'string' ? slugify(props.children) : undefined
    return <h1 id={id} className="mb-2 text-2xl font-bold text-gray-900 dark:text-slate-100" {...props} />
  },
  h2: (props: ComponentPropsWithoutRef<'h2'>) => {
    const id = typeof props.children === 'string' ? slugify(props.children) : undefined
    return (
      <h2
        id={id}
        className="mb-3 mt-8 scroll-mt-20 text-xl font-semibold text-gray-900 dark:text-slate-100"
        {...props}
      />
    )
  },
  h3: (props: ComponentPropsWithoutRef<'h3'>) => {
    const id = typeof props.children === 'string' ? slugify(props.children) : undefined
    return (
      <h3
        id={id}
        className="mb-2 mt-6 scroll-mt-20 text-lg font-semibold text-gray-900 dark:text-slate-100"
        {...props}
      />
    )
  },

  // Body text
  p: (props: ComponentPropsWithoutRef<'p'>) => (
    <p className="mb-4 text-[15px] leading-[1.7] text-gray-700 dark:text-slate-300" {...props} />
  ),

  // Lists
  ul: (props: ComponentPropsWithoutRef<'ul'>) => (
    <ul className="mb-4 list-disc space-y-1.5 pl-6 text-[15px] text-gray-700 dark:text-slate-300" {...props} />
  ),
  ol: (props: ComponentPropsWithoutRef<'ol'>) => (
    <ol className="mb-4 list-decimal space-y-1.5 pl-6 text-[15px] text-gray-700 dark:text-slate-300" {...props} />
  ),
  li: (props: ComponentPropsWithoutRef<'li'>) => (
    <li className="leading-[1.7]" {...props} />
  ),

  // Links
  a: (props: ComponentPropsWithoutRef<'a'>) => (
    <a
      className="text-blue-600 underline decoration-blue-300 underline-offset-2 hover:text-blue-800 dark:text-blue-400 dark:decoration-blue-700 dark:hover:text-blue-300"
      {...props}
    />
  ),

  // Code
  pre: Pre,
  code: InlineCode,

  // Blockquote (regular quotes, not callouts)
  blockquote: (props: ComponentPropsWithoutRef<'blockquote'>) => (
    <blockquote
      className="my-4 border-l-[3px] border-gray-300 pl-4 text-gray-600 dark:border-slate-600 dark:text-slate-400"
      {...props}
    />
  ),

  // Tables
  table: (props: ComponentPropsWithoutRef<'table'>) => (
    <div className="my-4 overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-700">
      <table className="w-full border-collapse text-sm" {...props} />
    </div>
  ),
  thead: (props: ComponentPropsWithoutRef<'thead'>) => (
    <thead className="bg-gray-50 dark:bg-slate-800" {...props} />
  ),
  th: (props: ComponentPropsWithoutRef<'th'>) => (
    <th className="border-b border-gray-200 px-4 py-2.5 text-left text-sm font-medium text-gray-700 dark:border-slate-700 dark:text-slate-300" {...props} />
  ),
  td: (props: ComponentPropsWithoutRef<'td'>) => (
    <td className="border-b border-gray-100 px-4 py-2.5 text-gray-700 dark:border-slate-800 dark:text-slate-300" {...props} />
  ),

  // Horizontal rule
  hr: (props: ComponentPropsWithoutRef<'hr'>) => (
    <hr className="my-8 border-gray-200 dark:border-slate-700" {...props} />
  ),

  // Strong / emphasis
  strong: (props: ComponentPropsWithoutRef<'strong'>) => (
    <strong className="font-semibold text-gray-900 dark:text-slate-100" {...props} />
  ),

  // Callout directives (remark-directive-rehype outputs divs with data-directive)
  div: (props: ComponentPropsWithoutRef<'div'>) => {
    const directive = (props as Record<string, unknown>)['data-directive'] as string | undefined
    if (directive && ['tip', 'warning', 'note', 'caution'].includes(directive)) {
      return <Callout {...props} />
    }
    return <div {...props} />
  },
}
```

- [ ] **Step 2: Verify all MDX pages render**

```bash
npm run dev
```

Navigate through every page in the docs sidebar. Verify:
- All 17 pages render content (no blank pages)
- Headings have proper sizes and dark mode colors
- Code blocks are dark with syntax highlighting
- Inline code has gray background
- Tables have borders and header backgrounds
- Links are blue with underline
- GoToConfigButton appears at the bottom of config pages

- [ ] **Step 3: Verify dark mode**

Toggle dark mode. All text, backgrounds, code blocks, and tables should adapt correctly.

- [ ] **Step 4: Commit**

```bash
git add src/components/shared/mdx-components.tsx
git commit -m "feat: rewrite MDX components with full design system

Styled typography, dark mode support, CodeBlock/Callout integration,
anchor IDs on headings for TOC, table styling, link styling."
```

---

## Task 7: DocsBreadcrumb Component

**Files:**
- Create: `src/app/docs/DocsBreadcrumb.tsx`

- [ ] **Step 1: Create DocsBreadcrumb**

Create `src/app/docs/DocsBreadcrumb.tsx`:

```tsx
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { findSectionBySlug } from '@/lib/docs/tutorial-helpers'

interface DocsBreadcrumbProps {
  slug: string
  pageTitle: string
}

export function DocsBreadcrumb({ slug, pageTitle }: DocsBreadcrumbProps) {
  const section = findSectionBySlug(slug)
  if (!section) return null

  const firstSlug = section.items[0]?.slug ?? slug

  return (
    <nav className="mb-4 flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400">
      <Link
        to={`/docs/${firstSlug}`}
        className="transition-colors hover:text-gray-900 dark:hover:text-slate-200"
      >
        {section.title}
      </Link>
      <ChevronRight className="h-3.5 w-3.5" />
      <span className="text-gray-900 dark:text-slate-200">{pageTitle}</span>
    </nav>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/docs/DocsBreadcrumb.tsx
git commit -m "feat: add DocsBreadcrumb component

Shows Section / Page navigation above page title."
```

---

## Task 8: DocsPagination Component

**Files:**
- Create: `src/app/docs/DocsPagination.tsx`

- [ ] **Step 1: Create DocsPagination**

Create `src/app/docs/DocsPagination.tsx`:

```tsx
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getPrevNext } from '@/lib/docs/tutorial-helpers'

interface DocsPaginationProps {
  slug: string
}

export function DocsPagination({ slug }: DocsPaginationProps) {
  const { prev, next } = getPrevNext(slug)

  if (!prev && !next) return null

  return (
    <nav className="mt-12 flex items-stretch justify-between border-t border-gray-200 pt-6 dark:border-slate-700">
      {prev ? (
        <Link
          to={`/docs/${prev.slug}`}
          className="group flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-3 transition-colors hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:hover:border-blue-700 dark:hover:bg-blue-950/30"
        >
          <ChevronLeft className="h-4 w-4 text-gray-400 transition-colors group-hover:text-blue-500" />
          <div>
            <div className="text-xs text-gray-500 dark:text-slate-400">Previous</div>
            <div className="text-sm font-medium text-gray-900 dark:text-slate-200">
              {prev.title}
            </div>
          </div>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          to={`/docs/${next.slug}`}
          className="group flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-3 text-right transition-colors hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:hover:border-blue-700 dark:hover:bg-blue-950/30"
        >
          <div>
            <div className="text-xs text-gray-500 dark:text-slate-400">Next</div>
            <div className="text-sm font-medium text-gray-900 dark:text-slate-200">
              {next.title}
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-400 transition-colors group-hover:text-blue-500" />
        </Link>
      ) : (
        <div />
      )}
    </nav>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/docs/DocsPagination.tsx
git commit -m "feat: add DocsPagination with prev/next navigation

Card-style links spanning across sections with hover effects."
```

---

## Task 9: TOC Hooks and DocsToc Component

**Files:**
- Create: `src/lib/docs/use-headings.ts`
- Create: `src/lib/docs/use-active-heading.ts`
- Create: `src/app/docs/DocsToc.tsx`

- [ ] **Step 1: Create useHeadings hook**

Create `src/lib/docs/use-headings.ts`:

```ts
import { useState, useEffect } from 'react'

export interface TocHeading {
  id: string
  text: string
  level: number
}

/**
 * Extract h2 and h3 headings from a container element.
 * Re-runs whenever `slug` changes (new page loaded).
 */
export function useHeadings(slug: string | undefined): TocHeading[] {
  const [headings, setHeadings] = useState<TocHeading[]>([])

  useEffect(() => {
    // Small delay to let MDX content render
    const timer = setTimeout(() => {
      const container = document.querySelector('[data-docs-content]')
      if (!container) return

      const els = container.querySelectorAll('h2[id], h3[id]')
      const result: TocHeading[] = []
      els.forEach((el) => {
        result.push({
          id: el.id,
          text: el.textContent ?? '',
          level: el.tagName === 'H2' ? 2 : 3,
        })
      })
      setHeadings(result)
    }, 100)

    return () => clearTimeout(timer)
  }, [slug])

  return headings
}
```

- [ ] **Step 2: Create useActiveHeading hook**

Create `src/lib/docs/use-active-heading.ts`:

```ts
import { useState, useEffect } from 'react'

/**
 * Track which heading is currently in view using IntersectionObserver.
 * Returns the id of the active heading.
 */
export function useActiveHeading(headingIds: string[]): string | null {
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    if (headingIds.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the first heading that is intersecting
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
            break
          }
        }
      },
      {
        rootMargin: '-80px 0px -60% 0px',
        threshold: 0,
      },
    )

    headingIds.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [headingIds])

  return activeId
}
```

- [ ] **Step 3: Create DocsToc component**

Create `src/app/docs/DocsToc.tsx`:

```tsx
import { cn } from '@/lib/utils'
import { useHeadings } from '@/lib/docs/use-headings'
import { useActiveHeading } from '@/lib/docs/use-active-heading'

interface DocsTocProps {
  slug: string | undefined
}

export function DocsToc({ slug }: DocsTocProps) {
  const headings = useHeadings(slug)
  const activeId = useActiveHeading(headings.map((h) => h.id))

  if (headings.length === 0) return null

  return (
    <nav className="sticky top-20">
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
        On this page
      </h4>
      <ul className="space-y-1 border-l-2 border-gray-100 dark:border-slate-800">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              onClick={(e) => {
                e.preventDefault()
                document.getElementById(heading.id)?.scrollIntoView({ behavior: 'smooth' })
              }}
              className={cn(
                'block border-l-2 -ml-[2px] py-1 text-sm transition-colors',
                heading.level === 3 ? 'pl-6' : 'pl-4',
                activeId === heading.id
                  ? 'border-blue-500 font-medium text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200',
              )}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/docs/use-headings.ts src/lib/docs/use-active-heading.ts src/app/docs/DocsToc.tsx
git commit -m "feat: add DocsToc with IntersectionObserver scroll tracking

Extracts h2/h3 headings from rendered MDX, highlights active section
as user scrolls. Indented h3 items under h2."
```

---

## Task 10: DocsMobileSidebar Component

**Files:**
- Create: `src/app/docs/DocsMobileSidebar.tsx`

Uses the existing Radix Dialog component for the overlay.

- [ ] **Step 1: Create DocsMobileSidebar**

Create `src/app/docs/DocsMobileSidebar.tsx`:

```tsx
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { TUTORIAL_NAV } from '@/data/tutorial-nav'

export function DocsMobileSidebar() {
  const { slug } = useParams()
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setOpen(false)}
          />
          {/* Sidebar panel */}
          <div className="fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto bg-white p-6 shadow-xl dark:bg-slate-900 lg:hidden">
            <div className="mb-6 flex items-center justify-between">
              <span className="text-lg font-bold">Tutorial</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav>
              {TUTORIAL_NAV.map((section) => (
                <div key={section.title} className="mb-6">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                    {section.title}
                  </h3>
                  <ul className="space-y-1">
                    {section.items.map((item) => (
                      <li key={item.slug}>
                        <Link
                          to={`/docs/${item.slug}`}
                          onClick={() => setOpen(false)}
                          className={cn(
                            'block rounded-md px-3 py-2 text-sm transition-colors',
                            slug === item.slug
                              ? 'border-l-2 border-blue-500 bg-blue-50 font-medium text-gray-900 dark:bg-blue-950/30 dark:text-slate-100'
                              : 'text-gray-600 hover:bg-gray-50 dark:text-slate-400 dark:hover:bg-slate-800',
                          )}
                        >
                          {item.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
        </>
      )}
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/docs/DocsMobileSidebar.tsx
git commit -m "feat: add DocsMobileSidebar with overlay navigation

Hamburger menu for mobile/tablet. Closes on navigation or backdrop click."
```

---

## Task 11: GoToConfigButton Restyle

**Files:**
- Modify: `src/components/shared/GoToConfigButton.tsx`

- [ ] **Step 1: Restyle as card CTA**

Replace `src/components/shared/GoToConfigButton.tsx`:

```tsx
import { useNavigate } from 'react-router-dom'
import { useConfigStore } from '@/stores/config-store'
import { ArrowRight, Wrench } from 'lucide-react'
import type { EditorModule } from '@/types/config'

interface GoToConfigButtonProps {
  module: EditorModule
  label?: string
}

export function GoToConfigButton({ module, label }: GoToConfigButtonProps) {
  const navigate = useNavigate()
  const setActiveModule = useConfigStore((s) => s.setActiveModule)

  function handleClick() {
    setActiveModule(module)
    navigate('/editor')
  }

  return (
    <button
      onClick={handleClick}
      className="my-6 flex w-full items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-left transition-colors hover:border-blue-300 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/30 dark:hover:border-blue-700 dark:hover:bg-blue-950/50"
    >
      <Wrench className="h-5 w-5 flex-shrink-0 text-blue-500" />
      <div className="flex-1">
        <div className="text-sm font-medium text-blue-900 dark:text-blue-200">
          {label ?? '在编辑器中配置'}
        </div>
        <div className="text-xs text-blue-600 dark:text-blue-400">
          Open in visual editor
        </div>
      </div>
      <ArrowRight className="h-4 w-4 text-blue-400" />
    </button>
  )
}
```

- [ ] **Step 2: Verify on a config page**

Open `/docs/schema-manager`. The GoToConfigButton at the bottom should be a full-width card with wrench icon, label, and arrow. Click it — should navigate to `/editor` with the correct module active.

- [ ] **Step 3: Commit**

```bash
git add src/components/shared/GoToConfigButton.tsx
git commit -m "feat: restyle GoToConfigButton as card CTA

Full-width card with wrench icon, label, subtitle, and arrow.
Dark mode support."
```

---

## Task 12: DocsLayout Rewrite (Three-Column Responsive)

**Files:**
- Modify: `src/app/docs/DocsLayout.tsx`
- Modify: `src/app/docs/DocsPage.tsx`

This is the main layout integration task. Wires up sidebar, content, TOC, breadcrumb, pagination, and mobile sidebar.

- [ ] **Step 1: Rewrite DocsLayout**

Replace `src/app/docs/DocsLayout.tsx`:

```tsx
import { Link, Outlet, useParams } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { TUTORIAL_NAV } from '@/data/tutorial-nav'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DocsToc } from './DocsToc'
import { DocsMobileSidebar } from './DocsMobileSidebar'

export function DocsLayout() {
  const { slug } = useParams()

  return (
    <div className="flex h-[calc(100vh-57px)]">
      {/* Mobile sidebar trigger - shown in a top bar on small screens */}
      <div className="fixed left-0 right-0 top-[57px] z-30 flex items-center border-b bg-background px-4 py-2 lg:hidden">
        <DocsMobileSidebar />
        <span className="ml-2 text-sm font-medium text-gray-700 dark:text-slate-300">Tutorial</span>
      </div>

      {/* Desktop/Tablet sidebar */}
      <ScrollArea className="hidden w-[220px] flex-shrink-0 border-r border-gray-200 bg-gray-50 dark:border-slate-800 dark:bg-slate-900 lg:block">
        <nav className="p-4">
          {TUTORIAL_NAV.map((section) => (
            <div key={section.title} className="mb-6">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                {section.title}
              </h3>
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <li key={item.slug}>
                    <Link
                      to={`/docs/${item.slug}`}
                      className={cn(
                        'block rounded-md px-3 py-1.5 text-sm transition-colors',
                        slug === item.slug
                          ? 'border-l-2 border-blue-500 bg-white font-medium text-gray-900 shadow-sm dark:bg-slate-800 dark:text-slate-100'
                          : 'text-gray-600 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800',
                      )}
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto pt-12 lg:pt-0">
          <div className="mx-auto max-w-3xl px-6 py-8 lg:px-8 lg:py-10">
            <Outlet />
          </div>
        </main>

        {/* Right-side TOC — desktop only */}
        <aside className="hidden w-[180px] flex-shrink-0 overflow-y-auto border-l border-gray-100 px-4 py-8 dark:border-slate-800 xl:block">
          <DocsToc slug={slug} />
        </aside>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Rewrite DocsPage to integrate breadcrumb and pagination**

Replace `src/app/docs/DocsPage.tsx`:

```tsx
import { useParams, Navigate } from 'react-router-dom'
import { useState, useEffect, type ComponentType } from 'react'
import { MDXProvider } from '@mdx-js/react'
import { mdxComponents } from '@/components/shared/mdx-components'
import { findTutorialBySlug } from '@/data/tutorial-nav'
import { DocsBreadcrumb } from './DocsBreadcrumb'
import { DocsPagination } from './DocsPagination'

const MDX_MODULES: Record<string, () => Promise<{ default: ComponentType }>> = {
  'what-is-rime': () => import('@/content/what-is-rime.mdx'),
  'installation': () => import('@/content/installation.mdx'),
  'first-deploy': () => import('@/content/first-deploy.mdx'),
  'config-structure': () => import('@/content/config-structure.mdx'),
  'schema-manager': () => import('@/content/schema-manager.mdx'),
  'candidate-settings': () => import('@/content/candidate-settings.mdx'),
  'key-bindings': () => import('@/content/key-bindings.mdx'),
  'fuzzy-pinyin': () => import('@/content/fuzzy-pinyin.mdx'),
  'ascii-mode': () => import('@/content/ascii-mode.mdx'),
  'punctuation': () => import('@/content/punctuation.mdx'),
  'dictionary': () => import('@/content/dictionary.mdx'),
  'switches': () => import('@/content/switches.mdx'),
  'double-pinyin-guide': () => import('@/content/double-pinyin-guide.mdx'),
  'auxiliary-code': () => import('@/content/auxiliary-code.mdx'),
  'custom-dictionary': () => import('@/content/custom-dictionary.mdx'),
  'lua-scripting': () => import('@/content/lua-scripting.mdx'),
  'multi-device-sync': () => import('@/content/multi-device-sync.mdx'),
}

export function DocsPage() {
  const { slug } = useParams()
  const [Content, setContent] = useState<ComponentType | null>(null)
  const [loading, setLoading] = useState(true)

  const item = slug ? findTutorialBySlug(slug) : undefined

  useEffect(() => {
    if (!slug || !MDX_MODULES[slug]) {
      setLoading(false)
      return
    }

    setLoading(true)
    setContent(null)
    MDX_MODULES[slug]!()
      .then((mod) => {
        setContent(() => mod.default)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [slug])

  if (!slug) {
    return <Navigate to="/docs/what-is-rime" replace />
  }

  if (!item) {
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
      <DocsBreadcrumb slug={slug} pageTitle={item.title} />
      <div data-docs-content>
        <MDXProvider components={mdxComponents}>
          <Content />
        </MDXProvider>
      </div>
      <DocsPagination slug={slug} />
    </>
  )
}
```

- [ ] **Step 3: Verify the full layout**

```bash
npm run dev
```

Open `/docs/schema-manager`. Verify:
- Three columns visible on desktop (sidebar, content, TOC)
- Breadcrumb shows "配置详解 / 输入方案管理" above the title
- TOC on the right shows heading links, highlights on scroll
- Prev/next cards at the bottom link to correct pages
- Resize browser to tablet width — TOC disappears, sidebar stays
- Resize to mobile — sidebar disappears, hamburger menu appears in top bar

- [ ] **Step 4: Verify all 17 pages load**

Click through every page in the sidebar. Each should render content with breadcrumbs and prev/next navigation. No blank pages.

- [ ] **Step 5: Commit**

```bash
git add src/app/docs/DocsLayout.tsx src/app/docs/DocsPage.tsx
git commit -m "feat: rewrite DocsLayout as three-column responsive layout

Desktop: sidebar + content + TOC. Tablet: sidebar + content.
Mobile: hamburger + full-width content. Breadcrumbs and pagination
integrated into DocsPage."
```

---

## Task 13: DocsSearch Component

**Files:**
- Create: `src/lib/docs/search-index.ts`
- Create: `src/app/docs/DocsSearch.tsx`
- Modify: `src/app/layout/AppLayout.tsx`

- [ ] **Step 1: Create search index**

Create `src/lib/docs/search-index.ts`:

```ts
import MiniSearch from 'minisearch'
import { TUTORIAL_NAV } from '@/data/tutorial-nav'

export interface SearchDoc {
  id: string
  title: string
  section: string
  slug: string
}

let searchInstance: MiniSearch<SearchDoc> | null = null

export function getSearchIndex(): MiniSearch<SearchDoc> {
  if (searchInstance) return searchInstance

  searchInstance = new MiniSearch<SearchDoc>({
    fields: ['title', 'section'],
    storeFields: ['title', 'section', 'slug'],
    searchOptions: {
      boost: { title: 2 },
      fuzzy: 0.2,
      prefix: true,
    },
  })

  const docs: SearchDoc[] = TUTORIAL_NAV.flatMap((section) =>
    section.items.map((item) => ({
      id: item.slug,
      title: item.title,
      section: section.title,
      slug: item.slug,
    })),
  )

  searchInstance.addAll(docs)
  return searchInstance
}

export function searchDocs(query: string): SearchDoc[] {
  if (!query.trim()) return []
  const index = getSearchIndex()
  return index.search(query) as unknown as SearchDoc[]
}
```

- [ ] **Step 2: Create DocsSearch component**

Create `src/app/docs/DocsSearch.tsx`:

```tsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, FileText } from 'lucide-react'
import { searchDocs, type SearchDoc } from '@/lib/docs/search-index'
import { TUTORIAL_NAV } from '@/data/tutorial-nav'

export function DocsSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchDoc[]>([])
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setQuery('')
      setResults([])
      setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Search as user types
  useEffect(() => {
    if (!query.trim()) {
      // Show all pages when query is empty
      const all = TUTORIAL_NAV.flatMap((s) =>
        s.items.map((item) => ({
          id: item.slug,
          title: item.title,
          section: s.title,
          slug: item.slug,
        })),
      )
      setResults(all)
      setSelected(0)
      return
    }
    const found = searchDocs(query)
    setResults(found)
    setSelected(0)
  }, [query])

  const goTo = useCallback(
    (slug: string) => {
      navigate(`/docs/${slug}`)
      setOpen(false)
    },
    [navigate],
  )

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelected((s) => Math.min(s + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected((s) => Math.max(s - 1, 0))
    } else if (e.key === 'Enter' && results[selected]) {
      goTo(results[selected].slug)
    }
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={() => setOpen(false)}
      />
      {/* Dialog */}
      <div className="fixed inset-x-0 top-[15%] z-50 mx-auto w-full max-w-lg px-4">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          {/* Search input */}
          <div className="flex items-center border-b border-gray-200 px-4 dark:border-slate-700">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search tutorials..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-gray-400 dark:text-slate-100"
            />
            <kbd className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-400 dark:bg-slate-800">
              Esc
            </kbd>
          </div>
          {/* Results */}
          <div className="max-h-80 overflow-y-auto p-2">
            {results.length === 0 && query.trim() !== '' && (
              <p className="py-6 text-center text-sm text-gray-500 dark:text-slate-400">
                No results found.
              </p>
            )}
            {results.map((result, i) => (
              <button
                key={result.slug}
                onClick={() => goTo(result.slug)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                  i === selected
                    ? 'bg-blue-50 text-blue-900 dark:bg-blue-950/50 dark:text-blue-100'
                    : 'text-gray-700 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                <FileText className="h-4 w-4 flex-shrink-0 text-gray-400" />
                <div>
                  <div className="font-medium">{result.title}</div>
                  <div className="text-xs text-gray-500 dark:text-slate-400">
                    {result.section}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

/** Search trigger button for the header */
export function SearchTrigger() {
  return (
    <button
      onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
      className="hidden items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 md:flex"
    >
      <Search className="h-3.5 w-3.5" />
      <span>Search...</span>
      <kbd className="rounded bg-gray-200 px-1 text-xs dark:bg-slate-700">⌘K</kbd>
    </button>
  )
}
```

- [ ] **Step 3: Wire search into AppLayout**

In `src/app/layout/AppLayout.tsx`, add the search components. Add these imports at the top:

```tsx
import { DocsSearch, SearchTrigger } from '@/app/docs/DocsSearch'
```

Add `<SearchTrigger />` in the nav, before `<DarkModeToggle />`:

```tsx
<nav className="flex items-center gap-2">
  {NAV_ITEMS.map(({ to, label }) => (
    <Link key={to} to={to}>
      <Button
        variant="ghost"
        className={cn(
          pathname.startsWith(to) &&
            'bg-accent text-accent-foreground',
        )}
      >
        {label}
      </Button>
    </Link>
  ))}
  <SearchTrigger />
  <DarkModeToggle />
</nav>
```

Add `<DocsSearch />` right before the closing `</div>` of the root:

```tsx
      <main className="flex-1">
        <Outlet />
      </main>
      <DocsSearch />
    </div>
```

- [ ] **Step 4: Verify search works**

```bash
npm run dev
```

Press `Cmd+K` — search dialog opens. Type "模糊" — "模糊音配置" should appear. Arrow down to select, press Enter — navigates to that page. Press Esc to close. Click the search bar in the header — same dialog opens. When empty, shows all pages for quick navigation.

- [ ] **Step 5: Commit**

```bash
git add src/lib/docs/search-index.ts src/app/docs/DocsSearch.tsx src/app/layout/AppLayout.tsx
git commit -m "feat: add Cmd+K search with minisearch

Fuzzy search across all tutorial pages. Shows all pages when empty
for quick navigation. Arrow keys + Enter for keyboard nav."
```

---

## Task 14: Update MDX Content with Callout Directives

**Files:**
- Modify: MDX files that have blockquote tips/warnings

Currently the MDX files don't use many blockquotes as tips. The main content is fine as-is. This task adds a few example callouts to demonstrate the feature, using the `:::tip` directive syntax.

- [ ] **Step 1: Add a callout to schema-manager.mdx**

In `src/content/schema-manager.mdx`, after line 29 (after the "规则" section), add:

```mdx
:::tip
重新部署后才会生效。修改 `schema_list` 后，需要右键点击输入法图标并选择「重新部署」。
:::
```

- [ ] **Step 2: Add a callout to installation.mdx**

Read `src/content/installation.mdx` first. Find an appropriate place for a tip about the installation process and add a `:::tip` or `:::note` callout if a blockquote tip exists that should be converted.

- [ ] **Step 3: Verify callouts render correctly**

```bash
npm run dev
```

Open `/docs/schema-manager`. The tip should appear as a blue callout box with "💡 Tip" label. Check light and dark mode.

- [ ] **Step 4: Commit**

```bash
git add src/content/*.mdx
git commit -m "feat: add callout directives to MDX content

Convert applicable blockquotes to :::tip/:::warning syntax.
Demonstrates the callout component in tutorial pages."
```

---

## Task 15: Final Verification and Build Check

**Files:** None (verification only)

- [ ] **Step 1: Run full test suite**

```bash
npm test
```

Expected: All existing tests pass, plus the new tutorial-helpers tests.

- [ ] **Step 2: Run production build**

```bash
npm run build
```

Expected: Build succeeds with no errors or warnings.

- [ ] **Step 3: Test production build**

```bash
npm run preview
```

Open `http://localhost:4173/docs/schema-manager`. Verify:
- Page renders correctly in production build
- Dark mode toggle works
- Search (Cmd+K) works
- All navigation (sidebar, breadcrumbs, prev/next, TOC) works
- Mobile layout works (resize browser)

- [ ] **Step 4: Cross-check all spec requirements**

| Requirement | Status |
|------------|--------|
| Fix blank pages (MDX provider) | Task 1 |
| Three-column layout | Task 12 |
| Responsive (tablet/mobile) | Tasks 10, 12 |
| Dark mode toggle | Task 2 |
| Styled typography | Task 6 |
| Dark code blocks + copy | Task 4 |
| Callout components | Tasks 5, 14 |
| Styled tables | Task 6 |
| Breadcrumbs | Task 7 |
| Prev/Next pagination | Task 8 |
| Table of Contents | Task 9 |
| Search (Cmd+K) | Task 13 |
| GoToConfigButton restyle | Task 11 |
| Mobile hamburger sidebar | Task 10 |

- [ ] **Step 5: Commit any final fixes**

If any issues were found during verification, fix and commit them.
