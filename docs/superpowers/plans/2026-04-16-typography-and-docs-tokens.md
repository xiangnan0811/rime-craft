# Typography + Docs Token Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** [`docs/superpowers/specs/2026-04-16-typography-and-docs-tokens-design.md`](../specs/2026-04-16-typography-and-docs-tokens-design.md)

**Goal:** Collapse the hand-rolled MDX styling layer onto `@tailwindcss/typography` while unifying the docs subroute and code-block shells onto shared CSS tokens.

**Architecture:** Four sequential tasks map to the spec's four migration steps. Task 1 is a pure foundation commit (no visible change). Task 2 flips code blocks to theme-aware. Task 3 deletes redundant HTML overrides in `mdx-components.tsx` and re-adds `prose` at the two MDX consumers. Task 4 splits into seven per-file commits that rewrite the docs route onto tokens.

**Tech Stack:** Vite 8, React 18, TypeScript 6, Tailwind 3.4, MDX (@mdx-js/react + @mdx-js/rollup), rehype-pretty-code, remark-directive-rehype, shadcn-ui components.

---

## File Structure

### Files created

- `docs/superpowers/plans/2026-04-16-typography-and-docs-tokens.md` — this file

### Files modified

| File | Task | Nature |
|------|------|--------|
| `package.json` / `package-lock.json` | 1 | `@tailwindcss/typography` + `rehype-slug` added |
| `tailwind.config.ts` | 1 | Register typography plugin |
| `src/index.css` | 1 | `.prose` / `.dark .prose` token variable bridge |
| `vite.config.ts` | 1 | Dual-theme `rehype-pretty-code`, add `rehype-slug` |
| `src/components/shared/CodeBlock.tsx` | 2 | Outer shell switches to tokens; `<pre>` untouched |
| `src/components/shared/YamlPreview.tsx` | 2 | Outer shell switches to tokens |
| `src/features/editor/TutorialPanel.tsx` | 3 | Re-add `prose prose-sm max-w-none` on MDX container |
| `src/features/editor/ImmersiveView.tsx` | 3 | Re-add `prose prose-sm max-w-none` on MDX container |
| `src/components/shared/mdx-components.tsx` | 3 | Delete `h1/h2/h3/p/ul/ol/li/blockquote/hr/strong/thead/th/td` entries + `slugify` helper |
| `src/app/docs/DocsLayout.tsx` | 4.1 | Tokens |
| `src/app/docs/DocsToc.tsx` | 4.2 | Tokens |
| `src/app/docs/DocsBreadcrumb.tsx` | 4.3 | Tokens |
| `src/app/docs/DocsPagination.tsx` | 4.4 | Tokens |
| `src/app/docs/DocsSearch.tsx` | 4.5 | Tokens (includes `SearchTrigger` sibling) |
| `src/app/docs/DocsMobileSidebar.tsx` | 4.6 | Tokens |
| `src/app/docs/DocsPage.tsx` | 4.7 | Tokens |

### Files NOT touched (intentional)

- `src/lib/docs/use-headings.ts` — queries DOM `h2[id], h3[id]`; continues to work as long as rehype-slug generates ids.
- `src/components/shared/RouteLoading.tsx`, `DarkModeToggle.tsx`, `MobileTutorialDialog.tsx` — already on tokens from P0–P3.
- Other `features/editor/**`, `features/schema-detail/**`, `features/wizard/**`, `features/compare/**`, `features/gallery/**` — already on tokens.
- `src/content/**/*.mdx` — tutorial markup is source-of-truth.

---

## Task 1: Foundation — install deps, token bridge, dual-theme shiki

**Goal:** Install plugins and register them so the machinery is live. Visual output MUST be unchanged after this commit.

**Files:**
- Modify: `package.json`, `package-lock.json` (via npm)
- Modify: `tailwind.config.ts`
- Modify: `src/index.css`
- Modify: `vite.config.ts`

- [ ] **Step 1: Confirm no existing docs anchors exist in MDX**

The spec's R3 risk mitigation requires this check. If any `](#...)` link exists in tutorials, their target ids will change when rehype-slug takes over.

Run:
```bash
grep -rn '](#' /Users/weibo/Code/rime-craft/src/content || echo "none found"
```
Expected output: `none found` (or an empty grep result).

If any matches surface, STOP and surface to the user — the migration may break internal anchors. Decide whether to (a) update those links to match rehype-slug output post-migration, or (b) ship a custom slugger that mirrors the current `slugify()`.

- [ ] **Step 2: Install dependencies**

```bash
cd /Users/weibo/Code/rime-craft
npm install --save-dev '@tailwindcss/typography' rehype-slug
```

Expected: both added to `devDependencies`; `package-lock.json` updated; no peer-dependency warnings severe enough to need `--legacy-peer-deps`.

- [ ] **Step 3: Register typography plugin in Tailwind**

