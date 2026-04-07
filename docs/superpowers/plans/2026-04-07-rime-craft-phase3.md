# Rime Craft Phase 3 Implementation Plan

## Context

Phase 1+2 complete: 8 editor modules, YAML editor with dual-sync, MDX tutorials with linking, config diff marking, 5 presets. 56 tests, 20 commits. Phase 3 adds theme studio, input simulator, and advanced tutorials.

**Key technical challenge:** Rime uses `0xBBGGRR` integers for colors in YAML. The `yaml` library parses `0xFFFFFF` as the number 16777215. Serializing back must output hex integers, not decimals. This requires careful handling with the yaml Document/Scalar API.

## Phase 3 Scope (design spec sections 4, 5, 11)

1. Theme studio: color pickers, sliders, font selection, live preview
2. Candidate preview: theme-aware, horizontal/vertical, light/dark preview
3. HEX ↔ 0xBBGGRR color conversion
4. 10+ preset themes
5. Platform-specific export (squirrel vs weasel style format)
6. Input simulator (scoped to: text input + candidates + theme preview)
7. Advanced tutorial content (5 articles)

---

## Task 1: ThemeStyle Types + Color Conversion + Preset Themes

**Why:** Foundation for all theme work.

**Files to modify:**
- `src/types/config.ts` — add ThemeColors (10 fields), ThemeStyle, extend PlatformConfig

**Files to create:**
- `src/lib/color/convert.ts` — HEX↔BGR conversion functions
- `src/lib/color/convert.test.ts`
- `src/data/preset-themes.ts` — 10+ preset themes

### ThemeColors — 10 fields matching Rime's actual format

```typescript
export interface ThemeColors {
  backgroundColor: string;             // back_color — panel background
  borderColor: string;                 // border_color
  textColor: string;                   // text_color — composing area text (pinyin)
  hilitedTextColor: string;            // hilited_text_color — highlighted pinyin
  hilitedBackColor: string;            // hilited_back_color — composing area bg
  candidateTextColor: string;          // candidate_text_color — non-selected candidates
  hilitedCandidateTextColor: string;   // hilited_candidate_text_color — selected candidate text
  hilitedCandidateBackColor: string;   // hilited_candidate_back_color — selected candidate bg
  commentTextColor: string;            // comment_text_color — annotations
  labelColor: string;                  // label_color — candidate number labels
}
```

### ThemeStyle

```typescript
export interface ThemeStyle {
  name: string;
  horizontal: boolean;
  fontFace: string;
  fontSize: number;
  labelFontSize: number;
  cornerRadius: number;
  borderWidth: number;
  lineSpacing: number;
  spacing: number;
  colors: ThemeColors;
}
```

### PlatformConfig extension

```typescript
export interface PlatformConfig {
  platform: 'macos' | 'windows';
  style?: ThemeStyle;       // optional, new in Phase 3
  appOptions: Record<string, AppOption>;
}
```

### Color conversion — handles numbers, not strings

Rime YAML: `back_color: 0xBBGGRR` → parsed by yaml lib as an integer.

```typescript
/**
 * Convert Rime BGR integer to standard HEX string.
 * Example: 16777215 (0xFFFFFF in BGR) → "#FFFFFF" (same in this case)
 * Example: 6750054 (0x66CCFF in BGR) → "#FFCC66"
 */
export function bgrIntToHex(bgr: number): string {
  const hex = bgr.toString(16).padStart(6, '0')
  const bb = hex.substring(0, 2)
  const gg = hex.substring(2, 4)
  const rr = hex.substring(4, 6)
  return `#${rr}${gg}${bb}`
}

/**
 * Convert standard HEX string to Rime BGR integer.
 * Example: "#FFCC66" → 6750207 (0x66CCFF)
 */
