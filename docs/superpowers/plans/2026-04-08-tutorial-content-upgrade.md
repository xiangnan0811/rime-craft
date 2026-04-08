# 教程内容全量升级 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite all 15 editor module tutorials to production quality (120-200 lines each) with YAML examples, callouts, learning paths, and cross-references, then fix the tutorial loader registration bug.

**Architecture:** Pure content + minor config changes. Each task rewrites one MDX file following the unified template (concept → config → scenarios → tips → learning path → cross-refs). Two standalone tutorials (auxiliary-code.mdx, lua-scripting.mdx) get merged into their module counterparts then deleted. tutorial-loaders.ts gets 7 missing entries added.

**Tech Stack:** MDX, React (ConfigSlot component), remark-directive

---

## File Structure

```
src/data/tutorial-loaders.ts          — Modify: add 7 missing MDX loader entries
src/content/switches.mdx              — Rewrite: full tutorial with multi-state switches
src/content/auxiliary-code-config.mdx  — Rewrite: merge from auxiliary-code.mdx + expand
src/content/lua-extensions.mdx        — Rewrite: merge from lua-scripting.mdx + expand
src/content/spelling-scheme.mdx       — Rewrite: full tutorial with 7 scheme comparison
src/content/key-bindings.mdx          — Rewrite: add function keys, unify ConfigSlot
src/content/candidate-settings.mdx    — Rewrite: add translator settings, unify ConfigSlot
src/content/reverse-lookup.mdx        — Rewrite: full tutorial with 5 methods
src/content/comment-hints.mdx         — Rewrite: full tutorial with 3-state explanations
src/content/candidate-display.mdx     — Rewrite: full tutorial with display options
src/content/schema-manager.mdx        — Rewrite: schema comparison, unify ConfigSlot
src/content/fuzzy-pinyin.mdx          — Rewrite: full rules table + dialect guide
src/content/punctuation.mdx           — Rewrite: full mapping guide
src/content/dictionary.mdx            — Rewrite: full dictionary architecture
src/content/special-input.mdx         — Rewrite: all 11 triggers detailed
src/content/ascii-mode.mdx            — Rewrite: full switching mechanism
src/content/auxiliary-code.mdx        — Delete: merged into auxiliary-code-config.mdx
src/content/lua-scripting.mdx         — Delete: merged into lua-extensions.mdx
```

---

### Task 1: Fix tutorial-loaders.ts

**Files:**
- Modify: `src/data/tutorial-loaders.ts`

- [ ] **Step 1: Add 7 missing MDX loader entries**

Replace the entire file content with:

```typescript
import type { ComponentType } from 'react'

export const MDX_LOADERS: Record<string, () => Promise<{ default: ComponentType }>> = {
  'schema-manager': () => import('@/content/schema-manager.mdx'),
  'candidate-settings': () => import('@/content/candidate-settings.mdx'),
  'key-bindings': () => import('@/content/key-bindings.mdx'),
  'fuzzy-pinyin': () => import('@/content/fuzzy-pinyin.mdx'),
  'ascii-mode': () => import('@/content/ascii-mode.mdx'),
  'punctuation': () => import('@/content/punctuation.mdx'),
  'dictionary': () => import('@/content/dictionary.mdx'),
  'switches': () => import('@/content/switches.mdx'),
  'spelling-scheme': () => import('@/content/spelling-scheme.mdx'),
  'auxiliary-code-config': () => import('@/content/auxiliary-code-config.mdx'),
  'reverse-lookup': () => import('@/content/reverse-lookup.mdx'),
  'special-input': () => import('@/content/special-input.mdx'),
  'lua-extensions': () => import('@/content/lua-extensions.mdx'),
  'candidate-display': () => import('@/content/candidate-display.mdx'),
  'comment-hints': () => import('@/content/comment-hints.mdx'),
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds. All 15 modules now show tutorial content in the editor sidebar instead of "暂无此模块的教程内容".

- [ ] **Step 3: Commit**

```bash
git add src/data/tutorial-loaders.ts
git commit -m "fix: register all 15 MDX tutorial loaders"
```

---

### Task 2: Rewrite switches.mdx

**Files:**
- Modify: `src/content/switches.mdx`

- [ ] **Step 1: Write the tutorial content**

Replace the entire file with:

```mdx
# 开关与杂项

开关是 Rime 最灵活的功能切换机制——不需要编辑配置文件，只需一个快捷键或菜单操作，就能在输入过程中动态切换 Emoji 显示、简繁转换、标点模式等功能。

## 这是什么

Rime 的「开关」（Switches）本质上是一组带有名字的**状态变量**。每个开关可以处于若干状态之一，用户通过 `Ctrl+~`（macOS 为 `Control+~`）进入方案菜单来切换状态，部分开关也支持快捷键直接切换。

开关的行为由方案文件中的 `switches` 段定义。Rime 中有两种开关类型：

**二值开关**：只有开/关两种状态，用 `name` 字段标识：

```yaml
switches:
  - name: emoji          # 开关名称（引擎识别）
    reset: 1             # 部署后默认状态（0=关, 1=开）
    states: [关, 开]     # 两种状态的显示标签
```

**多状态开关**：有 3 个或更多状态，用 `options` 数组标识：

```yaml
switches:
  - options: [s2s, s2t, s2hk, s2tw]   # 各状态的内部名称
    reset: 0                            # 默认选中第 0 个
    states: [简体, 通繁, 港繁, 臺繁]    # 各状态的显示标签
```

`reset` 字段指定**每次部署后**开关的默认状态索引。

## 配置项详解

### 基础开关

| 开关 | 名称 | 默认 | 说明 |
|------|------|------|------|
| Emoji | `emoji` | 开 | 候选词中是否显示 Emoji 表情 |
| 全角/半角 | `full_shape` | 半角 | 字母和数字输出全角还是半角字符 |
| 中英标点 | `ascii_punct` | 中文 | 中文模式下输出中文标点还是英文标点 |

### 简繁转换（多状态）

万象拼音的简繁转换支持 4 种输出字形，而非传统方案的简单二值切换：

| 状态 | 内部值 | 说明 |
|------|--------|------|
| 简体 | `s2s` | 标准简体中文（默认） |
| 通繁 | `s2t` | 通用繁体（OpenCC 标准转换） |
| 港繁 | `s2hk` | 香港繁体用字习惯 |
| 臺繁 | `s2tw` | 台湾繁体用字习惯 |

```yaml
patch:
  switches/@3:   # 假设简繁转换是第 4 个开关
    options: [s2s, s2t, s2hk, s2tw]
    reset: 0
    states: [简体, 通繁, 港繁, 臺繁]
```

### 输入增强

| 开关 | 名称 | 默认 | 说明 |
|------|------|------|------|
| 预测输入 | `prediction` | 关 | 根据上下文预测下一个词 |
| 简码 | `abbrev` | 开 | 启用首字母简码输入（如 `bj` → 北京） |
| 翻译模式 | `chinese_english` | 关 | 输入中文时显示对应英文翻译 |

### 显示控制

| 开关 | 名称 | 默认 | 说明 |
|------|------|------|------|
| 字集过滤 | `charset_filter` | 大字集 | 限制候选词的字符集范围 |
| 候选排序 | `char_priority` | 词组先 | 优先显示单字还是词组 |
| Tips 提示 | `super_tips` | 关 | 显示扩展提示信息 |

### 编码显示（多状态）

控制候选栏中编码的显示格式，3 种状态：

| 状态 | 内部值 | 显示效果 |
|------|--------|---------|
| 原编码 | `raw_input` | 显示你实际输入的按键，如 `nihk` |
| 有声调 | `tone_display` | 转换为带声调的拼音，如 `nǐ hǎo` |
| 无声调 | `full_pinyin` | 转换为无声调拼音，如 `ni hao` |

### 注释模式（多状态）

控制候选词旁注释的显示方式，3 种状态：

| 状态 | 内部值 | 说明 |
|------|--------|------|
| 注释关 | `comment_off` | 不显示任何注释 |
| 有声调 | `tone_hint` | 显示带声调标记的拼音注释 |
| 无声调 | `toneless_hint` | 显示不带声调的拼音注释 |

<ConfigSlot module="switches" />

## 常见场景与推荐搭配

**日常简体用户**：保持大部分默认值，开启 Emoji，简繁设为简体：

```yaml
patch:
  switches:
    - name: emoji
      reset: 1
    - options: [s2s, s2t, s2hk, s2tw]
      reset: 0        # 简体
```

**繁体用户（台湾）**：将简繁转换默认设为臺繁：

```yaml
patch:
  switches:
    - options: [s2s, s2t, s2hk, s2tw]
      reset: 3        # 臺繁
```

**效率追求者**：开启预测输入、保持简码，关闭 Emoji 减少候选干扰：

```yaml
patch:
  switches:
    - name: emoji
      reset: 0
    - name: prediction
      reset: 1
    - name: char_priority
      reset: 1        # 单字先，配合辅助码使用
```

## 进阶技巧

<tip>
多状态开关在方案菜单（`Ctrl+~`）中会显示为一个带箭头的选项，每次选择会循环切换到下一个状态。你也可以通过快捷键绑定来快速切换。
</tip>

<warning>
修改 `switches` 段时，注意保持开关的**顺序**不变。Rime 通过开关在数组中的位置来匹配用户的历史选择。如果你插入或删除了开关，已有的用户状态可能会错位。
</warning>

可以为任意开关绑定快捷键实现一键切换：

```yaml
patch:
  key_binder/bindings:
    - { when: always, accept: Control+Shift+E, toggle: emoji }
    - { when: always, accept: Control+Shift+F, toggle: simplification }
```

## 学习路径

1. **起步**：先使用默认配置体验所有开关，通过 `Ctrl+~` 菜单了解有哪些可切换的选项
2. **调整**：根据使用习惯修改最常用的开关默认值（Emoji、简繁、标点）
3. **进阶**：为高频操作绑定快捷键，探索多状态开关的不同状态

## 相关模块

- [按键绑定](./key-bindings) — 为开关绑定快捷键
- [注释与提示](./comment-hints) — 注释模式开关的详细配置
- [候选词设置](./candidate-settings) — 部分开关影响候选行为
- [标点符号映射](./punctuation) — `ascii_punct` 开关的详细说明

