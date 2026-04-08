# Tutorial Center Redesign — Design Spec

**Date:** 2026-04-07
**Status:** Draft
**Scope:** Complete redesign of the `/docs` tutorial center — fix broken pages, add visual design system, add full UX features

---

## Problem Statement

The tutorial center has three layers of problems:

1. **Broken pages** — Configuration detail pages (配置详解) render blank. Console errors show `GoToConfigButton` and other components fail to resolve at runtime. Root cause: `@mdx-js/react` MDXProvider does not inject components correctly with `@mdx-js/rollup` in MDX v3.
2. **No visual design** — MDX content renders with minimal Tailwind classes. No typography hierarchy, no callout styles, no styled code blocks, no design language.
3. **No UX** — No table of contents, no search, no breadcrumbs, no prev/next navigation, no mobile responsiveness, no dark mode in docs.

## Design Direction

- **Layout:** Clean & minimal (Tailwind/shadcn-inspired), three-column on desktop
- **Code blocks:** Always-dark with syntax highlighting, filename labels, copy button
- **Theme:** Light/dark toggle using existing Tailwind `dark:` class system
- **Approach:** Enhance current stack (Vite + React Router + MDX). No framework migration.

---

## 1. Layout Architecture

### Desktop (≥1280px)

Three-column layout:

```
┌─────────────────────────────────────────────────────────┐
│  Header: Logo | Nav tabs | Search (⌘K) | Dark toggle   │
├──────────┬──────────────────────────────┬───────────────┤
│ Sidebar  │  Main Content               │  TOC          │
│ (220px)  │  (flex, max-w-3xl)          │  (180px)      │
│          │                              │               │
│ Sections │  Breadcrumb                  │  On this page │
│ ├ Items  │  Title + subtitle            │  ├ Section 1  │
│ ├ Items  │  Body content                │  ├ Section 2  │
│          │  Code blocks                 │  ├ Section 3  │
│          │  Callouts                    │               │
│          │  Tables                      │               │
│          │  GoToConfigButton            │               │
│          │                              │               │
│          │  Prev/Next navigation        │               │
└──────────┴──────────────────────────────┴───────────────┘
```

### Tablet (768px–1279px)

Two-column layout:
- Left sidebar (180px) stays visible
- Right TOC collapses → floating "On this page" button that opens a popover
- Content takes remaining width

### Mobile (<768px)

Single-column layout:
- Sidebar → hamburger icon, opens as overlay from left (Radix Dialog/Sheet)
- Search bar → search icon, opens Cmd+K dialog
- TOC hidden (pages are short enough to scroll)
- Full-width content with prev/next at bottom

---

## 2. Visual Design System

### Color Tokens

| Token | Light | Dark |
|-------|-------|------|
| Background | `#ffffff` | `#0f172a` (slate-900) |
| Sidebar bg | `#fafafa` (gray-50) | `#1e293b` (slate-800) |
| Text primary | `#111827` (gray-900) | `#f1f5f9` (slate-100) |
| Text secondary | `#6b7280` (gray-500) | `#94a3b8` (slate-400) |
| Accent | `#3b82f6` (blue-500) | `#60a5fa` (blue-400) |
| Border | `#e5e7eb` (gray-200) | `#1e293b` (slate-800) |
| Code block bg | `#1e293b` (slate-800) | `#020617` (slate-950) |
| Code header bg | `#0f172a` (slate-900) | `#020617` (slate-950) |

### Typography

- **Headings:** System font stack, weights 600–700
  - h1: 24px/1.3, font-weight 700
  - h2: 20px/1.4, font-weight 600, top margin 32px
  - h3: 16px/1.4, font-weight 600, top margin 24px
- **Body:** 15px/1.7, color text-secondary
- **Code inline:** `SF Mono, Monaco, monospace`, 13px, background gray-100/slate-800, rounded
- **Code block:** Same monospace, 14px, line-height 1.6

### Callout Types

Four callout variants, implemented via `remark-directive` syntax in MDX:

| Type | MDX Syntax | Icon | Color (light) | Color (dark) |
|------|-----------|------|---------------|-------------|
| Tip | `:::tip` | 💡 | Blue bg + border | Dark blue bg |
| Warning | `:::warning` | ⚠️ | Yellow bg + border | Dark amber bg |
| Note | `:::note` | ✅ | Green bg + border | Dark green bg |
| Caution | `:::caution` | 🚨 | Red bg + border | Dark red bg |

Style: left border (3px), rounded right corners, icon + label + text.

### Code Blocks

- Always dark background in both light and dark mode
- Header bar with filename label (left) and copy button (right)
- Syntax highlighting via `shiki` with `one-dark-pro` theme
- Languages supported: YAML (primary), bash, lua
- Copy button shows "Copied!" feedback for 2 seconds

### Tables

- Rounded border container with overflow-x-auto
- Header row with subtle background (gray-50 / slate-800)
- Row borders (gray-200 / slate-800)
- Cell padding 8px 16px

### GoToConfigButton

Redesigned as a prominent CTA card at the bottom of configuration pages:
- Blue-tinted background with border
- Wrench icon + label + arrow
- Links to corresponding editor module via Zustand store + router navigation

---

## 3. UX Features

### Search (Cmd+K)

- **Trigger:** `Cmd+K` / `Ctrl+K` keyboard shortcut, or click search bar in header
- **UI:** Radix Dialog centered modal with search input and results list
- **Engine:** `minisearch` — build-time indexing of all MDX content (titles, headings, body text)
- **Results:** Show page title, matched heading, text snippet with highlighted match
- **Navigation:** Arrow keys to navigate, Enter to go to page, Esc to close

### Table of Contents (Right sidebar)