export function hexToBgrInt(hex: string): number {
  const clean = hex.replace('#', '')
  const rr = clean.substring(0, 2)
  const gg = clean.substring(2, 4)
  const bb = clean.substring(4, 6)
  return parseInt(`${bb}${gg}${rr}`, 16)
}
```

### Test cases

```typescript
// bgrIntToHex(0x000000) → "#000000"
// bgrIntToHex(0xFFFFFF) → "#FFFFFF"
// bgrIntToHex(0xFF0000) → "#0000FF"  (blue in BGR → blue in RGB)
// bgrIntToHex(0x0000FF) → "#FF0000"  (red in BGR → red in RGB)
// hexToBgrInt("#FF0000") → 0x0000FF   (red RGB → red BGR)
// Round-trip: bgrIntToHex(hexToBgrInt("#AABBCC")) === "#AABBCC"
```

### Preset themes (10+)

Each preset is a complete `ThemeStyle` object. Example presets:
- Default (Rime 默认)
- macOS Native (仿原生鼠须管)
- Material Light / Dark
- Nord
- Dracula
- Solarized Light / Dark
- Monokai
- Gruvbox
- One Dark
- GitHub Light

---

## Task 2: Extend Parser/Serializer/Store for Theme

**Why:** Parse theme from imported YAML, serialize with BGR integers, store actions for theme editing.

**Files to modify:**
- `src/lib/yaml/parser.ts` — extend `mapToPlatformConfig` to parse `style` block, converting BGR integers to HEX
- `src/lib/yaml/parser.test.ts`
- `src/lib/yaml/serializer.ts` — extend `serializePlatformConfig` to include `style`, outputting BGR integers. **Critical:** use `yaml` Document API with Scalar `format: 'HEX'` so output is `0xBBGGRR` not decimal
- `src/lib/yaml/serializer.test.ts`
- `src/stores/config-store.ts` — add `setThemeStyle`, `updateThemeColors`, `updateThemeLayout`
- `src/stores/config-store.test.ts`
- `src/lib/config/defaults.ts` — add `DEFAULT_THEME_STYLE`
- `src/features/share/importer.ts` — parse style block on squirrel/weasel import
- `src/features/share/ExportButton.tsx` — include style in export

### Serializer color output — the critical detail

The `yaml` library's `stringify()` outputs numbers as decimals. To get `0xBBGGRR` format:

```typescript
import { Document, Scalar } from 'yaml'

function buildStyledCustomYaml(patch: Record<string, unknown>): string {
  const doc = new Document({ patch })
  // Walk all color fields and set hex format
  const style = doc.getIn(['patch', 'style'], true)
  if (style && typeof style === 'object') {
    const colorKeys = [
      'back_color', 'border_color', 'text_color', 'hilited_text_color',
      'hilited_back_color', 'candidate_text_color', 'hilited_candidate_text_color',
      'hilited_candidate_back_color', 'comment_text_color', 'label_color',
    ]
    for (const key of colorKeys) {
      const node = (style as any).get(key, true)
      if (node instanceof Scalar) {
        node.format = 'HEX'
      }
    }
  }
  return doc.toString({ lineWidth: 0 })
}
```

### Parser: handle BGR integers from YAML

When parsing squirrel/weasel YAML, the `style` block has color fields as integers:

```typescript
import { bgrIntToHex } from '@/lib/color/convert'