<ConfigSlot module="switches" />
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/content/switches.mdx
git commit -m "docs: rewrite switches tutorial with multi-state switches and complete guide"
```

---

### Task 3: Rewrite auxiliary-code-config.mdx (merge from auxiliary-code.mdx)

**Files:**
- Modify: `src/content/auxiliary-code-config.mdx`

- [ ] **Step 1: Write the tutorial content**

Replace the entire file with:

```mdx
# 辅助码配置

辅助码是万象拼音最具特色的进阶功能——通过在拼音编码后追加 1-2 个字形码，将数十个同音候选词瞬间缩减到 1-3 个，让单字输入效率产生质的飞跃。

## 这是什么

拼音输入法最大的痛点是**重码**。输入 `shi` 会出现「是、时、事、式、市、师、诗……」几十个候选词，需要频繁翻页选字。辅助码（Auxiliary Code）在拼音之后补充**字形维度**的信息，形成「音形结合」的输入方式：拼音定音，形码定形。

辅助码**不替代**拼音，而是在你需要的时候追加额外编码来精确筛选。日常打词组时不需要辅助码（词组本身重码少），只有在打单字或遇到重码时才会用到。

### 辅助码方案对比

万象拼音内置 8 种辅助码系统，每种基于不同的字形拆分逻辑：

| 方案 | 字形基础 | 难度 | 适合人群 |
|------|----------|------|---------|
| **墨奇码** | 字形拆分 | 中等 | 万象推荐默认，学习资料丰富 |
| **鹤形** | 字根（类五笔） | 中高 | 小鹤双拼用户的自然选择 |
| **自然码** | 部首+笔画 | 中等 | 自然码双拼用户配套使用 |
| **虎码** | 字根 | 中高 | 追求极低重码率的用户 |
| **五笔** | 五笔字根 | 高 | 已经会五笔的用户，零学习成本 |
| **仓颉** | 仓颉字根 | 高 | 已经会仓颉的用户 |
| **简单鹤** | 鹤形简化版 | 低 | 辅助码入门首选，规则更简单 |
| **汉心码** | 笔画 | 低 | 不想学字根，用笔画顺序编码 |

## 配置项详解

### 辅助码方案选择

选择你想使用的辅助码系统：

```yaml
patch:
  # 以墨奇码为例
  auxiliary_code/scheme: moqi
  # 可选值: moqi, hexing, zrm, tiger, wubi, cangjie, simple_he, hanxin
```

### 引导方式

万象支持 3 种辅助码触发方式，适合不同阶段的用户：

**直接辅助码**：在拼音编码末尾直接追加辅助码，无需额外按键。例如输入「万」字：

```
wjag    ← 拼音 wj（万的双拼）+ 辅助码 ag
```

效率最高，但需要记住每个字的辅助码。适合已经熟练的用户。

**间接辅助码**：在拼音后加 `/` 作为分隔符，再输入辅助码：

```
wj/ag   ← 拼音 wj + 分隔符 / + 辅助码 ag
```

视觉上更清晰，你可以先输入拼音看候选词，决定是否需要追加辅助码。

**反引号引导**：输入拼音后按 `` ` `` 键进入辅助码模式：

```
wj → 按 ` → 输入 ag → 候选词精确到「万」
```

最容易上手，新手推荐。你可以先正常输入拼音，只在遇到重码时才按 `` ` `` 追加辅助码。

```yaml
patch:
  # 引导方式配置
  auxiliary_code/trigger: backtick    # backtick(反引号) | direct(直接) | slash(间接)
```

### 辅助码提示

启用提示后，候选词旁会显示对应的辅助码编码，方便学习和记忆：

```yaml
patch:
  auxiliary_code/show_hint: true      # 显示辅助码提示
  auxiliary_code/hint_length: 1       # 只对单字显示提示（1=单字, 2=两字词也显示）
```

<ConfigSlot module="auxiliary-code" />

## 常见场景与推荐搭配

**入门用户（刚开始学辅助码）**：

```yaml
patch:
  auxiliary_code/scheme: simple_he    # 简单鹤，规则最简单
  auxiliary_code/trigger: backtick    # 反引号引导，随时可追加
  auxiliary_code/show_hint: true      # 开启提示辅助记忆
  auxiliary_code/hint_length: 1       # 只对单字显示
```

**小鹤双拼用户**：

```yaml
patch:
  auxiliary_code/scheme: hexing       # 鹤形，与小鹤双拼配套
  auxiliary_code/trigger: direct      # 直接辅助码，效率最高
  auxiliary_code/show_hint: false     # 已熟练，关闭提示
```

**追求低重码的进阶用户**：

```yaml
patch:
  auxiliary_code/scheme: tiger        # 虎码，重码率极低
  auxiliary_code/trigger: slash       # 间接模式，视觉清晰
  auxiliary_code/show_hint: true      # 学习阶段保持提示
```

## 进阶技巧

<tip>
学习辅助码不需要一次记住所有字。推荐的策略是：只对你日常输入中**高频重码字**练习辅助码。比如「的地得」「他她它」这些字，记住它们的辅助码就能显著减少选词次数。随着使用时间增长，你会自然覆盖更多字形记忆。
</tip>

<warning>
切换辅助码方案后，之前记忆的辅助码编码会失效——因为不同方案对同一个字的拆分方式不同。建议选定一个方案后就坚持使用，不要频繁更换。
</warning>

<note>
如果你同时使用辅助码和[注释模式](./comment-hints)，可以让候选词旁同时显示辅助码编码和拼音注释。这对学习阶段非常有帮助——你可以一边打字一边学习每个字的辅助码。
</note>

### 实际输入示例

以输入「学」字为例，展示辅助码的实际效果：

1. **纯拼音**：输入 `xue` → 候选列表可能有 10+ 候选（学、雪、血、穴……）
2. **反引号引导**：输入 `xue` → 按 `` ` `` → 输入 `ip` → 候选精确到「学」
3. **直接辅助码**：输入 `xueip` → 直接出现「学」（双拼下为 `xuip`）

## 学习路径

1. **第一步**：先用纯拼音熟悉万象拼音的基本操作，不急着开辅助码
2. **第二步**：选择一个辅助码方案（推荐墨奇码或简单鹤），开启反引号引导模式和辅助码提示
3. **第三步**：只对 10-20 个高频重码字练习辅助码（的地得、他她它、在再、以已等）
4. **第四步**：逐步扩大辅助码使用范围，当正确率提高后可切换为直接辅助码模式

## 相关模块

- [拼写方案](./spelling-scheme) — 双拼 + 辅助码是效率最高的组合
- [注释与提示](./comment-hints) — 控制辅助码提示的显示方式
- [反查与筛选](./reverse-lookup) — 反查时也可以利用辅助码信息
- [候选词显示](./candidate-display) — `spelling_hints` 与辅助码提示的配合

<ConfigSlot module="auxiliary-code" />
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/content/auxiliary-code-config.mdx
git commit -m "docs: rewrite auxiliary code tutorial with full guide and scheme comparison"
```

---

### Task 4: Rewrite lua-extensions.mdx (merge from lua-scripting.mdx)

**Files:**
- Modify: `src/content/lua-extensions.mdx`

- [ ] **Step 1: Write the tutorial content**

Replace the entire file with:

```mdx
# Lua 扩展

Lua 扩展是万象拼音的「超能力引擎」——通过内置的 Lua 脚本，万象实现了超级注释、智能预测、输入统计等超越传统输入法的增强功能。

## 这是什么

Rime 内置了 Lua 脚本引擎，允许在不修改 C++ 源码的情况下扩展输入法功能。Lua 脚本在输入法的处理流水线中有三个挂载点：

- **处理器（Processor）**：拦截键盘事件，在引擎处理之前介入。例如：特殊按键行为、退格限制
- **翻译器（Translator）**：将编码转换为候选词。例如：日期输出、计算器、Unicode 输入
- **过滤器（Filter）**：对候选词列表进行二次加工。例如：添加注释、调整排序、过滤词汇

输入流水线的处理顺序是：用户按键 → **Processor** 拦截处理 → **Translator** 生成候选 → **Filter** 加工候选 → 显示候选词列表。

万象拼音内置了 4 大 Lua 扩展模块，你可以根据需要调整参数或开关。

## 配置项详解

### 超级注释（super_comment）

为候选词添加丰富的注释信息，包括辅助码编码、纠错提示、拼音标注等。这是辅助码学习阶段最有价值的功能。

```yaml
patch:
  # 超级注释配置
  super_comment/enabled: true
  super_comment/max_length: 1        # 注释候选词的最大长度（1=仅单字, 2=包含两字词）
  super_comment/show_correction: true # 显示纠错提示（打错时提醒正确拼音）
```

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `enabled` | true | 是否启用超级注释 |
| `max_length` | 1 | 显示注释的候选词最大字数 |
| `show_correction` | true | 是否显示纠错提示 |

<note>
超级注释的**显示/隐藏**由[开关](./switches)中的「注释模式」控制。这里配置的是注释的**内容和范围**。两者需要配合使用：注释模式开关控制「显不显示」，超级注释配置控制「显示什么」。
</note>

### 超级处理器（super_processor）

增强键盘处理逻辑，提供 3 项实用功能：

**退格限制**：防止在输入过程中误按退格键删除过多字符。当输入串长度大于指定值时，退格键只删除最后一个字符而不会清空整个输入。

**音节循环**：按 Tab 键在多音节输入中循环跳转。例如输入 `nihao` 时按 Tab 可以在 `ni` 和 `hao` 之间切换焦点，方便修改特定音节。

**声调回落**：输入声调符号（数字键 1-4）时，如果当前编码不支持声调输入，自动将声调字符回落为普通数字输入，避免卡住。

```yaml
patch:
  super_processor/backspace_limit: true    # 启用退格限制
  super_processor/syllable_cycle: true     # 启用音节循环
  super_processor/tone_fallback: true      # 启用声调回落
```

### 用户预测（user_predict）

基于你的输入历史，智能预测下一个可能输入的词。开启后，候选词列表末尾会出现灰色的预测词。

