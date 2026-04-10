# 设置帮助与教程改进设计

## 概述

Rime-Craft 配置编辑器的高级设置缺乏充分说明，教程与 UI 存在脱节。本设计分 3 个阶段渐进式改进，阶段一以候选词设置为模板，建立可复用基础设施后推广到其他模块。

## 问题分析

全面审计发现 13 个模块中存在 22 个显著 UI-教程脱节问题：

- **严重（4 处）**：Lua 扩展、辅助码、反查、注释与提示 — 控件完全没有说明
- **高（10 处）**：候选词设置、快捷键、开关等 — 不看教程无法理解
- **中等（8 处）**：拼写方案、ASCII 模式等 — 描述不完整

候选词设置页面的具体问题：
1. UI 高级设置 6 项中，4 项缺少或没有内联描述
2. 教程讲解了 UI 中不存在的设置（enable_sentence、initial_quality）
3. 教程未覆盖 UI 中实际存在的设置（enableUserDict、coreWordLength、maxWordLength、maxHomophones、maxHomographs）

## 阶段规划

### 阶段一：基础设施 + 候选词设置（本次）

建立 `SettingHelp` 组件，在候选词设置上完成完整改进（UI 描述 + 内联帮助 + 教程同步），作为后续模块的模板。

### 阶段二：严重和高优先级模块

按照阶段一建立的模式修复：Lua 扩展、辅助码、反查、注释与提示、候选词显示、快捷键、开关。

### 阶段三：中低优先级模块

拼写方案、ASCII 模式、特殊输入等模块的教程校对和 UI 描述补充。

---

## 阶段一详细设计

### 1. 新组件：`SettingHelp`

**文件**：`src/components/shared/SettingHelp.tsx`

**功能**：可复用的内联展开帮助组件，在设置项旁提供详细说明。

**交互行为**：
- 默认收起，在设置标签旁显示一个 `?` 圆形小按钮
- 点击后在设置控件下方展开一个浅灰色背景区域，显示详细帮助内容
- 再次点击收起，带平滑过渡动画
- 展开区域支持任意 React children 作为内容

**视觉设计**：
- `?` 按钮：16px 圆形，灰色边框，hover 时变蓝
- 展开区域：`bg-blue-50 rounded-md p-3 text-sm`，左侧带 2px 蓝色竖线
- 过渡动画：高度从 0 展开，约 150ms

**Props 接口**：

```typescript
interface SettingHelpProps {
  children: React.ReactNode  // 帮助内容，支持任意 JSX
  className?: string         // 额外样式
}
```

**使用示例**：

```tsx
<div>
  <div className="flex items-center gap-1.5">
    <Label>核心词最大长度</Label>
    <SettingHelp>
      <p>控制参与造句的最长词组长度。值越大，引擎越倾向用长词组造句，但计算量也更大。</p>
      <p className="mt-2 font-medium">推荐值：4</p>
      <ul className="mt-1 list-disc pl-4">
        <li>较小值 (2-3)：造句更快，适合单字输入为主的用户</li>
        <li>较大值 (5-7)：长词组候选更多，适合整句输入</li>
      </ul>
    </SettingHelp>
  </div>
  <Input type="number" ... />
  <p className="text-sm text-gray-500">影响造句质量，默认 4</p>
</div>
```

### 2. 类型扩展

**文件**：`src/types/config.ts`

在 `TranslatorConfig` 接口中新增两个字段：

```typescript
export interface TranslatorConfig {
  enableCompletion: boolean
  enableSentence: boolean      // 新增：整句模式
  enableUserDict: boolean
  initialQuality: number       // 新增：翻译器优先级
  coreWordLength: number
  maxWordLength: number
  maxHomophones: number
  maxHomographs: number
  spellingHints: number
  alwaysShowComments: boolean
}
```

需要同步更新：
- `CandidateSettings.tsx` 中的 `DEFAULT_TRANSLATOR` 默认值
- 配置序列化/反序列化逻辑（YAML 映射：`enableSentence` → `translator/enable_sentence`，`initialQuality` → `translator/initial_quality`）