Edit `tailwind.config.ts`. Change:
```ts
import tailwindcssAnimate from 'tailwindcss-animate'
```
to:
```ts
import tailwindcssAnimate from 'tailwindcss-animate'
import typography from '@tailwindcss/typography'
```
and change:
```ts
  plugins: [tailwindcssAnimate],
```
to:
```ts
  plugins: [tailwindcssAnimate, typography],
```

- [ ] **Step 4: Add prose token bridge in `src/index.css`**

Append the following immediately after the existing `@layer base { body { ... } }` block (i.e., after the closing brace of line 65):

```css
@layer base {
  /* Route the prose plugin's colors through the app's CSS tokens so one
     class (`prose`) renders correctly in both light and dark mode without
     needing `dark:prose-invert`. */
  .prose {
    --tw-prose-body: hsl(var(--foreground) / 0.85);
    --tw-prose-headings: hsl(var(--foreground));
    --tw-prose-links: hsl(217 91% 60%);
    --tw-prose-bold: hsl(var(--foreground));
    --tw-prose-quotes: hsl(var(--muted-foreground));
    --tw-prose-quote-borders: hsl(var(--border));
    --tw-prose-bullets: hsl(var(--muted-foreground));
    --tw-prose-hr: hsl(var(--border));
    --tw-prose-code: hsl(var(--foreground));
    --tw-prose-th-borders: hsl(var(--border));
    --tw-prose-td-borders: hsl(var(--border));
  }
  .dark .prose {
    --tw-prose-body: hsl(var(--foreground) / 0.9);
    --tw-prose-headings: hsl(var(--foreground));
    --tw-prose-links: hsl(217 91% 70%);
    --tw-prose-bold: hsl(var(--foreground));
    --tw-prose-quotes: hsl(var(--muted-foreground));
    --tw-prose-quote-borders: hsl(var(--border));
    --tw-prose-bullets: hsl(var(--muted-foreground));
    --tw-prose-hr: hsl(var(--border));
    --tw-prose-code: hsl(var(--foreground));
    --tw-prose-th-borders: hsl(var(--border));
    --tw-prose-td-borders: hsl(var(--border));
  }
}
```

- [ ] **Step 5: Configure dual-theme rehype-pretty-code + rehype-slug in `vite.config.ts`**

Change the rehype chain. Replace the existing `rehypePlugins` section so the file reads:

```ts
import { defineConfig } from 'vitest/config'
import mdx from '@mdx-js/rollup'
import remarkGfm from 'remark-gfm'
import remarkDirective from 'remark-directive'
import remarkDirectiveRehype from 'remark-directive-rehype'
import rehypePrettyCode from 'rehype-pretty-code'
import rehypeSlug from 'rehype-slug'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [
    mdx({
      providerImportSource: '@mdx-js/react',
      remarkPlugins: [remarkGfm, remarkDirective, remarkDirectiveRehype],
      rehypePlugins: [
        rehypeSlug,
        [
          rehypePrettyCode,
          {
            theme: { light: 'github-light', dark: 'one-dark-pro' },
            keepBackground: true,
          },
        ],
      ],
    }),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'happy-dom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
  },
})
```

Key points: `rehypeSlug` is listed **before** `rehypePrettyCode` so `id`s exist when shiki processes the tree; `theme` is a `{ light, dark }` object so shiki emits both variants.

- [ ] **Step 6: Run typecheck, lint, build, test**

```bash
cd /Users/weibo/Code/rime-craft
npm run typecheck
npm run lint
npm run build
npm test -- --reporter=dot
```

Expected: all four exit 0. `build` output includes a bundle size line; note the `dist/assets/index-*.css` file size — this is the before number for R6.

- [ ] **Step 7: Manual spot-check**

Start the dev server and confirm nothing looks different:
```bash
npm run dev
```
Visit `/editor` (toggle dark mode on/off) and `/docs/what-is-rime` (toggle dark mode). Expected: identical to pre-Task-1 visual. Kill the server.

- [ ] **Step 8: Commit**

```bash
cd /Users/weibo/Code/rime-craft
git add package.json package-lock.json tailwind.config.ts src/index.css vite.config.ts
git commit -m "$(cat <<'EOF'
Lay typography + rehype-slug foundation without visible change

Install @tailwindcss/typography and rehype-slug. Register the typography
plugin in tailwind.config.ts. Add a .prose / .dark .prose token bridge
in src/index.css that points every --tw-prose-* variable at the app's
CSS tokens (so a single `prose` class renders correctly in both modes
without dark:prose-invert). Switch rehype-pretty-code to { light,
dark } dual theme and slot rehype-slug in front of it so MDX headings
get github-slugger-generated ids before shiki processes the tree.

Nothing consumes `.prose` yet and the light shiki variant stays
invisible without .dark being absent, so this commit is a no-op
visually. Exits only after typecheck + lint + build + tests pass.
EOF
)"
```

The pre-commit hook will run typecheck + lint-staged.

---

## Task 2: Theme-aware code-block shells

**Goal:** First visible commit — in light mode, `CodeBlock` / `YamlPreview` exteriors go light, shiki's `github-light` variant colors the code.

