# Switch State Labels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add visible state labels to binary toggle switches so users know what ON/OFF means, and optimize description text for clarity.

**Architecture:** Pure UI change — render existing `states` data from `switch-definitions.ts` next to Switch components. Update description strings. No new types, no logic changes.

**Tech Stack:** React, TypeScript, Radix UI Switch, Tailwind CSS

---

### Task 1: Update description strings in switch-definitions.ts

**Files:**
- Modify: `src/data/switch-definitions.ts:28-37`

- [ ] **Step 1: Update all 9 binary switch descriptions**

In `src/data/switch-definitions.ts`, replace the `description` field for each binary switch definition:

```typescript
// Line 28 — emoji
{ name: 'emoji', label: 'Emoji', description: '开启后在候选中显示 Emoji', defaultReset: 1, states: ['关', '开'], category: 'basic' },

// Line 29 — full_shape
{ name: 'full_shape', label: '全角/半角', description: '开启输出全角字符，关闭输出半角字符', defaultReset: 0, states: ['半角', '全角'], category: 'basic' },

// Line 30 — ascii_punct
{ name: 'ascii_punct', label: '中英标点', description: '开启使用英文标点，关闭使用中文标点', defaultReset: 0, states: ['中文', '英文'], category: 'basic' },

// Line 32 — prediction
{ name: 'prediction', label: '预测输入', description: '开启后根据上下文预测下一个词', defaultReset: 0, states: ['关', '开'], category: 'input' },

// Line 33 — abbrev
{ name: 'abbrev', label: '简码', description: '开启后启用简码输入', defaultReset: 1, states: ['关', '开'], category: 'input' },

// Line 34 — chinese_english
{ name: 'chinese_english', label: '翻译模式', description: '开启后输入中文时显示对应英文翻译', defaultReset: 0, states: ['关', '开'], category: 'input' },

// Line 35 — charset_filter
{ name: 'charset_filter', label: '字集过滤', description: '开启使用小字集（常用字），关闭使用大字集（全部）', help: '大字集：包含所有 Unicode 汉字，包括罕见字、异体字和 CJK 扩展区字符，适合需要输入生僻字的场景。小字集：仅包含常用汉字（约 6000 字），候选更精准，适合日常输入。', defaultReset: 0, states: ['大字集', '小字集'], category: 'display' },

// Line 36 — char_priority
{ name: 'char_priority', label: '候选排序', description: '开启单字优先，关闭词组优先', help: '词组优先：长词组排在前面，适合整句输入风格，减少选词次数。单字优先：单字排在前面，适合配合辅助码逐字精准输入的用户。', defaultReset: 0, states: ['词组先', '单字先'], category: 'display' },

// Line 37 — super_tips
{ name: 'super_tips', label: 'Tips 提示', description: '开启后显示 Tips 扩展提示信息', defaultReset: 0, states: ['关', '开'], category: 'display' },
```

- [ ] **Step 2: Verify the app compiles**

Run: `cd /Users/weibo/Code/rime-craft && npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/data/switch-definitions.ts
git commit -m "feat: optimize switch description text to clarify on/off semantics"
```

---

### Task 2: Add state label to binary switches in Switches.tsx

**Files:**
- Modify: `src/features/editor/modules/Switches.tsx:85-101`

- [ ] **Step 1: Wrap Switch component with state label**

In `src/features/editor/modules/Switches.tsx`, find the binary switch rendering block (lines 85-101). Replace the standalone `<Switch>` with a wrapper that includes the state label:

Current code:
```tsx
<div key={def.name} className="flex items-center justify-between">
  <div className="space-y-1">
    <div className="flex flex-wrap items-center gap-x-1.5">
      <p className="font-medium">{def.label}</p>
      {def.help && (
        <SettingHelp>
          <p>{def.help}</p>
        </SettingHelp>
      )}
    </div>
    <p className="text-sm text-gray-500">{def.description}</p>
  </div>
  <Switch
    checked={reset === 1}
    onCheckedChange={(checked) => handleBinaryToggle(def.name, checked)}
  />
</div>
```

New code:
```tsx
<div key={def.name} className="flex items-center justify-between">
  <div className="space-y-1">
    <div className="flex flex-wrap items-center gap-x-1.5">
      <p className="font-medium">{def.label}</p>
      {def.help && (
        <SettingHelp>
          <p>{def.help}</p>
        </SettingHelp>
      )}
    </div>
    <p className="text-sm text-gray-500">{def.description}</p>
  </div>
  <div className="flex items-center gap-2">
    <span className="text-sm text-gray-500">
      {reset === 1 ? def.states[1] : def.states[0]}
    </span>
    <Switch
      checked={reset === 1}
      onCheckedChange={(checked) => handleBinaryToggle(def.name, checked)}
    />
  </div>
</div>
```

The key change: the `<Switch>` is now wrapped in a `<div className="flex items-center gap-2">` with a `<span>` showing the current state label (`def.states[0]` for OFF, `def.states[1]` for ON).

- [ ] **Step 2: Verify the app compiles**

Run: `cd /Users/weibo/Code/rime-craft && npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Visual verification**

Run: `cd /Users/weibo/Code/rime-craft && npm run dev`

Open the config editor, navigate to "开关与杂项". Verify:
- Each binary switch shows a state label to its left (e.g., "半角" next to 全角/半角 toggle when OFF)
- Toggling a switch updates the label immediately (e.g., "半角" → "全角")
- Layout is aligned and doesn't break on narrow viewports

- [ ] **Step 4: Commit**

```bash
git add src/features/editor/modules/Switches.tsx
git commit -m "feat: add state labels next to binary toggle switches"
```

---

### Task 3: Add state label to horizontal toggle in CandidateDisplay.tsx

**Files:**
- Modify: `src/features/editor/modules/CandidateDisplay.tsx:57-58`

- [ ] **Step 1: Add state label to horizontal switch**

In `src/features/editor/modules/CandidateDisplay.tsx`, find the horizontal toggle (lines 57-58):

Current code:
```tsx
<Switch checked={defaultHorizontal ?? false}
  onCheckedChange={(v) => updateDefaultConfig({ horizontal: v })} />
```

Replace with:
```tsx
<div className="flex items-center gap-2">
  <span className="text-sm text-gray-500">
    {defaultHorizontal ? '横排' : '竖排'}
  </span>
  <Switch checked={defaultHorizontal ?? false}
    onCheckedChange={(v) => updateDefaultConfig({ horizontal: v })} />
</div>
```

- [ ] **Step 2: Verify the app compiles**

Run: `cd /Users/weibo/Code/rime-craft && npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Visual verification**

In the running dev server, navigate to "候选词显示". Verify:
- The horizontal toggle shows "竖排" when OFF, "横排" when ON
- Label updates immediately on toggle

- [ ] **Step 4: Commit**

```bash
git add src/features/editor/modules/CandidateDisplay.tsx
git commit -m "feat: add state label to horizontal toggle in candidate display"
```