function parseStyleColors(style: Record<string, unknown>): ThemeColors {
  return {
    backgroundColor: bgrIntToHex((style.back_color as number) ?? 0xFFFFFF),
    borderColor: bgrIntToHex((style.border_color as number) ?? 0xCCCCCC),
    textColor: bgrIntToHex((style.text_color as number) ?? 0x000000),
    // ... all 10 fields
  }
}
```

### Store actions

```typescript
setThemeStyle: (style: ThemeStyle) => void      // replace entire theme
updateThemeColors: (colors: Partial<ThemeColors>) => void  // merge color changes
updateThemeLayout: (layout: Partial<Omit<ThemeStyle, 'colors' | 'name'>>) => void  // merge layout changes
```

---

## Task 3: Refactor CandidatePreview (Theme-Aware)

**Why:** Preview must render with real theme colors/fonts/layout, using inline styles for dynamic values.

**File to rewrite:**
- `src/components/shared/CandidatePreview.tsx`

### New interface

```typescript
interface CandidatePreviewProps {
  candidates?: string[];
  labels?: string[];
  comments?: string[];         // annotations next to candidates
  input?: string;
  theme?: ThemeStyle;          // when provided, use theme styling
  darkMode?: boolean;          // preview on dark background
  className?: string;
}
```

### Rendering logic

When `theme` is provided, ALL visual properties come from theme via inline `style`:
- Panel: `backgroundColor`, `borderColor`, `borderWidth`, `borderRadius` (cornerRadius)
- Input text: `hilitedTextColor` color, composing area `hilitedBackColor`
- Selected candidate (first): `hilitedCandidateBackColor` bg, `hilitedCandidateTextColor` text
- Other candidates: `candidateTextColor`
- Labels: `labelColor`, `labelFontSize`
- Comments: `commentTextColor`
- Font: `fontFamily: theme.fontFace`, `fontSize: theme.fontSize`
- Layout: `flexDirection` based on `horizontal`, gaps from `spacing`

When no `theme`: fall back to current Tailwind-based styling (backward compatible for home page).

When `darkMode`: wrap in a dark background container for contrast preview.

---

## Task 4: Theme Editor UI

**Why:** The editing controls for the theme studio.

**Install:** `npx shadcn@latest add slider popover` + `npm install react-colorful`

**Files to create:**
- `src/features/theme/ThemeColorPicker.tsx` — popover with react-colorful HexColorPicker + hex text input
- `src/features/theme/ThemeColorSection.tsx` — grid of 10 color pickers, labeled
- `src/features/theme/ThemeLayoutSection.tsx` — sliders for fontSize (12-24), cornerRadius (0-20), borderWidth (0-5), spacing (0-20), lineSpacing (0-10); horizontal/vertical toggle; font family select
- `src/features/theme/ThemePresetSelector.tsx` — horizontal scrollable preset gallery, each preset shows a mini color swatch
- `src/features/theme/ThemeEditor.tsx` — combines presets + colors + layout sections

### Color picker component

Small square swatch showing current color. Click → popover with HexColorPicker + hex text input. `onChange` fires on every color change.

### Font selector

Predefined list of common Chinese-capable fonts:
- PingFang SC (macOS)
- Microsoft YaHei (Windows)
- Noto Sans CJK SC
- Source Han Sans SC
- Hiragino Sans GB
- WenQuanYi Micro Hei (Linux)
- System default (sans-serif)

Rendered as a Select dropdown. Preview text in each option uses `style={{ fontFamily }}`.

---

## Task 5: Theme Page + Routing

**Why:** The `/theme` page combining editor + live preview.

**Files to create:**
- `src/app/theme/ThemePage.tsx`

**Files to modify:**
- `src/App.tsx` — add `/theme` route (lazy loaded)
- `src/app/layout/AppLayout.tsx` — add "主题工作室" nav link

### Layout

```
┌─────────────────────────────────────────────────────┐
│  预设主题（横向滚动条）                               │
├──────────────────────┬──────────────────────────────┤
│  ThemeEditor         │  CandidatePreview (large)    │
│  - 颜色 (10 pickers) │  - 横排/竖排切换             │
│  - 布局 (sliders)    │  - 亮色/暗色背景切换          │
│  - 字体              │  - 自定义预览文本输入          │
└──────────────────────┴──────────────────────────────┘
```

The preview panel:
- Large CandidatePreview with current theme
- Toggle buttons: horizontal/vertical, light/dark background
- Text input to customize preview content (default: "你好世界 nihao")
- "导出主题" button (exports just the platform config YAML)

---

## Task 6: Input Simulator (Scoped)

**Why:** Interactive typing simulation. **Scoped for Phase 3** to core functionality.

**Phase 3 scope:**
- Text input field where user types pinyin
- Candidate lookup from sample word database (prefix matching)
- Candidates displayed using CandidatePreview with current theme
- Punctuation mapping display (type `,` → shows `，`)
- Disclaimer: "实际候选词由 Rime 引擎决定，此处仅为演示"

**Deferred to future:**
- Full keyboard capture with Shift/Caps behavior
- Double pinyin decomposition visualization
- Fuzzy match demonstration
- Embeddable in tutorials (Phase 3 creates the component; tutorial embedding is enhancement)

**Files to create:**
- `src/data/sample-words.ts` — 200+ common Chinese words with pinyin: `{ text: '你好', pinyin: 'nihao' }`
- `src/features/simulator/SimulatorPanel.tsx` — main component: input field + candidate display
- `src/features/simulator/useSimulator.ts` — hook: takes input string, returns matched candidates from sample database

**Integration:**
- Embedded in ThemePage as part of the preview area
- Collapsible bottom panel in EditorPage

---

## Task 7: Advanced Tutorial Content

**Why:** Phase 3 includes advanced tutorials per design spec section 6.1.

**Files to create under `src/content/`:**
- `double-pinyin-guide.mdx` — 双拼方案原理与选择指南
- `auxiliary-code.mdx` — 辅助码系统详解
- `custom-dictionary.mdx` — 自定义词库的制作和维护
- `lua-scripting.mdx` — Lua 脚本扩展入门
- `multi-device-sync.mdx` — 多设备配置同步方案

**Files to modify:**
- `src/data/tutorial-nav.ts` — add "进阶技巧" section with 5 items
- `src/app/docs/DocsPage.tsx` — add 5 new dynamic imports

---

## Task Dependency Order

```
Task 1 (types + color + presets) → Task 2 (parser/serializer/store)
                                 ↘ Task 3 (CandidatePreview refactor)
                                   → Task 4 (theme editor UI)
                                     → Task 5 (theme page + routing)
                                       → Task 6 (simulator)
Task 7 (tutorials) — independent, can go anywhere
```

Execution order: 1 → 2 → 3 → 4 → 5 → 6 → 7

---

## Verification

After all tasks:
1. `npx tsc -b` — clean
2. `npx vitest run` — all tests pass (56 existing + new)
3. `npx vite build` — succeeds
4. Manual: `/theme` page — select presets, edit colors with pickers, see preview update live
5. Manual: toggle horizontal/vertical layout, change font/size via sliders
6. Manual: export config — verify squirrel.custom.yaml has `0xBBGGRR` format colors
7. Manual: import squirrel.custom.yaml with theme — verify colors load correctly
8. Manual: type in simulator — see candidates appear with current theme styling
9. Manual: browse advanced tutorials at `/docs/*`