### 3. CandidateSettings.tsx UI 改造

#### 3.1 现有设置的改进

**输入补全 (enableCompletion)**：
- 现有描述保留："打部分拼音时是否显示完整词"
- 新增 SettingHelp：
  > 开启后，输入不完整的拼音也会显示候选词。例如只输入 `n` 就能看到「你、那、能……」。关闭后必须输入完整音节（如 `ni`）才会出现候选。
  > 
  > 建议：大多数用户应保持开启。仅在使用辅助码且希望减少干扰时才考虑关闭。

**用户词典 (enableUserDict)**：
- 现有描述保留："启用自动调频和用户词典记忆"
- 新增 SettingHelp：
  > 开启后，Rime 会根据你的使用习惯自动调整候选词排序（常用词排前面），并记住你选过的自造词组。
  > 
  > 关闭后，候选词排序完全由词典决定，不会学习你的使用习惯。适合不希望输入法"记住"自己输入内容的用户。

**核心词最大长度 (coreWordLength)**：
- 改进描述："参与造句的最长词组长度，默认 4"
- 新增 SettingHelp：
  > 控制 Rime 造句引擎在组合候选句子时，最多使用多长的词组。
  > 
  > - **推荐值**：4（平衡速度和质量）
  > - 较小值 (2-3)：造句速度更快，但可能把长词拆开
  > - 较大值 (5-7)：更多长词组参与造句，但计算量增加
  > 
  > 对于单字输入为主的用户，这个值影响不大。

**候选词最大长度 (maxWordLength)**：
- 新增描述："候选列表中词组的最大字数，默认 7"
- 新增 SettingHelp：
  > 限制候选列表中显示的最长词组。超过此长度的词组不会出现在候选中。
  > 
  > - 较小值 (3-4)：候选列表更紧凑，适合偏好短词的用户
  > - 较大值 (10-20)：允许显示长成语、诗句等，适合整句输入
  > - 默认值 7 能覆盖绝大多数常用词组

**同音词上限 (maxHomophones)**：
- 新增描述："相同拼音的候选词最多显示几个"
- 新增 SettingHelp：
  > 限制同一个拼音下显示的候选词数量。例如拼音 `shi` 对应的汉字非常多（是、时、十、事……），此值控制最多列出多少个。
  > 
  > - 较小值 (3-5)：候选更精简，翻页更少，但可能漏掉需要的字
  > - 较大值 (10-20)：候选更全面，但需要更多翻页
  > - 默认值 8 适合大多数场景

**同形词上限 (maxHomographs)**：
- 新增描述："相同字形不同读音的候选词最多显示几个"
- 新增 SettingHelp：
  > 限制同一个字形但不同读音的变体数量。例如「行」有 háng 和 xíng 两个读音，此值控制这类多音字变体的显示上限。
  > 
  > - 通常不需要调整，默认值 8 足够
  > - 如果你发现候选中出现太多生僻读音的变体，可以适当调小

#### 3.2 新增设置

**整句模式 (enableSentence)**：
- 类型：Switch（开关）
- 位置：在「输入补全」和「用户词典」之后
- 标签："整句模式"
- 描述："尝试将多个音节组合成完整句子候选"
- SettingHelp：
  > 开启后，Rime 会尝试将你输入的多个音节自动组合成一个完整的句子作为候选。例如输入 `jintiandianqihenhao` 可能直接出现「今天天气很好」。
  > 
  > 关闭后，每次只匹配单个词组，需要逐词选择。
  > 
  > - 习惯整句输入的用户建议开启
  > - 习惯逐词输入、搭配辅助码精准选词的用户可以关闭

