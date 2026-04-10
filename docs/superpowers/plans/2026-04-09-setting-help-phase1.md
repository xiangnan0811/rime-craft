# Setting Help & Tutorial Improvement Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a reusable `SettingHelp` inline-expand component, add `enableSentence` and `initialQuality` to the translator config pipeline, improve all candidate-settings advanced controls with descriptions and help content, and sync the tutorial MDX.

**Architecture:** New `SettingHelp` shared component using collapsible pattern (CSS transition on height). Two new fields added to `TranslatorConfig` type, threaded through parser/serializer/presets/tests. `CandidateSettings.tsx` gets inline descriptions + SettingHelp on all 8 advanced settings. `candidate-settings.mdx` rewritten to match UI 1:1.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Vitest

---

### Task 1: Create `SettingHelp` Component

**Files:**
- Create: `src/components/shared/SettingHelp.tsx`

- [ ] **Step 1: Create the SettingHelp component**

Create `src/components/shared/SettingHelp.tsx`:

```tsx
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface SettingHelpProps {
  children: React.ReactNode
  className?: string
}

export function SettingHelp({ children, className }: SettingHelpProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px] leading-none',
          open
            ? 'border-blue-400 bg-blue-100 text-blue-600'
            : 'border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-500',
        )}
        aria-expanded={open}
        aria-label="显示帮助信息"
      >
        ?
      </button>
      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-150 ease-in-out',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <div
            className={cn(
              'mt-2 rounded-md border-l-2 border-blue-300 bg-blue-50 p-3 text-sm leading-relaxed text-gray-700 dark:border-blue-500 dark:bg-blue-950/30 dark:text-gray-300',
              '[&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:mb-0 [&>ul]:ml-4 [&>ul]:list-disc [&>ul]:space-y-0.5',
              className,
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Verify it builds**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add src/components/shared/SettingHelp.tsx
git commit -m "feat: add SettingHelp inline-expand component"
```

---

### Task 2: Add `enableSentence` and `initialQuality` to TranslatorConfig Type

**Files:**
- Modify: `src/types/config.ts:155-164`

- [ ] **Step 1: Add the two new fields to TranslatorConfig**

In `src/types/config.ts`, replace the `TranslatorConfig` interface (lines 155-164):

```typescript
export interface TranslatorConfig {
  enableCompletion: boolean;
  enableSentence: boolean;
  enableUserDict: boolean;
  initialQuality: number;
  coreWordLength: number;
  maxWordLength: number;
  maxHomophones: number;
  maxHomographs: number;
  spellingHints: number;
  alwaysShowComments: boolean;
}
```

- [ ] **Step 2: Run type check — expect errors in parser, serializer, presets, and component files**

Run: `npx tsc --noEmit 2>&1 | head -30`
Expected: Type errors in files that construct `TranslatorConfig` without the new fields (parser.ts, presets.ts, CandidateSettings.tsx, CandidateDisplay.tsx, test files). This confirms the type is correctly requiring the new fields.

- [ ] **Step 3: Commit**

```bash
git add src/types/config.ts
git commit -m "feat: add enableSentence and initialQuality to TranslatorConfig type"
```

---

### Task 3: Update Parser, Serializer, and Presets

**Files:**
- Modify: `src/lib/yaml/parser.ts:271-281`
- Modify: `src/lib/yaml/serializer.ts:106-115`
- Modify: `src/data/presets.ts:78-87`

- [ ] **Step 1: Update the parser to read the two new fields**

In `src/lib/yaml/parser.ts`, replace the translator mapping block (lines 271-281) with:

```typescript
    result.translator = {
      enableCompletion: (rawTranslator.enable_completion as boolean) ?? false,
      enableSentence: (rawTranslator.enable_sentence as boolean) ?? true,
      enableUserDict: (rawTranslator.enable_user_dict as boolean) ?? true,
      initialQuality: (rawTranslator.initial_quality as number) ?? 1.2,
      coreWordLength: (rawTranslator.core_word_length as number) ?? 4,
      maxWordLength: (rawTranslator.max_word_length as number) ?? 7,
      maxHomophones: (rawTranslator.max_homophones as number) ?? 1,
      maxHomographs: (rawTranslator.max_homographs as number) ?? 1,
      spellingHints: (rawTranslator.spelling_hints as number) ?? 0,
      alwaysShowComments: (rawTranslator.always_show_comments as boolean) ?? false,
    }
```