```yaml
patch:
  user_predict/enabled: true
  user_predict/max_candidates: 3           # 最多显示几个预测词
  user_predict/expiration_days: 90         # 预测数据的过期天数
  user_predict/activation_days: 3          # 使用多少天后开始激活预测
```

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `max_candidates` | 3 | 预测候选词数量（1-5） |
| `expiration_days` | 90 | 超过此天数的历史数据不再参与预测 |
| `activation_days` | 3 | 新安装后需使用满此天数才会开始预测 |

<tip>
`activation_days` 的设计目的是避免在数据量不足时给出低质量的预测。如果你从其他设备迁移了用户词典，可以将此值设为 0 立即启用预测。
</tip>

### 输入统计（input_stats）

自动记录输入字数、词数等统计数据，可通过[特殊输入](./special-input)的触发码查看：

- `/tj`：查看累计输入统计
- `/rtj`：查看今日输入统计

统计功能默认开启，无需额外配置。

<ConfigSlot module="lua-extensions" />

## 常见场景与推荐搭配

**辅助码学习期**：开启超级注释，最大化学习辅助：

```yaml
patch:
  super_comment/enabled: true
  super_comment/max_length: 2           # 两字词也显示注释
  super_comment/show_correction: true   # 打错时提醒
  user_predict/enabled: false           # 学习期先关闭预测，减少干扰
```

**日常高效输入**：开启预测，关闭多余注释：

```yaml
patch:
  super_comment/max_length: 1           # 仅单字注释
  user_predict/enabled: true
  user_predict/max_candidates: 2        # 少量预测，不影响选词
```

**极简模式**：最少干扰，最快速度：

```yaml
patch:
  super_comment/enabled: false          # 关闭注释
  user_predict/enabled: false           # 关闭预测
  super_processor/syllable_cycle: true  # 保留音节循环（实用）
```

## 进阶技巧

<warning>
用户预测的数据存储在用户词典中。如果你清理了用户词典，预测数据也会被清除。执行词典清理前请考虑是否要保留预测记录。
</warning>

### Lua 脚本文件位置

万象拼音的 Lua 脚本位于方案包的 `lua/` 目录下。如果你想查看或修改脚本逻辑，可以在 Rime 用户目录找到：

```
~/Library/Rime/lua/              # macOS（鼠须管）
%APPDATA%\Rime\lua\              # Windows（小狼毫）
~/.config/ibus/rime/lua/         # Linux（ibus-rime）
```

入口文件是 `rime.lua`，它负责注册所有 Lua 组件。

### 调试 Lua 脚本

如果 Lua 扩展行为异常，可以查看 Rime 的日志文件定位问题：

```bash
# macOS
tail -f $TMPDIR/rime.squirrel.INFO

# Windows 查看 %TEMP%\rime.weasel.INFO
```

在脚本中使用 `log.info("调试信息")` 可以输出中间值到日志。

## 学习路径

1. **起步**：保持所有 Lua 扩展的默认配置，先感受它们的效果
2. **调整**：根据使用习惯调整超级注释的显示范围和预测候选数量
3. **进阶**：了解 Lua 在 Rime 中的三类组件（Processor/Translator/Filter），探索社区的第三方 Lua 扩展

## 相关模块

- [注释与提示](./comment-hints) — 注释模式开关控制超级注释的显示/隐藏
- [特殊输入](./special-input) — 日期、计算器等特殊输入由 Lua Translator 实现
- [开关与杂项](./switches) — `super_comment` 开关与超级注释功能联动

<ConfigSlot module="lua-extensions" />
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/content/lua-extensions.mdx
git commit -m "docs: rewrite Lua extensions tutorial with full guide and merged scripting intro"
```

---

### Task 5: Rewrite spelling-scheme.mdx

**Files:**
- Modify: `src/content/spelling-scheme.mdx`

- [ ] **Step 1: Write the tutorial content**

Replace the entire file with:

```mdx
# 拼写方案

拼写方案决定了你如何将按键转化为拼音编码。万象拼音支持在同一方案内切换全拼和 6 种双拼，无需安装额外方案文件——这意味着你可以随时尝试不同的双拼方案，找到最适合自己的键位布局。

## 这是什么

输入拼音的方式分为两大类：

**全拼**：每个音节完整拼出，按键数不固定。例如「装」= `zhuang`（6 键），「你」= `ni`（2 键）。优点是零学习成本，缺点是长音节按键太多。

**双拼**：将每个音节压缩为固定的 2 键（声母 + 韵母），通过一套特殊的键位映射实现。例如在小鹤双拼中「装」= `vl`（2 键），「你」= `ni`（2 键）。学习成本约 1-2 周，但之后每个音节都是 2 键，整体输入效率提升 20-30%。

### 万象支持的 7 种拼写方案

| 方案 | 特点 | 适合人群 |
|------|------|---------|
| **全拼** | 标准拼音，无学习成本 | 不想学双拼的用户 |
| **小鹤双拼** | 最流行，键位均匀，社区活跃 | 首选双拼方案 |
| **自然码双拼** | 历史最久的双拼方案 | 自然码老用户 |
| **微软双拼** | 微软拼音的默认双拼 | 从微软拼音迁移的用户 |
| **搜狗双拼** | 搜狗输入法的默认双拼 | 从搜狗迁移的用户 |
| **智能ABC双拼** | 经典老方案 | 智能ABC老用户 |
| **紫光双拼** | 紫光/华宇输入法方案 | 从紫光迁移的用户 |

各方案的主要差异在于韵母的键位分布——声母键位基本一致。如果你没有历史包袱，推荐选择**小鹤双拼**，因为它的键位设计最均匀（左右手负担平衡），学习资料和社区支持也最丰富。

## 配置项详解

### 切换拼写方案

在万象拼音中，可以通过输入特定指令来切换拼写方案：

| 指令 | 切换到 |
|------|--------|
| `/quanpin` | 全拼 |
| `/flypy` | 小鹤双拼 |
| `/zrm` | 自然码双拼 |
| `/mspy` | 微软双拼 |
| `/sogou` | 搜狗双拼 |
| `/abc` | 智能ABC双拼 |
| `/ziguang` | 紫光双拼 |

切换后系统会自动生成对应的补丁文件，无需手动编辑配置。

也可以在配置文件中直接指定：

```yaml
patch:
  speller/spelling_scheme: flypy    # 可选: full_pinyin, flypy, zrm, mspy, sogou, abc, ziguang
```

<ConfigSlot module="spelling-scheme" />

## 常见场景与推荐搭配

**从零开始学双拼**：

如果你从未接触过双拼，推荐从小鹤双拼开始。第一周会比全拼慢，但坚持 2 周后速度就会追平甚至超越全拼。

```yaml
patch:
  speller/spelling_scheme: flypy
```

<tip>
学习双拼的秘诀是**不要回头**。切换到双拼后，即使打字变慢也不要切回全拼。大脑需要时间建立新的肌肉记忆，反复切换只会延长适应期。推荐在周末开始切换，利用两天低强度时间适应。
</tip>

**从搜狗/微软迁移**：

如果你之前在搜狗或微软拼音中使用了双拼，可以直接切换到对应方案，零适应成本：

```yaml
patch:
  speller/spelling_scheme: sogou    # 或 mspy
```

**双拼 + 辅助码（效率最高组合）**：

双拼让每个音节固定 2 键，辅助码再追加 1-2 个字形码。这意味着一个字最多只需 4 键就能精确定位，是目前效率最高的拼音输入方式。

```yaml
patch:
  speller/spelling_scheme: flypy
  auxiliary_code/scheme: hexing       # 小鹤双拼配鹤形辅助码
  auxiliary_code/trigger: direct      # 直接辅助码，最高效
```

## 进阶技巧

<warning>
切换拼写方案后，模糊音规则可能需要重新配置。双拼模式下的模糊音行为与全拼不同——部分双拼方案已经内置了某些模糊音的处理（如小鹤双拼的前后鼻音），开启额外模糊音可能导致冲突。
</warning>

<note>
万象拼音的方案内切换机制意味着你的用户词典在切换拼写方案后仍然有效——因为底层的词库是共享的。这是相比安装独立双拼方案的一大优势。
</note>

## 学习路径

1. **第一步**：如果你是全拼用户，先保持全拼使用，体验万象的其他功能
2. **第二步**：有兴趣尝试双拼时，选择小鹤双拼（或你熟悉的方案），通过 `/flypy` 切换
3. **第三步**：适应双拼后（约 2 周），考虑加入辅助码进一步提升效率

## 相关模块

- [辅助码配置](./auxiliary-code-config) — 双拼 + 辅助码是效率最高的组合
- [模糊音规则](./fuzzy-pinyin) — 切换拼写方案后可能需要调整模糊音

<ConfigSlot module="spelling-scheme" />
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/content/spelling-scheme.mdx
git commit -m "docs: rewrite spelling scheme tutorial with 7-scheme comparison and learning guide"
```

---

### Task 6: Rewrite key-bindings.mdx

**Files:**
- Modify: `src/content/key-bindings.mdx`

- [ ] **Step 1: Write the tutorial content**

Replace the entire file with:

```mdx
# 按键绑定

按键绑定控制着 Rime 最核心的操作体验——中英文怎么切换、Caps Lock 怎么用、哪些快捷键触发哪些功能。合理的按键配置能让 Rime 完全适应你的操作习惯。

## 这是什么

Rime 中按键相关的配置集中在两个地方：

- **`ascii_composer`**：控制中英文切换行为——哪些键可以触发切换，以及切换时对当前输入做什么处理
- **`key_binder`**：控制功能快捷键——翻页、以词定字、开关切换等

这些配置作用于**全局**，影响所有方案。在 `default.custom.yaml` 中修改。

## 配置项详解

### 中英文切换（ascii_composer）

`switch_key` 定义了 5 个可用于切换的键位，每个键可以配置为以下 5 种行为之一：

| 行为 | 说明 | 输入 `nihao` 候选「你好」时的效果 |
|------|------|------|
| `commit_code` | 上屏原始字母，切换到英文 | 上屏 `nihao`，切英文 |
| `commit_text` | 上屏当前候选词，切换到英文 | 上屏「你好」，切英文 |
| `inline_ascii` | 临时英文模式，松开后回到中文 | 进入临时英文，不上屏 |
| `clear` | 清空输入，切换到英文 | 丢弃输入，切英文 |
| `noop` | 不做任何操作（禁用此键） | 无反应 |