**Files:**
- Modify: `src/components/shared/CodeBlock.tsx`
- Modify: `src/components/shared/YamlPreview.tsx`

- [ ] **Step 1: Rewrite `CodeBlock.Pre` outer shell**

Edit `src/components/shared/CodeBlock.tsx`. Change the `Pre` component body so it reads:

```tsx
  return (
    <div className="group relative my-4 overflow-hidden rounded-lg border border-border bg-card">
      {title && (
        <div className="flex items-center justify-between border-b border-border bg-muted px-4 py-2">
          <span className="text-xs text-muted-foreground">{title}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Copy code"
          >
            {copied ? (
              <><Check className="h-3.5 w-3.5" /><span>Copied!</span></>
            ) : (
              <><Copy className="h-3.5 w-3.5" /><span>Copy</span></>
            )}
          </button>
        </div>
      )}
      {!title && (
        <button
          onClick={handleCopy}
          className="absolute right-3 top-3 flex items-center gap-1 rounded bg-background/70 px-2 py-1 text-xs text-muted-foreground opacity-0 backdrop-blur transition-opacity hover:text-foreground group-hover:opacity-100"
          aria-label="Copy code"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      )}
      <pre ref={preRef} className="overflow-x-auto p-4 text-sm leading-relaxed" {...props}>
        {children}
      </pre>
    </div>
  )
```

Key swaps, for reviewer reference:
- Outer wrapper `border-slate-700 bg-slate-800 dark:border-slate-700 dark:bg-slate-950` → `border-border bg-card`.
- Title bar `border-slate-700 bg-slate-900 dark:bg-slate-950` → `border-border bg-muted`.
- Title span `text-slate-400` → `text-muted-foreground`.
- Inline copy button `text-slate-500 hover:text-slate-300` → `text-muted-foreground hover:text-foreground`.
- Floating copy button `bg-slate-700/50 text-slate-400 hover:text-slate-200` → `bg-background/70 text-muted-foreground hover:text-foreground` with `backdrop-blur` added so it still stands out on shiki's painted background.

`InlineCode` at line 60 already uses tokens (shipped in `82283a9`) — do not touch.

- [ ] **Step 2: Rewrite `YamlPreview` outer shell**

Edit `src/components/shared/YamlPreview.tsx`. Replace the JSX body so it reads:

```tsx
  return (
    <figure className="my-4">
      <div
        className={cn(
          'overflow-hidden rounded-lg border border-border bg-card',
          diff && 'yaml-preview-diff',
        )}
        data-highlight-lines={highlight ? highlight.join(',') : undefined}
      >
        {title && (
          <div className="border-b border-border bg-muted px-4 py-2 text-xs text-muted-foreground">
            {title}
          </div>
        )}
        <div
          className={cn(
            '[&_pre]:my-0 [&_pre]:overflow-x-auto [&_pre]:bg-transparent [&_pre]:p-4',
            '[&_pre]:text-sm [&_pre]:leading-relaxed [&_pre]:border-0',
            diff && '[&_code_span[data-line-diff="add"]]:bg-green-500/10',
            diff && '[&_code_span[data-line-diff="del"]]:bg-red-500/10',
          )}
        >
          {children}
        </div>
      </div>
      {caption && (
        <figcaption className="mt-2 text-xs italic text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  )
```

The `[&_pre]:bg-transparent` is kept so shiki's painted theme background (light in light mode, dark in dark mode) shows through.

- [ ] **Step 3: Run typecheck, lint, build, test**

```bash
cd /Users/weibo/Code/rime-craft
npm run typecheck
npm run lint
npm run build
npm test -- --reporter=dot
```

Expected: all exit 0.

- [ ] **Step 4: Manual contrast check for github-light**

```bash
npm run dev
```

Open `/docs/installation` (has shell code blocks) and `/docs/key-bindings` (has YAML blocks). With the system in **light mode**:

- Keywords / strings / comments from `github-light` should be legible on the white `bg-card`.
- The "Copy" affordance must be visible (not washed out).
- The title bar on block-with-title should read as a distinct strip above the code.

Toggle to dark mode: the code block should look as it did pre-Task-2 (one-dark-pro on a near-black `bg-card`).

If light-mode contrast is inadequate, substitute the theme name in `vite.config.ts` with one of (in preference order): `min-light`, `catppuccin-latte`, `vitesse-light`. Repeat this step. Kill the server after approval.

- [ ] **Step 5: Commit**

```bash
cd /Users/weibo/Code/rime-craft
git add src/components/shared/CodeBlock.tsx src/components/shared/YamlPreview.tsx
git commit -m "$(cat <<'EOF'
Make code-block shells theme-aware

CodeBlock.Pre and YamlPreview outer wrappers switch to bg-card /
border-border; title bars switch to bg-muted; title and copy-button
text to text-muted-foreground. shiki (configured in Task 1 for dual
theme) paints the actual code background, so the shell stays neutral
and follows the global dark-mode toggle.
EOF
)"
```

---