- [ ] **Step 2: Update the serializer to write the two new fields**

In `src/lib/yaml/serializer.ts`, after line 108 (`patch['translator/enable_user_dict'] = t.enableUserDict`), add two new lines so the translator block becomes:

```typescript
    patch['translator/enable_completion'] = t.enableCompletion
    patch['translator/enable_sentence'] = t.enableSentence
    patch['translator/enable_user_dict'] = t.enableUserDict
    patch['translator/initial_quality'] = t.initialQuality
    patch['translator/core_word_length'] = t.coreWordLength
    patch['translator/max_word_length'] = t.maxWordLength
    patch['translator/max_homophones'] = t.maxHomophones
    patch['translator/max_homographs'] = t.maxHomographs
    patch['translator/spelling_hints'] = t.spellingHints
    patch['translator/always_show_comments'] = t.alwaysShowComments
```

- [ ] **Step 3: Update the wanxiang preset default translator config**

In `src/data/presets.ts`, replace the translator object (lines 78-87) with:

```typescript
        translator: {
          enableCompletion: true,
          enableSentence: true,
          enableUserDict: false,
          initialQuality: 1.2,
          coreWordLength: 4,
          maxWordLength: 7,
          maxHomophones: 8,
          maxHomographs: 8,
          spellingHints: 30,
          alwaysShowComments: true,
        },
```

- [ ] **Step 4: Run type check — should pass now for these files**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: Remaining errors only in test files and CandidateSettings/CandidateDisplay components (fixed in later tasks).

- [ ] **Step 5: Commit**

```bash
git add src/lib/yaml/parser.ts src/lib/yaml/serializer.ts src/data/presets.ts
git commit -m "feat: thread enableSentence and initialQuality through parser, serializer, presets"
```

---

### Task 4: Update Tests for Parser and Serializer

**Files:**
- Modify: `src/lib/yaml/parser.test.ts:146-165`
- Modify: `src/lib/yaml/serializer.test.ts:188-207`

- [ ] **Step 1: Update the parser test to include new fields**

In `src/lib/yaml/parser.test.ts`, replace the translator test (lines 146-165) with:

```typescript
  it('maps translator fields from expanded patch', () => {
    const patch = {
      translator: {
        enable_completion: true,
        enable_sentence: false,
        enable_user_dict: false,
        initial_quality: 2.0,
        core_word_length: 4,
        max_word_length: 7,
        max_homophones: 8,
        max_homographs: 8,
        spelling_hints: 30,
        always_show_comments: true,
      },
    }
    const config = mapToSchemaConfig(patch, 'wanxiang')
    expect(config.translator).toBeDefined()
    expect(config.translator!.enableCompletion).toBe(true)
    expect(config.translator!.enableSentence).toBe(false)
    expect(config.translator!.enableUserDict).toBe(false)
    expect(config.translator!.initialQuality).toBe(2.0)
    expect(config.translator!.coreWordLength).toBe(4)
    expect(config.translator!.spellingHints).toBe(30)
  })
```

- [ ] **Step 2: Update the serializer test to include new fields**

In `src/lib/yaml/serializer.test.ts`, replace the translator test (lines 188-207) with:

```typescript
  it('serializes translator config', () => {
    const config = {
      schemaId: 'wanxiang',
      fuzzyRules: [],
      translator: {
        enableCompletion: true,
        enableSentence: false,
        enableUserDict: false,
        initialQuality: 2.0,
        coreWordLength: 4,
        maxWordLength: 7,
        maxHomophones: 8,
        maxHomographs: 8,
        spellingHints: 30,
        alwaysShowComments: true,
      },
    }
    const result = serializeSchemaConfig(config)
    expect(result['translator/enable_completion']).toBe(true)
    expect(result['translator/enable_sentence']).toBe(false)
    expect(result['translator/enable_user_dict']).toBe(false)
    expect(result['translator/initial_quality']).toBe(2.0)
    expect(result['translator/core_word_length']).toBe(4)
  })
```