```yaml
patch:
  ascii_composer/switch_key:
    Shift_L: commit_code      # 左 Shift
    Shift_R: commit_text      # 右 Shift
    Control_L: noop            # 左 Control（禁用）
    Control_R: noop            # 右 Control（禁用）
    Caps_Lock: clear           # Caps Lock
```

### Caps Lock 行为

`good_old_caps_lock` 控制 Caps Lock 是否保持传统键盘行为：

- `true`（推荐）：Caps Lock 直接切换大写状态，不经过 Rime 处理，行为与系统一致
- `false`：Caps Lock 按照 `switch_key/Caps_Lock` 中配置的行为执行

```yaml
patch:
  ascii_composer/good_old_caps_lock: true
```

### 功能快捷键（key_binder）

万象拼音提供了一系列功能快捷键，可以快速切换开关或执行操作：

**功能切换类**：

| 快捷键 | 功能 | 说明 |
|--------|------|------|
| `Ctrl+A` | 注释切换 | 切换辅助码/声调注释显示 |
| `Ctrl+S` | 声调显示 | 在编码中显示声调标记 |
| `Ctrl+E` | 翻译模式 | 切换中英翻译 |
| `Ctrl+T` | Tips 提示 | 切换扩展提示信息 |
| `Ctrl+G` | 字集切换 | 切换大字集/小字集 |

**导航类**：

| 快捷键 | 功能 | 说明 |
|--------|------|------|
| `Tab` | 音节跳转 | 在多音节输入中循环切换焦点 |
| `-` | 向上翻页 | 候选词向上翻页 |
| `=` | 向下翻页 | 候选词向下翻页 |

**编辑类**：

| 快捷键 | 功能 | 说明 |
|--------|------|------|
| `Ctrl+J` | 左移排序 | 手动将候选词向左移动 |
| `Ctrl+K` | 右移排序 | 手动将候选词向右移动 |

<ConfigSlot module="key-bindings" />

## 常见场景与推荐搭配

**macOS 用户经典配置**（左 Shift 上屏字母，右 Shift 上屏候选词）：

```yaml
patch:
  ascii_composer/good_old_caps_lock: true
  ascii_composer/switch_key:
    Shift_L: commit_code
    Shift_R: commit_text
    Control_L: noop
    Control_R: noop
    Caps_Lock: clear
```

**只用左 Shift 切换（最简配置）**：

```yaml
patch:
  ascii_composer/switch_key:
    Shift_L: inline_ascii
    Shift_R: noop
    Control_L: noop
    Control_R: noop
    Caps_Lock: noop
```

**禁用所有 Shift 切换（避免误触，适合双拼用户）**：

双拼用户在连续输入时容易误触 Shift 导致切换到英文，可以完全禁用：

```yaml
patch:
  ascii_composer/switch_key:
    Shift_L: noop
    Shift_R: noop
    Control_L: noop
    Control_R: noop
    Caps_Lock: clear        # 保留 Caps Lock 作为唯一切换键
```

## 进阶技巧

<tip>
`commit_code` 和 `commit_text` 的区别很微妙但很实用。如果你经常在输入拼音的过程中需要切换到英文（比如输入英文变量名），`commit_code` 会保留你已输入的字母；而如果你经常在选词后顺手切英文，`commit_text` 更合适。
</tip>

<warning>
在 macOS 上，如果你使用系统级的输入法切换（如 `Ctrl+空格`），注意它与 Rime 自己的中英切换是独立的两套机制。推荐使用 Rime 的 Shift 切换来切换中英文，用系统快捷键来切换不同输入法。
</warning>

## 学习路径

1. **起步**：先使用默认按键配置，体验各个快捷键的功能
2. **调整**：根据习惯修改中英文切换键（最常见的定制需求）
3. **进阶**：为常用功能绑定自定义快捷键，如 `Ctrl+Shift+F` 切换简繁

## 相关模块

- [中英文切换](./ascii-mode) — 按键配置与中英模式的完整联动关系
- [开关与杂项](./switches) — 快捷键可以绑定开关切换（toggle 动作）

<ConfigSlot module="key-bindings" />
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/content/key-bindings.mdx
git commit -m "docs: rewrite key bindings tutorial with function keys and platform guide"
```

---

### Task 7: Rewrite candidate-settings.mdx

**Files:**
- Modify: `src/content/candidate-settings.mdx`

- [ ] **Step 1: Write the tutorial content**

Replace the entire file with:

```mdx
# 候选词设置

候选词面板是输入法最核心的交互界面。合理设置候选词数量、选择方式和高级翻译参数，能显著降低选词次数，提升输入效率。

## 这是什么

当你输入一段拼音时，Rime 会显示一列候选词供你选择。候选词设置控制三个层面：

- **基础显示**：每页显示多少个候选词、用什么键来选词
- **翻页行为**：如何在候选词页面之间导航
- **翻译引擎**：控制候选词的生成策略（逐码提示、整句模式、优先级）

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

这些参数控制候选词的生成策略：

**逐码提示（enable_completion）**：

```yaml
patch:
  translator/enable_completion: true
```

开启后，输入不完整的拼音也会显示候选词。例如输入 `n` 就会出现「你、那、能……」。关闭后必须输入完整音节才会有候选。大多数用户应保持开启。

**整句模式（enable_sentence）**：

```yaml
patch:
  translator/enable_sentence: true
```

开启后，Rime 会尝试将多个音节组合成完整的句子候选。适合习惯整句输入的用户。关闭后每次只匹配单个词组。

**优先级（initial_quality）**：

```yaml
patch:
  translator/initial_quality: 1.2
```

控制翻译器生成的候选词的初始权重。数值越高，该翻译器的候选词排名越靠前。通常不需要修改，除非你同时使用多个翻译器并想调整它们的优先级。

<ConfigSlot module="candidate-settings" />

## 常见场景与推荐搭配

**全拼用户的典型配置**：

```yaml
patch:
  menu/page_size: 5
  translator/enable_completion: true
  translator/enable_sentence: true
```

数字键选词、5 个候选词，简单直接。

**双拼用户推荐配置**：

```yaml
patch:
  menu/page_size: 7
  menu/alternative_select_keys: "ASDFGHJKL"
  translator/enable_completion: true
```

7 个候选词减少翻页，字母键选词让手指保持在主键盘区。

**单字输入为主（配合辅助码）**：

```yaml
patch:
  menu/page_size: 5
  translator/enable_sentence: false     # 关闭整句，专注单字
  translator/enable_completion: true
```

## 进阶技巧

<tip>
如果你使用辅助码，`page_size` 的重要性会降低——因为辅助码可以将候选词精确缩减到 1-3 个，几乎不需要翻页。此时 5 个候选词就足够了。
</tip>

<warning>
`alternative_select_keys` 设置的字母会「占用」这些键位。例如设置了 `ASDFGHJKL` 后，输入过程中按大写 A 会选择第一个候选词而不是输入字母。这在输入英文缩写时可能造成误操作。
</warning>

## 学习路径

1. **起步**：使用默认配置（5 个候选词、数字键选词）
2. **优化**：根据选词习惯调整 `page_size`（翻页太多就加大，扫描太慢就减小）
3. **进阶**：双拼用户尝试字母键选词，调整翻译引擎参数

## 相关模块

- [词典管理](./dictionary) — 词典质量直接影响候选词排序准确度
- [开关与杂项](./switches) — 部分开关（如候选排序）影响候选行为

<ConfigSlot module="candidate-settings" />
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/content/candidate-settings.mdx
git commit -m "docs: rewrite candidate settings tutorial with translator advanced settings"
```

---

### Task 8: Rewrite reverse-lookup.mdx

**Files:**
- Modify: `src/content/reverse-lookup.mdx`

- [ ] **Step 1: Write the tutorial content**

Replace the entire file with:

```mdx
# 反查与筛选

遇到不认识的字，不知道怎么读，怎么用拼音输入法打出来？反查功能就是为这个场景设计的——通过字形拆分、笔画、部首等方式查找你不知道读音的字。

## 这是什么

反查（Reverse Lookup）是一种**逆向查字**机制。正常输入是「知道读音 → 输入拼音 → 找到字」，反查则是「不知道读音 → 通过其他方式描述字形 → 找到字并学会读音」。

在万象拼音中，按下反查触发键（默认为反引号 `` ` ``）即可进入反查模式。进入后，你可以使用多种方式来描述你要找的字。

## 配置项详解

### 反查触发键

```yaml
patch:
  recognizer/patterns/reverse_lookup: "^`[a-z]*$"    # 反引号触发
```

按下 `` ` `` 后输入反查编码，候选词列表会显示匹配的汉字及其拼音。

### 反查方式

万象拼音支持 5 种反查方式：

**两分反查**：将字拆成左右（或上下）两部分，分别输入它们的拼音。例如「明」可以拆为「日」+「月」：

```
` + ri + yue → 明 (míng)
```

**多分反查**：将字拆成多个部分。例如「赢」可以拆为「亡」+「口」+「月」+「贝」+「凡」：

```
` + wang + kou + yue + bei + fan → 赢 (yíng)
```

**笔画反查**：用固定字母代表笔画来查字：

| 字母 | 笔画 | 例子 |
|------|------|------|
| `h` | 横（一） | 一、二、三 |
| `s` | 竖（丨） | 十、中 |
| `p` | 撇（丿） | 人、入 |
| `n` | 捺（丶） | 之、永 |
| `z` | 折（乛） | 了、乙 |

例如查「中」字：`s + h + s + h`（竖横竖横，但实际笔顺为 丨フ一丨）

**声调反查**：输入拼音后通过声调信息辅助筛选，缩小候选范围。

**辅助码反查**：利用已知的辅助码编码进行反查，适合已学习辅助码的用户。

### 数据源选择

反查数据有两种来源：

```yaml
patch:
  reverse_lookup/source: aux    # 或 db
```

| 数据源 | 说明 | 适用场景 |
|--------|------|---------|
| `aux` | 从词库注释中提取反查数据 | 轻量，随词库更新，但数据可能不完整 |
| `db` | 使用独立的反查数据库文件 | 数据更完整准确，但需要额外文件空间 |