## Task 3: Wire prose, remove redundant mdx overrides

**Goal:** `mdx-components.tsx` shrinks from ~140 lines to ~50; prose takes over plain HTML styling.

**Files:**
- Modify: `src/features/editor/TutorialPanel.tsx`
- Modify: `src/features/editor/ImmersiveView.tsx`
- Modify: `src/components/shared/mdx-components.tsx`

- [ ] **Step 1: Add prose class on the TutorialPanel MDX container**

Edit `src/features/editor/TutorialPanel.tsx`. Find the line:
```tsx
      <div className="max-w-none p-4">
```
Replace with:
```tsx
      <div className="prose prose-sm max-w-none p-4">
```

- [ ] **Step 2: Add prose class on the ImmersiveView MDX container**

Edit `src/features/editor/ImmersiveView.tsx`. Find the line:
```tsx
          <div className="max-w-none">
```
Replace with:
```tsx
          <div className="prose prose-sm max-w-none">
```

- [ ] **Step 3: Collapse `mdx-components.tsx` to business shells only**

Replace the entire contents of `src/components/shared/mdx-components.tsx` with:

```tsx
import type { ComponentPropsWithoutRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useConfigStore } from '@/stores/config-store'
import { MODULE_REGISTRY } from '@/data/module-registry'
import type { EditorModule } from '@/types/config'
import { GoToConfigButton } from './GoToConfigButton'
import { ConfigSlot } from './ConfigSlot'
import { Pre, InlineCode } from './CodeBlock'
import { Callout } from './Callout'
import { Details } from './Details'
import { StepGuide, Step } from './StepGuide'
import { YamlPreview } from './YamlPreview'

/** Map tutorial slug (used in MDX links) → editor module ID */
function findModuleByTutorialSlug(slug: string): EditorModule | undefined {
  return MODULE_REGISTRY.find((m) => (m.tutorialSlug ?? m.id) === slug)?.id
}

export const mdxComponents = {
  GoToConfigButton,
  ConfigSlot,
  Details,
  StepGuide,
  Step,
  YamlPreview,

  tip: (props: Record<string, unknown>) => <Callout calloutType="tip" {...props} />,
  warning: (props: Record<string, unknown>) => <Callout calloutType="warning" {...props} />,
  note: (props: Record<string, unknown>) => <Callout calloutType="note" {...props} />,
  caution: (props: Record<string, unknown>) => <Callout calloutType="caution" {...props} />,

  // Business-logic shells: retained because they do more than style.

  a: function MdxLink({ href, ...rest }: ComponentPropsWithoutRef<'a'>) {
    const location = useLocation()
    const setActiveModule = useConfigStore((s) => s.setActiveModule)
    const className = 'text-blue-600 underline decoration-blue-300 underline-offset-2 hover:text-blue-800 dark:text-blue-400 dark:decoration-blue-700 dark:hover:text-blue-300'

    // Relative tutorial links (./slug)
    if (href?.startsWith('./')) {
      const slug = href.slice(2)

      // In editor: switch to corresponding module if it exists
      if (location.pathname === '/editor') {
        const moduleId = findModuleByTutorialSlug(slug)
        if (moduleId) {
          return (
            <a
              className={className}
              role="button"
              onClick={(e) => { e.preventDefault(); setActiveModule(moduleId) }}
              {...rest}
            />
          )
        }
      }

      // Otherwise (docs page, or slug has no editor module): navigate to docs
      return <Link to={`/docs/${slug}`} className={className} {...rest} />
    }

    // Absolute internal links → use React Router
    if (href?.startsWith('/')) {
      return <Link to={href} className={className} {...rest} />
    }

    // External links, anchors, etc. → plain <a>
    return <a className={className} href={href} {...rest} />
  },

  // Wrap tables in a horizontal-scroll container. Prose styles the inner
  // <thead>/<th>/<td> via --tw-prose-* variables defined in index.css.
  table: (props: ComponentPropsWithoutRef<'table'>) => (
    <div className="my-4 overflow-x-auto">
      <table className="w-full border-collapse text-sm" {...props} />
    </div>
  ),

  // Directive dispatcher: remark-directive-rehype emits <div
  // data-directive="tip"> etc., which this turns into <Callout>.
  div: (props: ComponentPropsWithoutRef<'div'>) => {
    const directive = (props as Record<string, unknown>)['data-directive'] as string | undefined
    if (directive && ['tip', 'warning', 'note', 'caution'].includes(directive)) {
      return <Callout {...props} />
    }
    return <div {...props} />
  },

  pre: Pre,
  code: InlineCode,
}
```

Deletions, for reviewer reference: `slugify`, `h1`, `h2`, `h3`, `p`, `ul`, `ol`, `li`, `blockquote`, `thead`, `th`, `td`, `hr`, `strong`.

- [ ] **Step 4: Run typecheck, lint, build, test**

```bash
cd /Users/weibo/Code/rime-craft
npm run typecheck
npm run lint
npm run build
npm test -- --reporter=dot
```