- [ ] **Step 3: Run the tests**

Run: `npx vitest run src/lib/yaml/parser.test.ts src/lib/yaml/serializer.test.ts`
Expected: All translator tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/lib/yaml/parser.test.ts src/lib/yaml/serializer.test.ts
git commit -m "test: add enableSentence and initialQuality to parser/serializer tests"
```

---

### Task 5: Fix CandidateDisplay Default Translator

**Files:**
- Modify: `src/features/editor/modules/CandidateDisplay.tsx`

The `CandidateDisplay.tsx` also has a `DEFAULT_TRANSLATOR` that needs the new fields.

- [ ] **Step 1: Find and update the DEFAULT_TRANSLATOR in CandidateDisplay.tsx**

Search for the `DEFAULT_TRANSLATOR` const in `CandidateDisplay.tsx` and add the two new fields:

```typescript
  const DEFAULT_TRANSLATOR: TranslatorConfig = {
    enableCompletion: true,
    enableSentence: true,
    enableUserDict: true,
    initialQuality: 1.2,
    coreWordLength: 4,
    maxWordLength: 7,
    maxHomophones: 8,
    maxHomographs: 8,
    spellingHints: 30,
    alwaysShowComments: true,
  }
```

- [ ] **Step 2: Run type check — should clear CandidateDisplay errors**

Run: `npx tsc --noEmit 2>&1 | head -10`
Expected: Only CandidateSettings.tsx errors remain (fixed in next task).

- [ ] **Step 3: Commit**

```bash
git add src/features/editor/modules/CandidateDisplay.tsx
git commit -m "fix: add new translator fields to CandidateDisplay defaults"
```

---

### Task 6: Overhaul CandidateSettings.tsx UI

**Files:**
- Modify: `src/features/editor/modules/CandidateSettings.tsx`

This is the main UI task. We update the `DEFAULT_TRANSLATOR`, add the `SettingHelp` import, improve all existing advanced settings with descriptions and help, and add the two new settings.

- [ ] **Step 1: Add SettingHelp import and update DEFAULT_TRANSLATOR**

At the top of `CandidateSettings.tsx`, add the import:

```typescript
import { SettingHelp } from '@/components/shared/SettingHelp'
```

Update the `DEFAULT_TRANSLATOR` const (lines 48-57) to:

```typescript
  const DEFAULT_TRANSLATOR: TranslatorConfig = {
    enableCompletion: true,
    enableSentence: true,
    enableUserDict: true,
    initialQuality: 1.2,
    coreWordLength: 4,
    maxWordLength: 7,
    maxHomophones: 8,
    maxHomographs: 8,
    spellingHints: 30,
    alwaysShowComments: true,
  }