<tip>
如果你经常使用反查功能，推荐选择 `db` 数据源。独立数据库的反查数据更完整，覆盖更多生僻字和异体字。
</tip>

<ConfigSlot module="reverse-lookup" />

## 常见场景与推荐搭配

**日常使用（偶尔反查）**：

```yaml
patch:
  reverse_lookup/source: aux          # 轻量数据源
```

保持默认配置即可。遇到不认识的字时按 `` ` `` 进入反查，用两分法拆字查找。

**重度反查用户（经常遇到生僻字）**：

```yaml
patch:
  reverse_lookup/source: db           # 完整数据库
```

**学习辅助码时的辅助工具**：

反查不只是查字——当你在反查结果中看到一个字的拼音和辅助码编码时，就在不知不觉中学会了新字的输入方法。

## 进阶技巧

<note>
反查结果中通常会显示字的拼音和辅助码编码。这意味着反查不仅帮你找到了字，还教会你如何用正常方式输入它。下次遇到同一个字，你就可以直接用拼音+辅助码输入了。
</note>

<warning>
笔画反查需要严格按照标准笔顺输入。如果你输入的笔画顺序与标准不同，可能找不到目标字。遇到这种情况，建议改用两分反查或多分反查。
</warning>

## 学习路径

1. **起步**：先记住反查触发键（`` ` ``），遇到不认识的字时尝试两分反查
2. **进阶**：学习笔画反查的 5 个字母（h/s/p/n/z），作为两分法的补充
3. **高效**：反查时注意观察结果中的辅助码编码，积累字形记忆

## 相关模块

- [辅助码配置](./auxiliary-code-config) — 反查结果中可显示辅助码信息
- [特殊输入](./special-input) — 另一种扩展输入方式

<ConfigSlot module="reverse-lookup" />
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/content/reverse-lookup.mdx
git commit -m "docs: rewrite reverse lookup tutorial with 5 methods and data source guide"
```

---

### Task 9: Rewrite comment-hints.mdx

**Files:**
- Modify: `src/content/comment-hints.mdx`

- [ ] **Step 1: Write the tutorial content**

Replace the entire file with:

```mdx
# 注释与提示

注释系统是万象拼音的「学习助手」——通过在候选词旁显示拼音注释和编码信息，帮助你学习辅助码、确认读音、纠正输入错误。

## 这是什么

万象拼音的注释系统由两个独立维度组成：

- **注释模式**：控制候选词**旁边**显示什么注释内容（拼音、辅助码等）
- **编码显示**：控制候选栏**顶部**显示的输入编码格式

两者都是多状态开关，通过 `Ctrl+~` 方案菜单或快捷键切换。它们与 [Lua 扩展](./lua-extensions)中的「超级注释」功能配合工作：注释模式控制「显不显示」，超级注释控制「显示什么内容」。

## 配置项详解

### 注释模式（3 种状态）

| 状态 | 内部值 | 视觉效果 |
|------|--------|---------|
| **注释关** | `comment_off` | 候选词旁不显示任何注释信息 |
| **有声调** | `tone_hint` | 显示带声调标记的拼音注释，如 `nǐ hǎo` |
| **无声调** | `toneless_hint` | 显示不带声调的拼音注释，如 `ni hao` |

```yaml
patch:
  switches:
    - options: [comment_off, tone_hint, toneless_hint]
      reset: 0              # 默认关闭注释
      states: [注释关, 有声调, 无声调]
```

当注释模式为「有声调」或「无声调」时，如果同时开启了超级注释（[Lua 扩展](./lua-extensions)），候选词旁还会显示辅助码编码和纠错提示。

### 编码显示（3 种状态）

| 状态 | 内部值 | 视觉效果 |
|------|--------|---------|
| **原编码** | `raw_input` | 显示你实际按下的键，如 `nihk`（双拼编码） |
| **有声调** | `tone_display` | 将编码转换为标准拼音，如 `nǐ hǎo` |
| **无声调** | `full_pinyin` | 将编码转换为无声调拼音，如 `ni hao` |

```yaml
patch:
  switches:
    - options: [raw_input, tone_display, full_pinyin]
      reset: 0              # 默认显示原始编码
      states: [原编码, 有声调, 无声调]
```

<tip>
编码显示的「有声调」模式对双拼用户特别有用——双拼的编码（如 `nihk`）对旁人来说完全不可读，但转换为 `nǐ hǎo` 后就能看懂了。在给别人演示输入法时很有帮助。
</tip>

<ConfigSlot module="comment-hints" />

## 常见场景与推荐搭配

**学习辅助码阶段**：最大化辅助信息，帮助记忆：

```yaml
patch:
  switches:
    - options: [comment_off, tone_hint, toneless_hint]
      reset: 1              # 默认「有声调」注释
    - options: [raw_input, tone_display, full_pinyin]
      reset: 0              # 编码显示保持原编码
  # 配合超级注释
  super_comment/enabled: true
  super_comment/max_length: 2
```

这样每个候选词旁边都会显示辅助码编码和带声调拼音，一边打字一边学习。

**日常高效输入**：关闭注释减少视觉干扰：

```yaml
patch:
  switches:
    - options: [comment_off, tone_hint, toneless_hint]
      reset: 0              # 注释关闭
    - options: [raw_input, tone_display, full_pinyin]
      reset: 0              # 原始编码
```

**教学演示场景**：展示最完整的输入信息：

```yaml
patch:
  switches:
    - options: [comment_off, tone_hint, toneless_hint]
      reset: 1              # 有声调注释
    - options: [raw_input, tone_display, full_pinyin]
      reset: 1              # 有声调编码显示
```

## 进阶技巧

<note>
你可以通过快捷键快速切换注释模式，而不需要进入方案菜单。`Ctrl+A` 可以在注释模式的三种状态之间循环切换，`Ctrl+S` 切换编码显示。在需要查看辅助码时临时开启，用完后快速关闭。
</note>

<warning>
注释模式和超级注释是**两个不同的控制层**。如果你开启了注释模式但没有开启超级注释（或超级注释的 Lua 脚本未加载），注释内容可能只有基本拼音而没有辅助码信息。确保两者配合使用。
</warning>

## 学习路径

1. **起步**：保持默认（注释关闭），先熟悉基本输入
2. **学习期**：开启「有声调」注释 + 超级注释，观察每个字的辅助码编码
3. **熟练后**：关闭注释回到极简模式，只在需要时通过 `Ctrl+A` 临时开启

## 相关模块

- [辅助码配置](./auxiliary-code-config) — 辅助码编码信息通过注释系统显示
- [Lua 扩展](./lua-extensions) — 超级注释功能控制注释的具体内容
- [候选词显示](./candidate-display) — `always_show_comments` 与注释显示联动
- [开关与杂项](./switches) — 注释模式和编码显示都是多状态开关

<ConfigSlot module="comment-hints" />
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/content/comment-hints.mdx
git commit -m "docs: rewrite comment hints tutorial with 3-state explanations and super_comment integration"
```

---

### Task 10: Rewrite candidate-display.mdx

**Files:**
- Modify: `src/content/candidate-display.mdx`

- [ ] **Step 1: Write the tutorial content**

Replace the entire file with:

```mdx
# 候选词显示

候选词的排列方向和附加信息会显著影响输入体验——横排还是竖排、要不要显示拼音提示、注释信息什么时候出现。这些设置帮助你打造最舒适的视觉布局。

## 这是什么

候选词显示设置控制候选词面板的**视觉呈现方式**，包括：

- 候选词的排列方向（横排/竖排）
- 是否在候选词旁显示拼音提示
- 注释信息的显示策略

这些设置与[注释与提示](./comment-hints)模块配合工作：这里控制的是「显示格式和布局」，注释模块控制的是「注释内容」。

## 配置项详解

### 排列方向

```yaml
patch:
  style/horizontal: true     # true=横排, false=竖排(默认)
```

| 方向 | 视觉效果 | 适用场景 |
|------|---------|---------|
| **竖排** | 候选词从上到下排列 | 默认模式，适合窄屏、候选词较多时 |
| **横排** | 候选词从左到右排列 | 节省纵向空间，适合宽屏、现代 UI 风格 |

### 拼音提示（spelling_hints）

控制在候选词旁显示拼音提示的范围：

```yaml
patch:
  translator/spelling_hints: 10    # 为 10 字以内的候选词显示拼音
```

| 值 | 效果 |
|----|------|
| `0` | 关闭拼音提示 |
| `1` | 仅单字显示拼音 |
| `10` | 10 字以内的候选词都显示拼音 |
| `30` | 几乎所有候选词都显示拼音（学习阶段推荐） |

拼音提示显示在候选词下方或旁边（取决于排列方向），帮助确认候选词的读音。

### 注释始终显示（always_show_comments）

```yaml
patch:
  translator/always_show_comments: true
```

| 值 | 行为 |
|----|------|
| `true` | 始终显示注释信息（只要注释模式不是「关闭」） |
| `false` | 仅在有辅助码筛选时才显示注释 |

<note>
当设为 `false` 时，注释只在你输入了辅助码进行筛选时才会出现。这对于已经熟练辅助码的用户来说可以减少视觉干扰——平时不显示注释，只在需要精确筛选时才显示辅助码信息。
</note>

<ConfigSlot module="candidate-display" />

## 常见场景与推荐搭配

**学习阶段（信息最大化）**：

```yaml
patch:
  translator/spelling_hints: 30           # 所有候选词显示拼音
  translator/always_show_comments: true   # 始终显示注释
```

拼音提示帮助确认候选词读音，注释显示辅助码编码辅助记忆。适合刚开始使用辅助码的用户。

**日常使用（平衡模式）**：

```yaml
patch:
  translator/spelling_hints: 1            # 仅单字显示拼音
  translator/always_show_comments: false  # 仅筛选时显示注释
```

**极简模式（最少干扰）**：

```yaml
patch:
  translator/spelling_hints: 0            # 关闭拼音提示
  translator/always_show_comments: false  # 仅筛选时显示注释
  style/horizontal: true                  # 横排，节省空间
```

## 进阶技巧

<tip>
如果你是横排候选词的用户，可以把 `page_size` 适当调小（5-6），因为横排的候选词在屏幕上占据更多宽度，太多会导致面板过宽。竖排用户则可以放心使用 7-9 个候选词。
</tip>