Expected: all exit 0. No test in `src/**` exercises the deleted HTML tag overrides directly (verified pre-plan via `grep -r 'mdxComponents' src/**/*.test.*`).

- [ ] **Step 5: Manual verification — editor tutorials**

```bash
npm run dev
```

Visit `/editor` and cycle through three modules: `schema-manager`, `candidate-settings`, `key-bindings`. In the tutorial panel:

- Headings visibly render with prose's default hierarchy (h2 bigger than h3, consistent margins).
- Paragraph body reads cleanly in both light and dark mode.
- `:::tip` blocks are still rendered as a Callout (blue pill with 💡).
- Any `./slug` link in the tutorial body, when clicked, switches the active module (not navigates away).
- `<ConfigSlot>`, `<StepGuide>`, `<YamlPreview>` blocks still render as their custom components.

Click "沉浸模式 →" and repeat the same check inside `ImmersiveView`.

- [ ] **Step 6: Manual verification — docs route**

Visit `/docs/what-is-rime` then `/docs/schema-manager`:

- Content renders in both light and dark mode.
- The right-rail TOC (`DocsToc`) still lists every `h2` / `h3` — confirming rehype-slug set ids.
- Clicking a TOC item scrolls to the correct heading.

Kill the dev server.

- [ ] **Step 7: Commit**

```bash
cd /Users/weibo/Code/rime-craft
git add src/features/editor/TutorialPanel.tsx src/features/editor/ImmersiveView.tsx src/components/shared/mdx-components.tsx
git commit -m "$(cat <<'EOF'
Delegate MDX plain-HTML styling to @tailwindcss/typography

TutorialPanel and ImmersiveView re-adopt prose prose-sm max-w-none on
the MDX container (stripped in 82283a9 when typography wasn't yet
installed). mdx-components.tsx drops the h1/h2/h3/p/ul/ol/li/
blockquote/hr/strong/thead/th/td overrides and the in-file slugify
helper; prose handles their visual style, rehype-slug (wired in Task
1) handles the heading id generation that useHeadings queries via
[id] selectors. The file shrinks to ~90 lines, retaining only the
five business components and the three HTML shells that do real work:
`a` (router-aware), `div` (directive dispatch), `table` (overflow
wrapper).
EOF
)"
```

---

## Task 4.1: DocsLayout — tokens

**Goal:** Collapse the paired gray/slate classes on the desktop sidebar, mobile sidebar trigger, and right-rail TOC container. Seven per-file commits follow the spec's bisect-friendly guidance.

**File:** `src/app/docs/DocsLayout.tsx`

- [ ] **Step 1: Rewrite the JSX**