```

- [ ] **Step 2: Replace the entire advanced settings section**

Replace everything inside `<details>` (lines 124-184) with the improved version below. The full replacement for the `<details>` element:

```tsx
      <details className="group">
        <summary className="cursor-pointer font-medium text-gray-700">
          高级设置
          <span className="ml-1 text-xs text-gray-400">（翻译器参数）</span>
        </summary>
        <div className="mt-3 space-y-4">
          {/* 输入补全 */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Label>输入补全</Label>
                <SettingHelp>
                  <p>开启后，输入不完整的拼音也会显示候选词。例如只输入 <code>n</code> 就能看到「你、那、能……」。关闭后必须输入完整音节（如 <code>ni</code>）才会出现候选。</p>
                  <p>建议：大多数用户应保持开启。仅在使用辅助码且希望减少干扰时才考虑关闭。</p>
                </SettingHelp>
              </div>
              <p className="text-sm text-gray-500">打部分拼音时是否显示完整词</p>
            </div>
            <Switch
              checked={translator.enableCompletion}
              onCheckedChange={(v) => updateTranslator({ enableCompletion: v })}
            />
          </div>

          {/* 整句模式 (新增) */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Label>整句模式</Label>
                <SettingHelp>
                  <p>开启后，Rime 会尝试将你输入的多个音节自动组合成一个完整的句子作为候选。例如输入 <code>jintiandianqihenhao</code> 可能直接出现「今天天气很好」。</p>
                  <p>关闭后，每次只匹配单个词组，需要逐词选择。</p>
                  <ul>
                    <li>习惯整句输入的用户建议开启</li>
                    <li>习惯逐词输入、搭配辅助码精准选词的用户可以关闭</li>
                  </ul>
                </SettingHelp>
              </div>
              <p className="text-sm text-gray-500">尝试将多个音节组合成完整句子候选</p>
            </div>
            <Switch
              checked={translator.enableSentence}
              onCheckedChange={(v) => updateTranslator({ enableSentence: v })}
            />
          </div>

          {/* 用户词典 */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Label>用户词典</Label>
                <SettingHelp>
                  <p>开启后，Rime 会根据你的使用习惯自动调整候选词排序（常用词排前面），并记住你选过的自造词组。</p>
                  <p>关闭后，候选词排序完全由词典决定，不会学习你的使用习惯。适合不希望输入法「记住」自己输入内容的用户。</p>
                </SettingHelp>
              </div>
              <p className="text-sm text-gray-500">启用自动调频和用户词典记忆</p>
            </div>
            <Switch
              checked={translator.enableUserDict}
              onCheckedChange={(v) => updateTranslator({ enableUserDict: v })}
            />
          </div>

          {/* 核心词最大长度 */}
          <div>
            <div className="flex items-center gap-1.5">
              <Label>核心词最大长度</Label>
              <SettingHelp>
                <p>控制 Rime 造句引擎在组合候选句子时，最多使用多长的词组。</p>
                <ul>
                  <li><strong>推荐值</strong>：4（平衡速度和质量）</li>
                  <li>较小值 (2-3)：造句速度更快，但可能把长词拆开</li>
                  <li>较大值 (5-7)：更多长词组参与造句，但计算量增加</li>
                </ul>
                <p>对于单字输入为主的用户，这个值影响不大。</p>
              </SettingHelp>
            </div>
            <Input
              type="number" min={1} max={10} className="mt-1 w-24"
              value={translator.coreWordLength}
              onChange={(e) => updateTranslator({ coreWordLength: Number(e.target.value) })}
            />
            <p className="mt-1 text-sm text-gray-500">参与造句的最长词组长度，默认 4</p>
          </div>

          {/* 候选词最大长度 */}
          <div>
            <div className="flex items-center gap-1.5">
              <Label>候选词最大长度</Label>
              <SettingHelp>
                <p>限制候选列表中显示的最长词组。超过此长度的词组不会出现在候选中。</p>
                <ul>
                  <li>较小值 (3-4)：候选列表更紧凑，适合偏好短词的用户</li>
                  <li>较大值 (10-20)：允许显示长成语、诗句等，适合整句输入</li>
                  <li>默认值 7 能覆盖绝大多数常用词组</li>
                </ul>
              </SettingHelp>
            </div>
            <Input
              type="number" min={1} max={20} className="mt-1 w-24"
              value={translator.maxWordLength}
              onChange={(e) => updateTranslator({ maxWordLength: Number(e.target.value) })}
            />
            <p className="mt-1 text-sm text-gray-500">候选列表中词组的最大字数，默认 7</p>
          </div>

          {/* 同音词上限 */}
          <div>
            <div className="flex items-center gap-1.5">
              <Label>同音词上限</Label>
              <SettingHelp>
                <p>限制同一个拼音下显示的候选词数量。例如拼音 <code>shi</code> 对应的汉字非常多（是、时、十、事……），此值控制最多列出多少个。</p>
                <ul>
                  <li>较小值 (3-5)：候选更精简，翻页更少，但可能漏掉需要的字</li>
                  <li>较大值 (10-20)：候选更全面，但需要更多翻页</li>
                  <li>默认值 8 适合大多数场景</li>
                </ul>
              </SettingHelp>
            </div>
            <Input
              type="number" min={1} max={20} className="mt-1 w-24"
              value={translator.maxHomophones}
              onChange={(e) => updateTranslator({ maxHomophones: Number(e.target.value) })}
            />
            <p className="mt-1 text-sm text-gray-500">相同拼音的候选词最多显示几个</p>
          </div>

          {/* 同形词上限 */}
          <div>
            <div className="flex items-center gap-1.5">
              <Label>同形词上限</Label>
              <SettingHelp>
                <p>限制同一个字形但不同读音的变体数量。例如「行」有 háng 和 xíng 两个读音，此值控制这类多音字变体的显示上限。</p>
                <ul>
                  <li>通常不需要调整，默认值 8 足够</li>
                  <li>如果候选中出现太多生僻读音的变体，可以适当调小</li>
                </ul>
              </SettingHelp>
            </div>
            <Input
              type="number" min={1} max={20} className="mt-1 w-24"
              value={translator.maxHomographs}
              onChange={(e) => updateTranslator({ maxHomographs: Number(e.target.value) })}
            />
            <p className="mt-1 text-sm text-gray-500">相同字形不同读音的候选词最多显示几个</p>
          </div>

          {/* 翻译器优先级 (新增) */}
          <div>
            <div className="flex items-center gap-1.5">
              <Label>翻译器优先级</Label>
              <SettingHelp>
                <p>控制此翻译器生成的候选词在排序中的初始权重。数值越高，排名越靠前。</p>
                <ul>
                  <li>默认值 1.2，通常不需要修改</li>
                  <li>当你同时使用多个翻译器（如拼音 + 英文）时，可以通过调整此值来控制哪个翻译器的候选词优先显示</li>
                  <li>对于只使用单个输入方案的用户，此设置没有影响</li>
                </ul>
              </SettingHelp>
            </div>
            <Input
              type="number" min={0} max={10} step={0.1} className="mt-1 w-24"
              value={translator.initialQuality}
              onChange={(e) => updateTranslator({ initialQuality: Number(e.target.value) })}
            />
            <p className="mt-1 text-sm text-gray-500">候选词的初始排序权重，默认 1.2</p>
          </div>
        </div>
      </details>
```

- [ ] **Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 4: Run all tests**

Run: `npx vitest run`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/editor/modules/CandidateSettings.tsx
git commit -m "feat: add SettingHelp to all candidate advanced settings, add enableSentence and initialQuality controls"
```

---

### Task 7: Update Tutorial Content (candidate-settings.mdx)

**Files:**
- Modify: `src/content/candidate-settings.mdx`

Rewrite the tutorial to match the UI 1:1. Key changes: rename "逐码提示" to "输入补全", add documentation for all 8 advanced settings, update recommended configs.

- [ ] **Step 1: Replace the entire candidate-settings.mdx file**

Replace the full content of `src/content/candidate-settings.mdx` with:

```mdx
# 候选词设置

候选词面板是输入法最核心的交互界面。合理设置候选词数量、选择方式和高级翻译参数，能显著降低选词次数，提升输入效率。

## 这是什么

当你输入一段拼音时，Rime 会显示一列候选词供你选择。候选词设置控制三个层面：

- **基础显示**：每页显示多少个候选词、用什么键来选词
- **翻页行为**：如何在候选词页面之间导航
- **翻译引擎**：控制候选词的生成策略（输入补全、整句模式、词组长度、排序权重等）

## 配置项详解

### 每页候选词数（page_size）

```yaml
patch:
  menu/page_size: 7
```

| 值 | 适用场景 |
|----|---------|
| 3-4 | 竖排候选词、屏幕空间紧张、配合精准词库 |
| 5 | 平衡选项，适合大多数全拼用户 |
| 7-9 | 减少翻页、配合字母键选词、双拼用户推荐 |

### 选词键（alternative_select_keys）

除了默认的数字键 1-9，你可以配置字母键来选词：

```yaml
patch:
  menu/alternative_select_keys: "ASDFGHJKL"
  # 按 A 选第1个，S 选第2个，D 选第3个……
```

字母键选词的优势：手指不需要离开主键盘区移动到数字行。特别适合双拼用户——双拼本身用字母键输入，选词也用字母键，手指始终在主键盘区。

### 翻页键

候选词翻页默认使用 `Page_Up` / `Page_Down`，万象拼音额外配置了 `-` / `=` 翻页：

```yaml
patch:
  key_binder/bindings:
    - { when: has_menu, accept: minus, send: Page_Up }
    - { when: has_menu, accept: equal, send: Page_Down }
```

也可以配置方括号翻页：

```yaml
patch:
  key_binder/bindings:
    - { when: paging, accept: bracketleft, send: Page_Up }
    - { when: has_menu, accept: bracketright, send: Page_Down }
```

### 翻译引擎高级设置

以下参数控制候选词的生成策略。在编辑器中点击「高级设置」展开可以看到这些选项。

#### 输入补全（enable_completion）

```yaml
patch:
  translator/enable_completion: true
```

开启后，输入不完整的拼音也会显示候选词。例如输入 `n` 就会出现「你、那、能……」。关闭后必须输入完整音节（如 `ni`）才会有候选。

大多数用户应保持开启。仅在使用辅助码且希望减少干扰时才考虑关闭。

#### 整句模式（enable_sentence）

```yaml
patch:
  translator/enable_sentence: true
```

开启后，Rime 会尝试将多个音节组合成完整的句子候选。例如输入 `jintiandianqihenhao` 可能直接出现「今天天气很好」。

关闭后每次只匹配单个词组，需要逐词选择。

| 场景 | 建议 |
|------|------|
| 习惯整句输入 | 开启 |
| 逐词输入、搭配辅助码 | 关闭 |

#### 用户词典（enable_user_dict）

```yaml
patch:
  translator/enable_user_dict: true
```

开启后，Rime 会根据你的使用习惯自动调整候选词排序（常用词排前面），并记住你选过的自造词组。

关闭后，候选词排序完全由词典决定，不会学习你的输入习惯。适合不希望输入法「记住」自己输入内容的场景。

#### 核心词最大长度（core_word_length）

```yaml
patch:
  translator/core_word_length: 4
```

控制造句引擎在组合候选句子时，最多使用多长的词组。

| 值 | 效果 |
|----|------|
| 2-3 | 造句速度更快，但可能把长词拆开 |
| **4（推荐）** | 平衡速度和质量 |
| 5-7 | 更多长词组参与造句，计算量增加 |

对于单字输入为主的用户，这个值影响不大。

#### 候选词最大长度（max_word_length）

```yaml
patch:
  translator/max_word_length: 7
```

限制候选列表中显示的最长词组。超过此长度的词组不会出现在候选中。

| 值 | 效果 |
|----|------|
| 3-4 | 候选列表更紧凑，适合偏好短词的用户 |
| **7（推荐）** | 覆盖绝大多数常用词组 |
| 10-20 | 允许显示长成语、诗句等，适合整句输入 |

#### 同音词上限（max_homophones）

```yaml
patch:
  translator/max_homophones: 8
```

限制同一个拼音下显示的候选词数量。例如拼音 `shi` 对应的汉字非常多（是、时、十、事……），此值控制最多列出多少个。

| 值 | 效果 |
|----|------|
| 3-5 | 候选更精简，翻页更少，但可能漏掉需要的字 |
| **8（推荐）** | 适合大多数场景 |
| 10-20 | 候选更全面，但需要更多翻页 |

#### 同形词上限（max_homographs）

```yaml
patch:
  translator/max_homographs: 8
```

限制同一个字形但不同读音的变体数量。例如「行」有 háng 和 xíng 两个读音，此值控制这类多音字变体的显示上限。

通常不需要调整，默认值 8 足够。如果候选中出现太多生僻读音的变体，可以适当调小。

#### 翻译器优先级（initial_quality）

```yaml
patch:
  translator/initial_quality: 1.2
```

控制翻译器生成的候选词的初始权重。数值越高，该翻译器的候选词排名越靠前。

- 默认值 1.2，通常不需要修改
- 当你同时使用多个翻译器（如拼音 + 英文）时，可以通过调整此值来控制优先级
- 对于只使用单个输入方案的用户，此设置没有影响

<ConfigSlot module="candidate-settings" />

## 常见场景与推荐搭配

**全拼用户的典型配置**：

```yaml
patch:
  menu/page_size: 5
  translator/enable_completion: true
  translator/enable_sentence: true
  translator/enable_user_dict: true
```

数字键选词、5 个候选词，整句模式开启，用户词典学习使用习惯。

**双拼用户推荐配置**：

```yaml
patch:
  menu/page_size: 7
  menu/alternative_select_keys: "ASDFGHJKL"
  translator/enable_completion: true
  translator/enable_sentence: true
```

7 个候选词减少翻页，字母键选词让手指保持在主键盘区。

**单字输入为主（配合辅助码）**：

```yaml
patch:
  menu/page_size: 5
  translator/enable_sentence: false     # 关闭整句，专注单字
  translator/enable_completion: true
  translator/core_word_length: 3        # 造句用短词即可
  translator/max_homophones: 5          # 减少同音候选
```

**追求精简候选列表**：

```yaml
patch:
  menu/page_size: 5
  translator/max_word_length: 5         # 只显示短词
  translator/max_homophones: 5          # 限制同音词
  translator/max_homographs: 3          # 限制多音字变体
```

## 进阶技巧

:::tip
如果你使用辅助码，`page_size` 的重要性会降低——因为辅助码可以将候选词精确缩减到 1-3 个，几乎不需要翻页。此时 5 个候选词就足够了。
:::

:::warning
`alternative_select_keys` 设置的字母会「占用」这些键位。例如设置了 `ASDFGHJKL` 后，输入过程中按大写 A 会选择第一个候选词而不是输入字母。这在输入英文缩写时可能造成误操作。
:::

## 学习路径

1. **起步**：使用默认配置（5 个候选词、数字键选词）
2. **优化**：根据选词习惯调整 `page_size`（翻页太多就加大，扫描太慢就减小）
3. **进阶**：双拼用户尝试字母键选词，调整整句模式和用户词典
4. **精调**：根据使用场景微调核心词长度、同音词上限等高级参数

## 相关模块

- [候选词显示](./candidate-display) — 控制候选词的排列方向、拼音提示和注释显示
- [词典管理](./dictionary) — 词典质量直接影响候选词排序准确度
- [开关与杂项](./switches) — 部分开关（如候选排序）影响候选行为

<ConfigSlot module="candidate-settings" />
```

- [ ] **Step 2: Verify the build**

Run: `npx tsc --noEmit && npx vitest run`
Expected: No errors, all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/content/candidate-settings.mdx
git commit -m "docs: rewrite candidate-settings tutorial to match UI 1:1, add all advanced settings"
```

---

### Task 8: Final Verification

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass with no regressions.

- [ ] **Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: Zero errors.

- [ ] **Step 3: Run dev server and visually verify**

Run: `npm run dev`

Manual checks:
1. Navigate to the candidate settings page in the editor
2. Verify basic settings (page size, select keys) still work
3. Expand "高级设置" section
4. Verify all 8 settings are present with inline descriptions
5. Click `?` on each setting — verify help panel expands/collapses smoothly
6. Verify the two new settings (整句模式, 翻译器优先级) have working controls
7. Switch to tutorial panel — verify the content matches the UI settings
8. Check the tutorial in immersive mode (`ConfigSlot` renders correctly)

- [ ] **Step 4: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: address visual/functional issues from verification"
```