<warning>
`spelling_hints` 设置较大的值（如 30）会为长词组也显示完整拼音，这会占用较多空间。如果发现候选面板变得拥挤，可以适当调小这个值。
</warning>

## 学习路径

1. **起步**：使用默认竖排布局，开启拼音提示帮助确认候选词
2. **调整**：根据屏幕尺寸选择横排或竖排，调整拼音提示范围
3. **熟练后**：关闭拼音提示、设置注释为仅筛选时显示，追求最简洁的输入界面

## 相关模块

- [注释与提示](./comment-hints) — 控制注释内容和编码显示格式
- [辅助码配置](./auxiliary-code-config) — 辅助码提示通过注释系统显示

<ConfigSlot module="candidate-display" />
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/content/candidate-display.mdx
git commit -m "docs: rewrite candidate display tutorial with layout options and hint configuration"
```

---

### Task 11: Rewrite schema-manager.mdx

**Files:**
- Modify: `src/content/schema-manager.mdx`

- [ ] **Step 1: Write the tutorial content**

Replace the entire file with:

```mdx
# 输入方案管理

输入方案是 Rime 的核心概念——每个方案定义了一套完整的输入规则，从拼音映射到候选词排序到功能开关。理解方案的结构和切换机制，是驾驭 Rime 的第一步。

## 这是什么

在 Rime 中，「输入方案」（Schema）是一套**完整的输入规则定义**，包含：

- 编码规则（全拼、双拼、五笔等）
- 词典配置（使用哪个词库）
- 开关定义（有哪些可切换的功能）
- 引擎配置（挂载了哪些 Lua 扩展、过滤器等）

每个方案对应一个 `.schema.yaml` 文件。你可以同时安装多个方案，通过 `Ctrl+~`（macOS 为 `Control+~`）打开方案菜单来切换。

### 方案文件结构

一个典型的 Rime 方案由以下文件组成：

| 文件 | 作用 |
|------|------|
| `xxx.schema.yaml` | 方案主文件，定义所有输入规则 |
| `xxx.dict.yaml` | 方案词典，包含词库数据 |
| `xxx.custom.yaml` | 用户自定义补丁（你的修改写在这里） |
| `lua/` 目录 | Lua 扩展脚本 |

<warning>
永远不要直接修改 `.schema.yaml` 文件——方案更新时你的修改会被覆盖。所有自定义配置都应该写在 `.custom.yaml` 中，使用 `patch:` 语法。
</warning>

## 配置项详解

### 方案列表

在 `default.custom.yaml` 中定义你启用的方案列表：

```yaml
patch:
  schema_list:
    - schema: wanxiang          # 万象拼音
    - schema: rime_ice          # 雾凇拼音
    - schema: double_pinyin_flypy  # 小鹤双拼
```

列表中的第一个方案是默认方案。

### 主流方案对比

| 方案 | 类型 | 特点 | 适合人群 |
|------|------|------|---------|
| **万象拼音** | 全拼/双拼 | 方案内切换拼写、内置辅助码、Lua 扩展丰富 | 追求极致效率、愿意深度定制的用户 |
| **雾凇拼音** | 全拼 | 词库丰富、开箱即用、社区活跃 | 想要稳定好用的全拼方案 |
| **朙月拼音** | 全拼 | Rime 内置、轻量稳定 | 极简主义者、方案开发者 |
| **小鹤双拼** | 双拼 | 最流行的双拼方案 | 双拼用户（但万象也内置了小鹤双拼） |

<ConfigSlot module="schema-manager" />

## 常见场景与推荐搭配

**只用万象拼音**：

```yaml
# default.custom.yaml
patch:
  schema_list:
    - schema: wanxiang
```

**万象 + 雾凇双方案并存**（不确定时先都装上，对比体验）：

```yaml
patch:
  schema_list:
    - schema: wanxiang
    - schema: rime_ice
```

**多方案切换**（为不同场景准备不同方案）：

```yaml
patch:
  schema_list:
    - schema: wanxiang          # 日常中文输入
    - schema: wubi86            # 偶尔用五笔打生僻字
```

## 进阶技巧

<tip>
安装新方案后需要执行「重新部署」（Deploy）才能生效。macOS 在鼠须管菜单中点击「重新部署」，Windows 在小狼毫托盘菜单中选择，Linux 使用 `ibus-daemon -drx` 或对应命令。
</tip>

<note>
万象拼音通过方案内切换（`/flypy` 等指令）实现多种拼写方案，不需要为每种双拼安装独立方案。这意味着你的用户词典在切换拼写方案后仍然共享，比安装多个独立方案更高效。
</note>

## 学习路径

1. **起步**：从一个方案开始（推荐万象拼音），熟悉基本输入
2. **探索**：通过 `Ctrl+~` 方案菜单了解方案切换机制
3. **进阶**：根据需要添加第二个方案（如五笔），为不同场景配置

## 相关模块

- [开关与杂项](./switches) — 每个方案有自己的开关定义
- [按键绑定](./key-bindings) — 按键配置是全局的，影响所有方案

<ConfigSlot module="schema-manager" />
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/content/schema-manager.mdx
git commit -m "docs: rewrite schema manager tutorial with schema comparison and file structure guide"
```

---

### Task 12: Rewrite fuzzy-pinyin.mdx

**Files:**
- Modify: `src/content/fuzzy-pinyin.mdx`

- [ ] **Step 1: Write the tutorial content**

Replace the entire file with:

```mdx
# 模糊音规则

模糊音是为方言用户和发音习惯不同的用户准备的「容错机制」——如果你分不清前后鼻音或平翘舌音，开启对应的模糊音规则后，Rime 会把它们视为等价，让你不需要纠结发音就能打出正确的字。

## 这是什么

普通话中有一些发音非常接近的声母和韵母对，很多地区的方言不区分它们。例如：

- 南方很多地区不区分 `n` 和 `l`（「你」和「里」同音）
- 部分地区不区分 `z/zh`、`c/ch`、`s/sh`（平舌和翘舌不分）
- 大量用户分不清 `an/ang`、`en/eng`、`in/ing`（前后鼻音不分）

模糊音规则告诉 Rime：当用户输入 `niao` 时，也同时搜索 `liao` 的候选词；输入 `fen` 时也搜索 `feng`。这样你不需要记住每个字的精确发音，也能正确输入。

<warning>
模糊音的代价是**重码增加**。每开启一组模糊音，候选词列表会变长，因为原本不同音的字现在被视为同音了。建议只开启你**确实需要**的模糊音组合，而不是全部开启。
</warning>

## 配置项详解

### 声母模糊音

| 模糊组 | 说明 | 常见地区 |
|--------|------|---------|
| `z` ↔ `zh` | 平舌/翘舌 | 湖南、四川、广东等 |
| `c` ↔ `ch` | 平舌/翘舌 | 同上 |
| `s` ↔ `sh` | 平舌/翘舌 | 同上 |
| `l` ↔ `n` | 边音/鼻音 | 湖南、湖北、江西等 |
| `f` ↔ `h` | 唇音/喉音 | 广东、广西等 |
| `r` ↔ `l` | 卷舌/边音 | 部分南方地区 |

### 韵母模糊音

| 模糊组 | 说明 | 影响范围 |
|--------|------|---------|
| `an` ↔ `ang` | 前/后鼻音 | 影响最广，全国很多地区 |
| `en` ↔ `eng` | 前/后鼻音 | 同上 |
| `in` ↔ `ing` | 前/后鼻音 | 同上 |
| `ian` ↔ `iang` | 前/后鼻音 | 部分地区 |
| `uan` ↔ `uang` | 前/后鼻音 | 部分地区 |

```yaml
patch:
  speller/algebra:
    # 声母模糊
    - derive/^([zcs])h/$1/       # zh→z, ch→c, sh→s
    - derive/^([zcs])([^h])/$1h$2/  # z→zh, c→ch, s→sh
    - derive/^l/n/               # l→n
    - derive/^n/l/               # n→l
    # 韵母模糊
    - derive/an$/ang/            # an→ang
    - derive/ang$/an/            # ang→an
    - derive/en$/eng/            # en→eng
    - derive/eng$/en/            # eng→en
    - derive/in$/ing/            # in→ing
    - derive/ing$/in/            # ing→in
```

<ConfigSlot module="fuzzy-pinyin" />

## 常见场景与推荐搭配

**南方用户（最常见需求）**：

```yaml
patch:
  speller/algebra:
    - derive/^l/n/
    - derive/^n/l/
    - derive/^([zcs])h/$1/
    - derive/^([zcs])([^h])/$1h$2/
    - derive/an$/ang/
    - derive/ang$/an/
    - derive/en$/eng/
    - derive/eng$/en/
    - derive/in$/ing/
    - derive/ing$/in/
```

**只开前后鼻音（最保守策略）**：

大多数人最常犯的错误是前后鼻音，只开这三组影响最小：

```yaml
patch:
  speller/algebra:
    - derive/an$/ang/
    - derive/ang$/an/
    - derive/en$/eng/
    - derive/eng$/en/
    - derive/in$/ing/
    - derive/ing$/in/
```

**北方用户**：

大多数北方用户不需要开启模糊音。如果偶尔分不清个别字的发音，建议通过[反查](./reverse-lookup)来查找，而不是开启模糊音增加重码。

## 进阶技巧

<tip>
如果你不确定自己需要哪些模糊音，可以先不开启，在日常输入中记录哪些字经常打不出来（因为拼音输错了），然后只针对性地开启对应的模糊组。这样可以最小化重码增加。
</tip>

<note>
模糊音规则使用 Rime 的 `derive` 指令，它会在原有编码基础上**额外生成**模糊编码，而不是替换原编码。这意味着正确拼音和模糊拼音都能匹配，不会影响已经记住正确发音的字。
</note>

## 学习路径

1. **起步**：先不开启任何模糊音，用标准拼音输入
2. **发现问题**：记录日常输入中因为发音不准导致打不出来的字
3. **针对性开启**：只开启你确实需要的 1-2 组模糊音

## 相关模块

- [拼写方案](./spelling-scheme) — 双拼模式下模糊音的行为可能不同