Replace the file body with:

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
      {/* Mobile sidebar trigger */}
      <div className="fixed left-0 right-0 top-[57px] z-30 flex items-center border-b bg-background px-4 py-2 lg:hidden">
        <DocsMobileSidebar />
        <span className="ml-2 text-sm font-medium text-foreground/90">Tutorial</span>
      </div>

      {/* Desktop/Tablet sidebar */}
      <ScrollArea className="hidden w-[220px] flex-shrink-0 border-r border-border bg-muted/30 lg:block">
        <nav className="p-4">
          {TUTORIAL_NAV.map((section) => (
            <div key={section.title} className="mb-6">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                          ? 'border-l-2 border-blue-500 bg-background font-medium text-foreground shadow-sm'
                          : 'text-foreground/80 hover:bg-accent',
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
        <aside className="hidden w-[180px] flex-shrink-0 overflow-y-auto border-l border-border px-4 py-8 xl:block">
          <DocsToc slug={slug} />
        </aside>
      </div>
    </div>
  )
}
```

Swaps, for reviewer reference:
- mobile trigger span: `text-gray-700 dark:text-slate-300` → `text-foreground/90`
- desktop sidebar frame: `border-gray-200 bg-gray-50 dark:border-slate-800 dark:bg-slate-900` → `border-border bg-muted/30`
- section heading: `text-gray-400 dark:text-slate-500` → `text-muted-foreground`
- active item: `bg-white font-medium text-gray-900 shadow-sm dark:bg-slate-800 dark:text-slate-100` → `bg-background font-medium text-foreground shadow-sm` (preserves the `border-l-2 border-blue-500` accent stripe)
- inactive item: `text-gray-600 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800` → `text-foreground/80 hover:bg-accent`
- right-rail aside: `border-gray-100 dark:border-slate-800` → `border-border`

- [ ] **Step 2: Run typecheck, lint, build**

```bash
cd /Users/weibo/Code/rime-craft
npm run typecheck
npm run lint
npm run build
```

- [ ] **Step 3: Manual check**

```bash
npm run dev
```

Visit `/docs/what-is-rime`. Confirm in both light and dark mode:
- Sidebar is visible, distinguishable from the main content area (slight tint).
- Active page's item is clearly highlighted with the blue stripe.
- Section headings are dim but readable.
- Right-rail aside border is visible but subtle.

Kill the server.

- [ ] **Step 4: Commit**

```bash
cd /Users/weibo/Code/rime-craft
git add src/app/docs/DocsLayout.tsx
git commit -m "Move DocsLayout off slate palette onto shared tokens"
```

---

## Task 4.2: DocsToc — tokens

**File:** `src/app/docs/DocsToc.tsx`

- [ ] **Step 1: Rewrite the JSX**

Replace the file body with:

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
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        On this page
      </h4>
      <ul className="space-y-1 border-l-2 border-border">
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
                  : 'border-transparent text-muted-foreground hover:text-foreground',
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

- [ ] **Step 2: Run typecheck, lint, build**

```bash
cd /Users/weibo/Code/rime-craft
npm run typecheck
npm run lint
npm run build
```

- [ ] **Step 3: Manual check**

Dev server → `/docs/schema-manager` (has enough headings for a meaningful TOC). Scroll the body; confirm the active heading highlight follows the scroll in both modes.

- [ ] **Step 4: Commit**

```bash
cd /Users/weibo/Code/rime-craft
git add src/app/docs/DocsToc.tsx
git commit -m "Move DocsToc off slate palette onto shared tokens"
```

---

## Task 4.3: DocsBreadcrumb — tokens

**File:** `src/app/docs/DocsBreadcrumb.tsx`

- [ ] **Step 1: Rewrite the JSX**

Replace the file body with:

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
    <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
      <Link
        to={`/docs/${firstSlug}`}
        className="transition-colors hover:text-foreground"
      >
        {section.title}
      </Link>
      <ChevronRight className="h-3.5 w-3.5" />
      <span className="text-foreground">{pageTitle}</span>
    </nav>
  )
}
```

- [ ] **Step 2: Run typecheck, lint, build**

```bash
cd /Users/weibo/Code/rime-craft
npm run typecheck
npm run lint
npm run build
```

- [ ] **Step 3: Manual check**

Dev server → any `/docs/<slug>`. Breadcrumb at the top of the page renders with the section link dim, the current page name bold/solid, chevron between them.

- [ ] **Step 4: Commit**

```bash
cd /Users/weibo/Code/rime-craft
git add src/app/docs/DocsBreadcrumb.tsx
git commit -m "Move DocsBreadcrumb off slate palette onto shared tokens"
```

---

## Task 4.4: DocsPagination — tokens

**File:** `src/app/docs/DocsPagination.tsx`

- [ ] **Step 1: Rewrite the JSX**

Replace the file body with:

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
    <nav className="mt-12 flex items-stretch justify-between border-t border-border pt-6">
      {prev ? (
        <Link
          to={`/docs/${prev.slug}`}
          className="group flex items-center gap-2 rounded-lg border border-border px-4 py-3 transition-colors hover:border-blue-300 hover:bg-blue-50 dark:hover:border-blue-700 dark:hover:bg-blue-950/30"
        >
          <ChevronLeft className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-blue-500" />
          <div>
            <div className="text-xs text-muted-foreground">Previous</div>
            <div className="text-sm font-medium text-foreground">{prev.title}</div>
          </div>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          to={`/docs/${next.slug}`}
          className="group flex items-center gap-2 rounded-lg border border-border px-4 py-3 text-right transition-colors hover:border-blue-300 hover:bg-blue-50 dark:hover:border-blue-700 dark:hover:bg-blue-950/30"
        >
          <div>
            <div className="text-xs text-muted-foreground">Next</div>
            <div className="text-sm font-medium text-foreground">{next.title}</div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-blue-500" />
        </Link>
      ) : (
        <div />
      )}
    </nav>
  )
}
```

The informational `hover:border-blue-300 hover:bg-blue-50 dark:hover:border-blue-700 dark:hover:bg-blue-950/30` hover state is preserved as-is — it's a meaning color, not neutral.

- [ ] **Step 2: Run typecheck, lint, build**

```bash
cd /Users/weibo/Code/rime-craft
npm run typecheck
npm run lint
npm run build
```

- [ ] **Step 3: Manual check**

Dev server → a page that has both prev and next (e.g. `/docs/schema-manager`). Hover the prev/next cards: border should turn blue, background tint to blue in both modes.

- [ ] **Step 4: Commit**

```bash
cd /Users/weibo/Code/rime-craft
git add src/app/docs/DocsPagination.tsx
git commit -m "Move DocsPagination off slate palette onto shared tokens"
```

---

## Task 4.5: DocsSearch — tokens (includes SearchTrigger)

**File:** `src/app/docs/DocsSearch.tsx`

This file exports two components: `DocsSearch` (the Cmd-K modal) and `SearchTrigger` (the button in the app header).

- [ ] **Step 1: Rewrite the JSX**

Replace the file body with:

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

  useEffect(() => {
    if (open) {
      setQuery('')
      setResults([])
      setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    if (!query.trim()) {
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
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={() => setOpen(false)}
      />
      <div className="fixed inset-x-0 top-[15%] z-50 mx-auto w-full max-w-lg px-4">
        <div className="overflow-hidden rounded-xl border border-border bg-background shadow-2xl">
          <div className="flex items-center border-b border-border px-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search tutorials..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent px-3 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            <kbd className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
              Esc
            </kbd>
          </div>
          <div className="max-h-80 overflow-y-auto p-2">
            {results.length === 0 && query.trim() !== '' && (
              <p className="py-6 text-center text-sm text-muted-foreground">
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
                    : 'text-foreground/90 hover:bg-accent'
                }`}
              >
                <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div>
                  <div className="font-medium">{result.title}</div>
                  <div className="text-xs text-muted-foreground">
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