- Auto-extracted from h2/h3 headings in the rendered MDX page
- Scroll-tracking via `IntersectionObserver` — highlights current section
- Click to smooth-scroll to heading
- Active section indicated by blue left border + blue text
- Responsive: visible on desktop, floating button on tablet, hidden on mobile

### Sidebar Navigation

- Sections from `TUTORIAL_NAV`: Getting Started, Configuration, Advanced
- All sections expanded by default (collapsible optional for later)
- Active page: left blue border (2px) + font-weight 500 + white/dark background
- Hover: subtle background change
- Mobile: Radix Sheet overlay from left, closes on navigation

### Breadcrumbs

- Format: `Section Name / Page Title`
- Section name is a link (navigates to first page in section)
- Page title is plain text (current page)
- Positioned above h1

### Prev/Next Pagination

- Bottom of every page, full-width flex container
- Shows: direction label ("Previous"/"Next"), page title, arrow icon
- Sequential order follows `TUTORIAL_NAV` flattened array
- Spans across sections (last page of section → first page of next section)
- First page has no "Previous", last page has no "Next"

### Dark Mode Toggle

- Sun/moon icon button in header
- Uses existing Tailwind `class` dark mode strategy
- Preference stored in `localStorage` key `theme`
- Defaults to system preference via `prefers-color-scheme` media query
- Toggle adds/removes `dark` class on `<html>` element

---

## 4. Technical Implementation

### New Dependencies

| Package | Purpose | Size |
|---------|---------|------|
| `shiki` | Syntax highlighting engine | ~2MB (build-time, tree-shakeable) |
| `rehype-pretty-code` | Shiki integration with MDX rehype pipeline | ~15KB |
| `minisearch` | Client-side full-text search | ~6KB |
| `remark-directive` | Parse `:::tip` directive syntax in MDX | ~3KB |
| `remark-directive-rehype` | Convert directives to rehype nodes | ~2KB |

### File Changes

**Modified files:**

| File | Change |
|------|--------|
| `vite.config.ts` | Add `providerImportSource`, rehype-pretty-code, remark-directive to MDX plugin |
| `src/components/shared/mdx-components.tsx` | Full rewrite — styled components for all HTML elements + Callout + CodeBlock |
| `src/app/docs/DocsLayout.tsx` | Rewrite to three-column responsive layout with mobile sidebar |
| `src/app/docs/DocsPage.tsx` | Add heading extraction for TOC, breadcrumb data, prev/next computation |
| `src/components/shared/GoToConfigButton.tsx` | Restyle as card CTA |
| `src/app/layout/AppLayout.tsx` | Add dark mode toggle, active nav indicator for /docs |
| `src/index.css` | Add dark mode CSS variables for docs-specific tokens if needed |
| `src/content/*.mdx` | Convert tip/warning blockquotes to `:::tip` / `:::warning` directive syntax. Regular blockquotes (plain quotes) remain as `>` blockquotes. |

**New files:**

| File | Purpose |
|------|---------|
| `src/app/docs/DocsToc.tsx` | Right-side table of contents with IntersectionObserver scroll tracking |
| `src/app/docs/DocsSearch.tsx` | Cmd+K search dialog with minisearch |
| `src/app/docs/DocsPagination.tsx` | Prev/next page navigation |
| `src/app/docs/DocsBreadcrumb.tsx` | Section / Page breadcrumb |
| `src/app/docs/DocsMobileSidebar.tsx` | Mobile sidebar overlay |
| `src/components/shared/CodeBlock.tsx` | Code block with filename header + copy button |
| `src/components/shared/Callout.tsx` | Tip/Warning/Note/Caution callout component |
| `src/lib/docs/search-index.ts` | Build-time search index generation from MDX content |

### Component Tree

```
DocsLayout
├── DocsMobileSidebar (mobile only, Radix Sheet)
├── Sidebar (desktop/tablet)
│   └── TUTORIAL_NAV sections → NavLink items
├── Main content area
│   ├── DocsBreadcrumb
│   ├── DocsPage
│   │   └── MDXProvider → MDX Content
│   │       ├── h1, h2, h3 (styled, id-anchored for TOC)
│   │       ├── p, ul, ol, li (styled typography)
│   │       ├── CodeBlock (pre/code with shiki highlighting)
│   │       ├── Callout (:::tip, :::warning, :::note, :::caution)
│   │       ├── table, th, td (styled tables)
│   │       ├── blockquote (styled quotes)
│   │       └── GoToConfigButton (card CTA)
│   └── DocsPagination
├── DocsToc (desktop: fixed column, tablet: floating popover)
└── DocsSearch (global Cmd+K modal)
```

### MDX Pipeline Fix

The root cause of blank pages: `@mdx-js/rollup` compiles MDX at build time but doesn't automatically use the React MDX provider. Fix:

```ts
// vite.config.ts - MDX plugin options
mdx({
  providerImportSource: '@mdx-js/react',
  remarkPlugins: [remarkGfm, remarkDirective, remarkDirectiveRehype],
  rehypePlugins: [[rehypePrettyCode, { theme: 'one-dark-pro', keepBackground: true }]],
})
```

This ensures compiled MDX files look up components from the nearest `<MDXProvider>`, resolving GoToConfigButton and all custom components.

### What Stays the Same

- All 17 MDX content files (content preserved, only tip/warning blockquotes converted to directive syntax)
- `src/data/tutorial-nav.ts` navigation structure
- React Router routing (`/docs/:slug`)
- Zustand config store + GoToConfigButton→editor integration
- All other app pages (editor, theme studio, compare, gallery, wizard)

---

## 5. Out of Scope

- Content rewriting or new tutorial pages
- Connecting docs theme to Theme Studio
- Server-side rendering or static site generation
- i18n / multi-language support
- Version-specific documentation
- Comments or feedback system