<ConfigSlot module="fuzzy-pinyin" />
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/content/fuzzy-pinyin.mdx
git commit -m "docs: rewrite fuzzy pinyin tutorial with dialect guide and rules table"
```

---

### Task 13: Rewrite punctuation.mdx

**Files:**
- Modify: `src/content/punctuation.mdx`

- [ ] **Step 1: Write the tutorial content**

Replace the entire file with:

```mdx
# 标点符号映射

标点符号看似简单，却是中文输入体验的重要组成部分——中文逗号和英文逗号差一个字符宽度，括号和引号需要成对出现，一些特殊标点（省略号、破折号）需要特定的输入方式。

## 这是什么

Rime 的标点映射系统定义了每个标点按键在中文模式下输出什么字符。配置分为两层：

- **`punctuator/full_shape`**：全角模式下的标点映射
- **`punctuator/half_shape`**：半角模式下的标点映射（日常使用的是这个）

大多数时候你只需要关注 `half_shape` 配置。全角模式（`full_shape` 开关开启时）在现代输入中很少使用。

标点的中英文切换由 [开关](./switches) 中的 `ascii_punct` 控制：

- `ascii_punct` 关闭（默认）：输出中文标点（，。！？等）
- `ascii_punct` 开启：输出英文标点（,.!? 等）

## 配置项详解

### 基本标点映射

```yaml
patch:
  punctuator/half_shape:
    ",": "，"        # 逗号
    ".": "。"        # 句号
    "!": "！"        # 感叹号
    "?": "？"        # 问号
    ":": "："        # 冒号
    ";": "；"        # 分号
    "\\": "、"       # 反斜杠 → 顿号
```

### 配对符号

括号和引号支持自动配对——按一次输出左括号，再按一次输出右括号：

```yaml
patch:
  punctuator/half_shape:
    "(": ["（", "）"]     # 小括号配对
    "[": ["【", "】"]     # 方括号 → 中文方括号
    "{": ["｛", "｝"]     # 花括号配对
```

### 直角引号

很多中文排版规范推荐使用直角引号「」『』代替弯引号""''。配置方法：

```yaml
patch:
  punctuator/half_shape:
    "'": {pair: ["「", "」"]}     # 单引号 → 直角引号
    "\"": {pair: ["『", "』"]}    # 双引号 → 直角引号
```

`pair` 语法让引号自动交替：第一次按输出左引号，第二次按输出右引号，循环交替。

### 特殊标点输入

一些中文标点需要特定方式输入：

| 标点 | 输入方式 | 说明 |
|------|---------|------|
| …… | 连按两次 `.` | 省略号（某些配置下） |
| —— | 连按两次 `-` | 破折号（某些配置下） |
| · | 特定键位 | 间隔号（用于外国人名） |

<ConfigSlot module="punctuation" />

## 常见场景与推荐搭配

**标准中文标点（默认）**：

大多数用户使用默认配置即可，按键直接输出对应的中文标点。

**直角引号爱好者**：

```yaml
patch:
  punctuator/half_shape:
    "'": {pair: ["「", "」"]}
    "\"": {pair: ["『", "』"]}
```

**程序员配置**（中文模式下保留部分英文标点）：

写代码时经常需要在中文注释中使用英文标点，可以单独映射：

```yaml
patch:
  punctuator/half_shape:
    ",": "，"
    ".": "。"
    "/": "/"          # 保留英文斜杠
    "'": "'"          # 保留英文单引号
    "\"": "\""        # 保留英文双引号
    "(": "("          # 保留英文括号
    ")": ")"
```

## 进阶技巧

<tip>
如果你需要在中文输入时偶尔输出英文标点，可以用 `ascii_punct` 开关临时切换——绑定快捷键后，按一下切到英文标点，输入完再切回来。这比专门配置混合映射更灵活。
</tip>

<warning>
修改标点映射时注意 YAML 语法——引号和特殊字符需要正确转义。特别是反斜杠 `\\` 和双引号 `"\""`，在 YAML 中需要额外转义。如果配置后标点行为异常，先检查 YAML 格式是否正确。
</warning>

## 学习路径

1. **起步**：使用默认标点配置，了解哪些标点是中文的、哪些是英文的
2. **定制**：根据排版偏好配置直角引号、特殊标点
3. **进阶**：为特殊需求（如程序员场景）创建混合标点映射

## 相关模块

- [开关与杂项](./switches) — `ascii_punct` 开关控制中英标点切换

<ConfigSlot module="punctuation" />
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/content/punctuation.mdx
git commit -m "docs: rewrite punctuation tutorial with mapping syntax and programmer config"
```

---

### Task 14: Rewrite dictionary.mdx

**Files:**
- Modify: `src/content/dictionary.mdx`

- [ ] **Step 1: Write the tutorial content**

Replace the entire file with:

```mdx
# 词典管理

词典是输入法的「大脑」——它决定了你能打出什么词、候选词的排序有多准确、输入法能不能跟上你的用词习惯。理解词典系统的工作方式，能帮助你有效管理和优化输入体验。

## 这是什么

Rime 的词典系统由三层组成：

**主词典（.dict.yaml）**：方案自带的核心词库，包含数万到数十万条词汇及其拼音编码和默认词频。这是输入法的基础数据，由方案维护者提供。

**用户词典**：Rime 在使用过程中自动积累的个人数据，记录你每次选词的行为。选过的词会提升词频，下次输入时排名更靠前。这是输入法「越用越聪明」的关键。

**自定义词典（custom_phrase.txt）**：你手动添加的自定义短语，适合输入固定格式的文本（如邮箱、地址、常用句式）。

## 配置项详解

### 词频调整机制

Rime 的词频系统是动态的：每次你选择一个候选词，它的词频权重就会增加。经过一段时间的使用，候选词列表会越来越「懂」你的用词习惯。

```yaml
patch:
  translator/dictionary: wanxiang       # 指定主词典
  translator/user_dict: wanxiang_user   # 指定用户词典名
```

### 自定义短语

自定义短语文件 `custom_phrase.txt` 放在 Rime 用户目录下，格式为：

```
# 文本\t编码\t权重
# Tab 分隔，权重可选
example@mail.com	yx	1
我的收件地址	dz	1
```

在方案中启用自定义短语翻译器：

```yaml
patch:
  engine/translators:
    - table_translator@custom_phrase
  custom_phrase:
    dictionary: ""
    user_dict: custom_phrase
    db_class: stabledb
    enable_completion: false
    enable_sentence: false
    initial_quality: 1
```

### 用户词典维护

**同步（Sync）**：Rime 支持将用户词典同步到指定目录，用于备份或多设备共享：

```yaml
patch:
  installation_id: "my-mac"              # 设备标识
  sync_dir: "/Users/你的用户名/RimeSync"  # 同步目录
```

执行「同步用户数据」后，用户词典会导出到同步目录。在另一台设备上配置相同的同步目录（如通过云盘），再执行同步即可合并词典。

<ConfigSlot module="dictionary" />

## 常见场景与推荐搭配

**添加常用短语**：

在 `custom_phrase.txt` 中添加：

```
# 个人信息
张三	zs	1
13800138000	sj	1
example@mail.com	yx	1

# 常用短语
麻烦你帮我看一下	mf	1
收到，谢谢	sd	1
```

**多设备词典同步**：

两台设备使用相同的云盘目录作为同步路径：

```yaml
# 设备 A
patch:
  installation_id: "macbook"
  sync_dir: "/Users/xxx/Dropbox/RimeSync"

# 设备 B
patch:
  installation_id: "desktop"
  sync_dir: "C:\\Users\\xxx\\Dropbox\\RimeSync"
```

分别在两台设备执行「同步用户数据」即可合并词频记录。

## 进阶技巧

<tip>
自定义短语的编码可以设为任意字母组合，不需要是拼音。例如把邮箱编码为 `yx`、地址编码为 `dz`。只要在输入时输入这个编码，就会出现你定义的短语。
</tip>

<warning>
清理用户词典是一个不可逆操作。如果你觉得候选词排序「学坏了」（比如经常把错误的词排在前面），建议先尝试同步导出备份，再考虑是否清理。清理后所有积累的词频数据都会丢失。
</warning>

<note>
用户词典的质量直接影响候选词排序。如果你发现某些常用词总是排在后面，可能是因为你之前多次选择了其他候选词导致它们的词频更高。持续选择正确的词，词频会逐渐调整过来。
</note>

## 学习路径

1. **起步**：正常使用输入法，让用户词典自然积累
2. **优化**：添加个人常用短语到 `custom_phrase.txt`
3. **进阶**：配置词典同步，实现多设备统一的输入体验

## 相关模块

- [候选词设置](./candidate-settings) — 词典质量直接影响候选词排序准确度

<ConfigSlot module="dictionary" />
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/content/dictionary.mdx
git commit -m "docs: rewrite dictionary tutorial with full architecture and sync guide"
```

---

### Task 15: Rewrite special-input.mdx

**Files:**
- Modify: `src/content/special-input.mdx`

- [ ] **Step 1: Write the tutorial content**

Replace the entire file with:

```mdx
# 特殊输入

万象拼音内置了丰富的特殊输入功能——输入一个简短的触发码，就能输出当前日期、时间、农历、数学计算结果甚至 Unicode 字符。这些功能由 [Lua 扩展](./lua-extensions)中的翻译器实现。

## 这是什么

特殊输入是通过 Lua Translator 实现的动态内容生成功能。当你输入一个预定义的触发码时，Lua 脚本会实时计算并生成候选词。例如输入 `/rq` 后，候选词列表会显示今天的日期。

特殊输入不需要在词库中预存数据——它们是**实时计算**的，所以总是返回当前的日期、时间等信息。

## 配置项详解

### 日期时间类

| 触发码 | 功能 | 输出示例 |
|--------|------|---------|
| `/rq` | 当前日期 | 2026年4月8日、2026-04-08、二〇二六年四月八日 |
| `/sj` | 当前时间 | 14:30、14:30:25、下午 2:30 |
| `/xq` | 当前星期 | 星期二、周二、Tuesday |
| `/nl` | 农历日期 | 三月初九、丙午年三月初九 |
| `/jq` | 当前节气 | 清明、清明（4月4日） |
| `/jr` | 近期节日 | 清明节、劳动节 |
| `/tt` | Unix 时间戳 | 1775808000 |