export function SearchTrigger() {
  return (
    <button
      onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
      className="hidden items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent md:flex"
    >
      <Search className="h-3.5 w-3.5" />
      <span>Search...</span>
      <kbd className="rounded bg-muted px-1 text-xs">&#8984;K</kbd>
    </button>
  )
}
```

Informational colors preserved: `bg-blue-50 text-blue-900 dark:bg-blue-950/50 dark:text-blue-100` on the selected search result row.

- [ ] **Step 2: Run typecheck, lint, build**

```bash
cd /Users/weibo/Code/rime-craft
npm run typecheck
npm run lint
npm run build
```

- [ ] **Step 3: Manual check**

Dev server → any `/docs/...` page. Press `Cmd-K` (macOS) or `Ctrl-K` (others). Modal appears with:
- Search input legible in both modes.
- `Esc` keycap visible.
- Result list items have dim meta-line and bold title.
- Arrow keys highlight rows (selected row has blue tint — unchanged).

Close the modal. Look at the app header's "Search…" trigger pill: bordered, muted, cursor-pointer.

- [ ] **Step 4: Commit**

```bash
cd /Users/weibo/Code/rime-craft
git add src/app/docs/DocsSearch.tsx
git commit -m "Move DocsSearch + SearchTrigger off slate palette onto shared tokens"
```

---

## Task 4.6: DocsMobileSidebar — tokens

**File:** `src/app/docs/DocsMobileSidebar.tsx`

- [ ] **Step 1: Rewrite the JSX**

Replace the file body with:

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
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto bg-background p-6 shadow-xl lg:hidden">
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
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                              ? 'border-l-2 border-blue-500 bg-blue-50 font-medium text-foreground dark:bg-blue-950/30'
                              : 'text-foreground/80 hover:bg-accent',
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

- [ ] **Step 2: Run typecheck, lint, build**

```bash
cd /Users/weibo/Code/rime-craft
npm run typecheck
npm run lint
npm run build
```

- [ ] **Step 3: Manual check**

Dev server → any `/docs/...`. Narrow the viewport below `lg` (<1024px). Click the hamburger:
- Drawer slides / appears from the left with solid `bg-background`.
- Section headings dim, active page has blue left stripe + subtle blue tint.
- Hovering inactive items tints them subtly.
- Close button (`X`) visible in both modes.

- [ ] **Step 4: Commit**

```bash
cd /Users/weibo/Code/rime-craft
git add src/app/docs/DocsMobileSidebar.tsx
git commit -m "Move DocsMobileSidebar off slate palette onto shared tokens"
```

---

## Task 4.7: DocsPage — tokens

**File:** `src/app/docs/DocsPage.tsx`

- [ ] **Step 1: Rewrite the JSX**

Replace the file body with:

```tsx
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
    return <p className="text-muted-foreground">页面不存在。</p>
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-4 w-32 rounded bg-muted" />
        <div className="h-8 w-64 rounded bg-muted" />
        <div className="h-4 w-full rounded bg-muted/60" />
        <div className="h-4 w-3/4 rounded bg-muted/60" />
      </div>
    )
  }

  if (!Content) {
    return <p className="text-muted-foreground">内容暂未编写。</p>
  }

  return (
    <>
      <DocsBreadcrumb slug={resolvedSlug} pageTitle={item.title} />
      <div data-docs-content className="prose prose-sm max-w-none">
        <MDXProvider components={mdxComponents}>
          <Content />
        </MDXProvider>
      </div>
      <DocsPagination slug={resolvedSlug} />
    </>
  )
}
```

Two changes beyond bare class-rewriting:
1. Skeleton placeholders use `bg-muted` (strong rows) and `bg-muted/60` (faint rows) instead of `bg-gray-200 dark:bg-slate-700` / `bg-gray-100 dark:bg-slate-800`.
2. The MDX container gains `className="prose prose-sm max-w-none"` so **docs-route MDX also uses prose** (Task 3 only covered editor's TutorialPanel / ImmersiveView). The `data-docs-content` attribute stays so `useHeadings` can still query this container.

- [ ] **Step 2: Run typecheck, lint, build**

```bash
cd /Users/weibo/Code/rime-craft
npm run typecheck
npm run lint
npm run build
```

- [ ] **Step 3: Manual check**

Dev server → `/docs/schema-manager`:
- Page body text styling matches the editor tutorial panel (they share the prose class now).
- Right-rail TOC still detects headings (rehype-slug + useHeadings).
- Intentional navigation test: `./candidate-settings` style links inside the MDX body navigate to `/docs/candidate-settings` (the `a` business shell in mdxComponents).

Try one "page not found" case: visit `/docs/does-not-exist`. Should show "页面不存在。" in muted foreground.

- [ ] **Step 4: Run the full test suite one more time**

This is the final file of the migration; run all tests:

```bash
cd /Users/weibo/Code/rime-craft
npm run typecheck
npm run lint
npm run build
npm test -- --reporter=dot
```

Expected: all exit 0; 417 tests pass.

- [ ] **Step 5: Commit**

```bash
cd /Users/weibo/Code/rime-craft
git add src/app/docs/DocsPage.tsx
git commit -m "$(cat <<'EOF'
Move DocsPage off slate palette onto shared tokens