**翻译器优先级 (initialQuality)**：
- 类型：数值输入（step 0.1，范围 0-10）
- 位置：高级设置最后一项
- 标签："翻译器优先级"
- 描述："候选词的初始排序权重"
- SettingHelp：
  > 控制此翻译器生成的候选词在排序中的初始权重。数值越高，排名越靠前。
  > 
  > - 默认值 1.2，通常不需要修改
  > - 当你同时使用多个翻译器（如拼音 + 英文）时，可以通过调整此值来控制哪个翻译器的候选词优先显示
  > - 对于只使用单个输入方案的用户，此设置没有影响

### 4. 教程内容更新 (candidate-settings.mdx)

#### 4.1 "翻译引擎高级设置" 章节重写

原有的 3 项说明保留（enable_completion、enable_sentence、initial_quality），新增以下配置项说明：

**用户词典 (enable_user_dict)**：

```yaml
patch:
  translator/enable_user_dict: true
```

解释自动调频和用户词典记忆的工作机制，说明关闭后的行为变化。

**核心词最大长度 (core_word_length)**：

```yaml
patch:
  translator/core_word_length: 4
```

解释此值如何影响造句引擎的词组选择范围，配推荐值表格。

**候选词最大长度 (max_word_length)**：

```yaml
patch:
  translator/max_word_length: 7
```

**同音词上限 (max_homophones)**：

```yaml
patch:
  translator/max_homophones: 8
```

**同形词上限 (max_homographs)**：

```yaml
patch:
  translator/max_homographs: 8
```

每个配置项均包含：功能说明、YAML 示例、推荐值/场景表格。

#### 4.2 术语统一

确保教程和 UI 使用一致的术语：
- "逐码提示" → 统一为 "输入补全"（与 UI 标签一致）
- 其他术语以 UI 标签为准，教程中首次出现时括号注明 Rime 配置键名

#### 4.3 新增推荐搭配

在「常见场景与推荐搭配」中增加涉及高级设置的配置示例，帮助用户理解各参数的协同效果。

### 5. 配置序列化同步

新增的两个字段需要在 3 处代码中同步添加：

1. **类型定义** `src/types/config.ts`：在 `TranslatorConfig` 接口中添加 `enableSentence: boolean` 和 `initialQuality: number`
2. **YAML 解析器** `src/lib/yaml/parser.ts`（约 272 行附近）：添加从 `rawTranslator.enable_sentence` 和 `rawTranslator.initial_quality` 的读取逻辑
3. **YAML 序列化器** `src/lib/yaml/serializer.ts`（约 107 行附近）：添加 `patch['translator/enable_sentence']` 和 `patch['translator/initial_quality']` 的写入逻辑
4. **默认值**：`CandidateSettings.tsx` 的 `DEFAULT_TRANSLATOR` 和 `src/data/presets.ts` 中的预设配置
5. **测试**：`parser.test.ts` 和 `serializer.test.ts` 中添加对应的测试用例

YAML 键名映射：
- `enableSentence` ↔ `translator/enable_sentence`（默认值：`true`）
- `initialQuality` ↔ `translator/initial_quality`（默认值：`1.2`）

注意：目前代码中完全没有这两个字段的处理，需要从零添加。

---

## 后续阶段预览

### 阶段二：严重和高优先级模块

按照阶段一建立的 SettingHelp 模式，依次修复：

1. **Lua 扩展**（最高优先级）：Super Processor 三个开关、Super Comment 配置、User Predict 字段
2. **辅助码**：触发模式详细对比、方案选择描述、hintLength 和 splitHint 说明
3. **反查**：数据来源对比、反查方式说明
4. **注释与提示**：注释模式和编码显示选项说明
5. **候选词显示**：spellingHints 阈值说明、alwaysShowComments 场景说明
6. **快捷键**：功能键描述
7. **开关**：重置默认值说明、多状态开关行为

每个模块：补内联描述 → 添加 SettingHelp → 同步教程 MDX

### 阶段三：中低优先级模块

- 拼写方案、ASCII 模式、特殊输入
- 全局教程内容校对和术语统一

---

## 不在范围内

- 教程面板本身的 UI/交互改动（如面板宽度、搜索功能等）
- 新增模块或删除现有模块
- 非高级设置的基础设置改动（已经够清晰）