每个触发码通常会生成**多个候选词**，以不同格式呈现同一信息。例如 `/rq` 会同时给出「2026年4月8日」「2026-04-08」「二〇二六年四月八日」等多种日期格式。

### 工具类

**计算器**（`V` + 表达式）：

输入 `V` 后跟数学表达式，实时计算结果：

```
V1+2*3      → 7
V(1+2)*3    → 9
V100/7      → 14.285714...
Vsqrt(144)  → 12
V2^10       → 1024
```

支持四则运算、括号、常用数学函数（sqrt、sin、cos、tan、log 等）。

**Unicode 输入**（`U` + 码点）：

输入 `U` 后跟 Unicode 码点（十六进制），直接输出对应字符：

```
U4e07  → 万
U2764  → ❤
U1f600 → 😀
```

适合输入无法通过拼音打出的特殊符号、Emoji 或生僻字。

### 统计类

| 触发码 | 功能 | 输出示例 |
|--------|------|---------|
| `/rtj` | 今日输入统计 | 今日输入 1234 字 |
| `/tj` | 累计输入统计 | 累计输入 56789 字 |

统计功能由 [Lua 扩展](./lua-extensions) 的输入统计模块提供数据。

<ConfigSlot module="special-input" />

## 常见场景与推荐搭配

**日常办公**：日期时间是最高频的特殊输入。在写文档、发邮件时：

- 需要当前日期：输入 `/rq`，选择你需要的格式
- 需要当前时间：输入 `/sj`
- 需要星期：输入 `/xq`

**程序员场景**：

- 需要时间戳：输入 `/tt` 获取 Unix 时间戳
- 需要计算：输入 `V` + 表达式，省去打开计算器
- 需要特殊字符：输入 `U` + Unicode 码点

**写作场景**：

- 农历日期：输入 `/nl`（写古风、传统节日文章时常用）
- 节气节日：输入 `/jq` 或 `/jr`

## 进阶技巧

<tip>
计算器功能在日常输入中非常实用。不需要切换到计算器应用，直接在输入框中输入 `V100*1.13` 就能算出含税价格。计算结果作为候选词直接上屏，非常便捷。
</tip>

<note>
所有特殊输入的触发码都以 `/` 或大写字母开头，不会与正常拼音输入冲突。`/rq` 中的 `/` 是触发前缀，`rq` 是日期（rìqī）的声母缩写。这种设计让你不需要切换模式就能使用特殊输入。
</note>

<warning>
Unicode 输入（`U` + 码点）需要你知道目标字符的 Unicode 码点。如果不知道码点，可以通过搜索引擎查询「字符名 Unicode」来获取。常用的码点值得记住几个。
</warning>

## 学习路径

1. **起步**：先记住最常用的 3 个触发码——`/rq`（日期）、`/sj`（时间）、`/xq`（星期）
2. **扩展**：尝试计算器功能 `V` 和 Unicode 输入 `U`
3. **进阶**：了解所有 11 个触发码，在需要时随手使用

## 相关模块

- [Lua 扩展](./lua-extensions) — 特殊输入功能由 Lua Translator 实现
- [反查与筛选](./reverse-lookup) — 另一种通过特殊方式输入字符的功能

<ConfigSlot module="special-input" />
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/content/special-input.mdx
git commit -m "docs: rewrite special input tutorial with all 11 triggers detailed"
```

---

### Task 16: Rewrite ascii-mode.mdx

**Files:**
- Modify: `src/content/ascii-mode.mdx`

- [ ] **Step 1: Write the tutorial content**

Replace the entire file with:

```mdx
# 中英文切换

中英文切换是输入法最基础也最频繁的操作。Rime 提供了灵活的切换机制，从按键选择到应用级自动切换，让你可以完全掌控什么时候输入中文、什么时候输入英文。

## 这是什么

Rime 中的中英文切换涉及两个概念：

**ascii_mode 开关**：输入法的中英文状态。当 `ascii_mode` 为 0（关闭）时输入中文，为 1（开启）时输入英文。这是一个「状态」，需要被某个操作来切换。

**ascii_composer**：负责处理中英文切换操作的组件。它监听 Shift、Control、Caps Lock 等键的按下和释放事件，根据配置执行对应的切换动作。在[按键绑定](./key-bindings)中详细配置。

两者的关系：`ascii_composer` 是「切换动作」，`ascii_mode` 是「当前状态」。

## 配置项详解

### 全局切换 vs 临时切换

**全局切换**（`commit_code`、`commit_text`、`clear`）：按下切换键后，输入法进入英文模式并**保持**，直到再次按切换键才回到中文。

**临时切换**（`inline_ascii`）：按住 Shift 输入英文，松开后自动回到中文模式。适合在中文句子中临时插入一两个英文单词。

### 应用级自动切换

Rime 支持为特定应用设置默认的中英文模式——比如在终端和 IDE 中默认英文，在文档编辑器中默认中文：

**macOS（鼠须管）**：在 `squirrel.custom.yaml` 中配置：

```yaml
patch:
  app_options:
    com.apple.Terminal:          # 终端
      ascii_mode: true
    com.microsoft.VSCode:        # VS Code
      ascii_mode: true
    com.googlecode.iterm2:       # iTerm2
      ascii_mode: true
```

**Windows（小狼毫）**：在 `weasel.custom.yaml` 中配置：

```yaml
patch:
  app_options:
    cmd.exe:
      ascii_mode: true
    code.exe:                    # VS Code
      ascii_mode: true
    powershell.exe:
      ascii_mode: true
```

<tip>
应用级切换的 `ascii_mode: true` 表示**切换到该应用时默认进入英文模式**。你仍然可以手动切换回中文——这只是设置了一个初始状态。
</tip>

<ConfigSlot module="ascii-mode" />

## 常见场景与推荐搭配

**程序员（大量中英切换）**：

```yaml
# squirrel.custom.yaml (macOS)
patch:
  app_options:
    com.apple.Terminal:
      ascii_mode: true
    com.microsoft.VSCode:
      ascii_mode: true
    com.googlecode.iterm2:
      ascii_mode: true
```

在编程相关应用中默认英文，写文档时保持中文。

**写作者（以中文输入为主）**：

不需要配置 app_options，保持所有应用默认中文模式。在偶尔需要英文时，使用 `inline_ascii`（临时英文）功能即可。

**混合使用**：

建议的按键绑定配合（在[按键绑定](./key-bindings)中配置）：

```yaml
# default.custom.yaml
patch:
  ascii_composer/switch_key:
    Shift_L: inline_ascii      # 左 Shift 临时英文
    Shift_R: commit_text       # 右 Shift 上屏候选并切英文
    Caps_Lock: clear
```

左 Shift 用于中文句子中临时插入英文（松开自动回中文），右 Shift 用于需要持续切换到英文的场景。

## 进阶技巧

<warning>
macOS 上，系统自带的输入法切换（`Ctrl+空格` 或 `Fn`）和 Rime 的中英文切换是**两套独立机制**。系统切换是在不同输入法之间切换（如从 Rime 切到 ABC），而 Rime 的 Shift 切换是在 Rime 内部切换中英文模式。建议用 Shift 切换中英文，用系统快捷键在需要时切换到其他输入法。
</warning>

<note>
`app_options` 中的应用标识符（如 `com.apple.Terminal`）需要精确匹配。在 macOS 上可以通过以下命令查看应用的 Bundle ID：

```bash
osascript -e 'id of app "应用名"'
```

在 Windows 上使用进程的 `.exe` 文件名即可。
</note>

## 学习路径

1. **起步**：了解 Shift 切换中英文的基本操作
2. **优化**：在[按键绑定](./key-bindings)中配置最适合你的切换键行为
3. **进阶**：为常用应用配置自动切换，减少手动切换频率

## 相关模块

- [按键绑定](./key-bindings) — 配置 ascii_composer 的切换键行为
- [开关与杂项](./switches) — ascii_mode 是开关系统的一部分

<ConfigSlot module="ascii-mode" />
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/content/ascii-mode.mdx
git commit -m "docs: rewrite ascii mode tutorial with app-level switching and platform guide"
```

---

### Task 17: Delete merged standalone files

**Files:**
- Delete: `src/content/auxiliary-code.mdx`
- Delete: `src/content/lua-scripting.mdx`

- [ ] **Step 1: Check for cross-references to these files**

Search all MDX files for links to `auxiliary-code` (standalone, not `auxiliary-code-config`) and `lua-scripting`:

Run: `grep -r "auxiliary-code)" src/content/ --include="*.mdx" | grep -v "auxiliary-code-config"`
Run: `grep -r "lua-scripting" src/content/ --include="*.mdx"`

If any references are found, update them to point to the new merged tutorials (`auxiliary-code-config` and `lua-extensions` respectively).

- [ ] **Step 2: Delete the files**

```bash
rm src/content/auxiliary-code.mdx
rm src/content/lua-scripting.mdx
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds. No broken imports (these files were never imported by tutorial-loaders.ts — they were only used by the docs pages if at all).

- [ ] **Step 4: Commit**

```bash
git add -A src/content/auxiliary-code.mdx src/content/lua-scripting.mdx
git commit -m "chore: remove standalone tutorials merged into module tutorials"
```

---

### Task 18: Verify cross-references and final build

**Files:**
- None (verification only)

- [ ] **Step 1: Verify all cross-reference links**

Check that every `[text](./slug)` link in MDX files points to an existing file:

Run: `grep -roh '\./[a-z-]*' src/content/*.mdx | sort -u`

Compare the output against the list of actual MDX files in `src/content/`. Every linked slug should have a matching `.mdx` file.

- [ ] **Step 2: Verify all ConfigSlot module IDs**

Check that every `<ConfigSlot module="xxx" />` uses a valid module ID from the registry:

Run: `grep -oh 'module="[^"]*"' src/content/*.mdx | sort -u`

Compare against the module IDs in `src/data/module-registry.ts`. Every module ID should be valid.

- [ ] **Step 3: Full build verification**

Run: `npm run build`
Expected: Build succeeds with zero errors and zero warnings related to MDX content.

- [ ] **Step 4: Commit (if any fixes were needed)**

```bash
git add -A
git commit -m "fix: resolve cross-reference and build issues in tutorials"
```