Also opt the docs-route MDX container into prose prose-sm max-w-none so
docs pages pick up the same typography baseline as the editor tutorial
panel. data-docs-content stays on the wrapper so useHeadings can still
query it for the right-rail TOC.
EOF
)"
```

---

## Post-migration check

After all four tasks (one Task 1, one Task 2, one Task 3, seven Task 4.x commits = 10 commits total) are in, do one last cross-cutting pass:

- [ ] **Step 1: Verify no stray slate/gray pairings remain in scope**

```bash
cd /Users/weibo/Code/rime-craft
grep -rn 'dark:bg-slate-\|dark:text-slate-\|dark:border-slate-' \
  src/app/docs src/components/shared/CodeBlock.tsx \
  src/components/shared/YamlPreview.tsx \
  src/components/shared/mdx-components.tsx \
  src/features/editor/TutorialPanel.tsx \
  src/features/editor/ImmersiveView.tsx
```

Expected: nothing (or only `dark:bg-blue-*` hover/active states, which are informational colors and are preserved intentionally).

- [ ] **Step 2: Final bundle-size delta check**

```bash
npm run build
```

Note the new `dist/assets/index-*.css` size and compare to the pre-Task-1 baseline. Spec R6 calls this out at budget <2KB gzipped increase; flag to user if the increase exceeds that.

- [ ] **Step 3: Post-migration summary comment**

In a single PR / log, list:
- Which shiki light theme was used (github-light, or the alternate if contrast forced a swap).
- Any MDX pages where prose defaults introduced layout friction worth a `typography.DEFAULT.css` override in `tailwind.config.ts`.
- Whether `useHeadings` still returns the expected headings on every tutorial (sanity check vs. rehype-slug's id output).

---

## Self-Review

**Spec coverage.** Walking the spec section by section:

- §"Chosen architecture" / "High-level" → reproduced in plan introduction; Tasks 1–4 map onto the before/after diagram.
- §"Core principles" 1 → Task 3 Step 3.
- §"Core principles" 2 → Tasks 4.1–4.7 + Task 2.
- §"Core principles" 3 → Task 1 Step 5, Task 2.
- §"`mdx-components.tsx` after refactor" → Task 3 Step 3 (complete replacement shown).
- §"Heading slugging" → Task 1 Step 5 (rehype-slug wired), Task 3 Step 3 (slugify helper removed).
- §"`index.css` — prose token bridge" → Task 1 Step 4 (full CSS shown).
- §"`vite.config.ts` — shiki dual theme" → Task 1 Step 5.
- §"CodeBlock / YamlPreview — token-wrapped" → Task 2 Steps 1–2.
- §"Docs route UI — token mapping" → Tasks 4.1–4.7 (each file has a full rewritten listing).
- §"Migration path" Steps 1–4 → Tasks 1–4.
- §"Risks & mitigations" R1–R6 → R1 / R3 surface in Task 3 Step 5 (manual review) and Post-migration Step 3 / Task 1 Step 1. R2 is Task 2 Step 4 (theme substitution path). R4 / R5 / R6 are captured at Task 1 Step 6 and Post-migration Step 2.
- §"Testing" — reflected in manual verification steps after each task + existing 417-test run in Task 1 Step 6 / Task 4.7 Step 4.

**Placeholder scan.** No TBD/TODO/"implement later"; no "add appropriate X" phrases; every code-change step includes the full new code. One or two "for reviewer reference" bullets explain the diff semantics but do not replace the full rewrites.

**Type consistency.** `mdxComponents` shape in Task 3 Step 3 exports `GoToConfigButton, ConfigSlot, Details, StepGuide, Step, YamlPreview, tip, warning, note, caution, a, table, div, pre, code` — matches the spec's "retained" list. No type is referenced that isn't in scope.

**Ambiguity.** Task 4.7 Step 1 adds `prose prose-sm max-w-none` to the docs-route MDX container. The spec's Step 3 explicitly talks about TutorialPanel / ImmersiveView but implies docs pages benefit too ("docs pages pick up the same typography baseline"). Called out explicitly in the Task 4.7 commit message and step body so it isn't dropped.
