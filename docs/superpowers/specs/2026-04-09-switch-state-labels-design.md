# Switch State Labels — Design Spec

**Date**: 2026-04-09
**Scope**: Toggle switches across configuration editor pages

## Problem

Binary toggle switches (e.g., 全角/半角, 中英标点) in the configuration editor don't show what ON and OFF correspond to. Users can see a toggle but can't determine the current state's meaning without prior knowledge of Rime's configuration semantics.

## Solution: Approach A — State Label + Description Optimization

### 1. Add Current State Label Next to Switch

For all binary switches in `Switches.tsx`, display the current state text to the left of the Switch component.

**Data source**: `SwitchDefinition.states` — `states[0]` = OFF label, `states[1]` = ON label.

**Layout** (Switches.tsx uses `justify-between`, Switch is on the far right):
```
全角/半角                         半角 [===]
开启输出全角字符，关闭输出半角字符
```

The state label sits immediately left of the Switch in a `flex items-center gap-2` wrapper. It dynamically changes when the toggle is flipped. Style: `text-sm text-gray-500`.

### 2. Optimize Description Text

Update `switch-definitions.ts` descriptions to explicitly state what ON/OFF means:

| Switch | name | Current description | New description |
|--------|------|-------------------|-----------------|
| Emoji | `emoji` | 输入时显示 Emoji 候选 | 开启后在候选中显示 Emoji |
| 全角/半角 | `full_shape` | 全角模式输出全角字符 | 开启输出全角字符，关闭输出半角字符 |
| 中英标点 | `ascii_punct` | 切换中文标点和英文标点 | 开启使用英文标点，关闭使用中文标点 |
| 预测输入 | `prediction` | 根据上下文预测下一个词 | 开启后根据上下文预测下一个词 |
| 简码 | `abbrev` | 启用简码输入 | 开启后启用简码输入 |
| 翻译模式 | `chinese_english` | 输入中文显示对应英文翻译 | 开启后输入中文时显示对应英文翻译 |
| 字集过滤 | `charset_filter` | 限制候选词字符集范围 | 开启使用小字集（常用字），关闭使用大字集（全部） |
| 候选排序 | `char_priority` | 优先显示单字或词组 | 开启单字优先，关闭词组优先 |
| Tips 提示 | `super_tips` | 显示 Tips 扩展提示信息 | 开启后显示 Tips 扩展提示信息 |

### 3. Other Pages — CandidateDisplay.tsx

The `horizontal` toggle at `CandidateDisplay.tsx:57` also lacks a state label. Add dynamic label showing 「竖排」/「横排」 next to the switch, matching the pattern already used in `ThemePage.tsx:55`.

### 4. Pages NOT Changed (and why)

The following switch usages are **simple enable/disable** where the meaning is self-evident from label + description. No state label is needed:

- `LuaExtensions.tsx` — 退格保护, Tab 循环跳转, 声调回落, 输入统计
- `AuxiliaryCode.tsx` — 辅助码提示, 字形拆分提示
- `CandidateSettings.tsx` — 补全, 整句, 用户词典
- `FuzzyPinyin.tsx` — 模糊音规则 (all are enable/disable)
- `SpecialInput.tsx` — 特殊输入触发器 (enable/disable per trigger)
- `KeyBindings.tsx` — 功能键 (enable/disable per key)
- `ReverseLookup.tsx` — 数据源, 反查方式 (enable/disable per source)

Pages that **already have state labels** — no change needed:

- `ThemePage.tsx` — 横排/竖排, 暗色/亮色 (already uses ternary labels)
- `ThemeLayoutSection.tsx` — 横排/竖排 (already uses ternary label)
- `AsciiMode.tsx` — "默认英文" label is unambiguous

## Files to Modify

1. **`src/data/switch-definitions.ts`** — Update 9 description strings
2. **`src/features/editor/modules/Switches.tsx`** — Add state label next to binary Switch components
3. **`src/features/editor/modules/CandidateDisplay.tsx`** — Add state label for horizontal toggle

## UI Behavior

- State label sits immediately left of the Switch, wrapped together in `flex items-center gap-2`
- Label text updates immediately when toggle is flipped
- No animation needed — just text swap
- Style consistent with existing `text-sm text-gray-500` pattern
- For CandidateDisplay.tsx, follow ThemePage's existing pattern: Switch first, then Label
