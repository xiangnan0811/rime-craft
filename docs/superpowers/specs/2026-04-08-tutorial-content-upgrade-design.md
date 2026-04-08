# 教程内容全量升级设计文档

## 概览

### 问题

当前配置编辑器共 15 个模块，但教程内容存在严重不均衡：

- **8 篇基础模块教程**（switches、candidate-settings 等）：质量较好（80-120 行），包含概念解释、YAML 示例、常见搭配
- **7 篇万象特有模块教程**（spelling-scheme、auxiliary-code-config 等）：占位符质量（15-30 行），无 YAML 示例、无使用场景、无深度讲解
- **技术 bug**：7 篇新教程的 MDX 文件虽然存在，但未注册到 `tutorial-loaders.ts`，导致编辑器侧边栏显示「暂无此模块的教程内容」
- **内容分散**：`auxiliary-code.mdx`（76 行）和 `lua-scripting.mdx`（125 行）作为独立教程存在，与对应的模块教程内容割裂

### 目标

将所有 15 个编辑器模块的教程重写为深度、完整、风格统一的实战指南，让万象拼音的每个特色功能都有配得上的教程内容。Rime 的用户群体是热衷折腾、想要掌握输入法的人——高级功能的教程质量直接决定用户留存。

### 决策记录

| 决策项 | 选择 | 原因 |
|--------|------|------|
| 独立教程与模块教程关系 | 完全合并，模块教程为唯一入口 | 零重复，用户只需看一个地方 |
| 内容深度 | 120-200 行/篇，含原理、对比、学习路径 | 目标用户是深度用户，需要完整信息 |
| 升级范围 | 全量重写 15 篇 | 统一风格和深度标准 |
| 写作风格 | 混合风格 | 概念/原理用客观文档风，配置/推荐用实战指南风 |
| 准确性来源 | 项目代码定义 + 万象实际使用经验 | 确保与编辑器 UI 一致，同时补充深度内容 |

---

## 教程模板结构

每篇教程统一采用以下结构，根据内容复杂度适当伸缩：

```
# 标题

一句话导言：这个功能解决什么问题、为什么重要。

## 这是什么

概念解释（客观文档风）：
- 功能的本质和工作原理
- 与 Rime 引擎的关系
- 关键术语定义

## 配置项详解

每个配置项的说明（带 YAML 示例）：
- 参数名、取值范围、默认值
- 每个选项的含义和效果
- 代码块展示实际 YAML 写法

<ConfigSlot module="xxx" />  ← 沉浸模式下嵌入配置组件

## 常见场景与推荐搭配

切换到实战指南风格：
- 「如果你是……那么推荐……」句式
- 2-3 个典型用户画像对应的配置方案
- 完整 YAML 示例块

## 进阶技巧

:::tip / :::warning callout 形式：
- 容易踩的坑、常见误区
- 与其他模块的配合技巧
- 性能或体验优化建议

## 学习路径

从入门到精通的分步建议：
- 第一步：先用默认配置体验
- 第二步：调整最常用的 N 个选项
- 第三步：进阶自定义

## 相关模块

交叉引用其他相关教程（markdown 链接）

<ConfigSlot module="xxx" />  ← 文末再放一次
```

### 风格规则

- 概念/原理部分用客观文档风（第三人称陈述）
- 配置/推荐部分切换为实战指南风（「你」称呼用户）
- YAML 示例必须是**可直接复制使用的完整 patch 写法**
- 每篇至少包含 2 个 callout（tip/warning/note）
- ConfigSlot 放在配置项讲解处（沉浸模式下嵌入组件）和文末

---

## 15 篇教程内容规划

### 基本设置组（4 篇）

#### schema-manager — 输入方案管理（~120 行）

**核心内容**：
- 方案概念：什么是输入方案，方案文件的组成（.schema.yaml / .dict.yaml / .custom.yaml）
- 方案切换机制：Ctrl+~ 方案菜单、deploy 重新部署
- 主流方案对比：万象拼音 vs 雾凇拼音 vs 朙月拼音（功能差异、适用人群）
- 多方案共存：如何安装多个方案并在运行时切换
- 方案文件结构说明：各配置段（engine、translator、switches 等）的作用概览

**YAML 示例**：方案列表配置（default.custom.yaml 的 schema_list 段）

**交叉引用**：switches、key-bindings

#### candidate-settings — 候选词设置（~130 行）

**核心内容**：
- page_size 详解：取值范围、不同值的适用场景对比表
- alternative_select_keys：数字键 vs 字母键选词的优劣分析
- 翻页键配置：PageUp/PageDown、方括号翻页、minus/equal 翻页
- **新增**：translator 高级设置
  - enable_completion：逐码提示（打 `n` 就出现「你」），开启 vs 关闭的体验差异
  - enable_sentence：整句输入模式，适合长句输入的用户
  - initial_quality：候选词优先级权重，影响排序
- 不同输入风格的推荐搭配（全拼用户 / 双拼用户 / 极简配置）

**YAML 示例**：基础配置、双拼推荐配置、translator 高级配置

**交叉引用**：dictionary、switches

#### key-bindings — 按键绑定（~130 行）

**核心内容**：
- ascii_composer 机制详解：switch_key 的 5 种 SwitchKeyAction（commit_code/commit_text/inline_ascii/clear/noop）
- good_old_caps_lock 行为说明
- 直观示例：输入 `nihao` 后按不同切换键的结果对比
- **新增**：功能快捷键（10 个 FunctionKeyDefinition）
  - 功能类：以词定字 `[` `]`、词语联想 Control+g、编码切换
  - 导航类：翻页、移动光标
  - 编辑类：删词、清空输入
- macOS / Windows / Linux 的按键差异说明

**YAML 示例**：macOS 经典配置、禁用 Shift 切换配置、功能快捷键配置

**交叉引用**：ascii-mode、switches

#### switches — 开关与杂项（~150 行）

**核心内容**：
- 开关机制原理：switches 段定义、name/reset/states 字段含义
- **重写**：万象多状态开关（options 数组 vs 二值 name）
  - 简繁转换（4 态）：简体 → 繁体 → 火星文 → 大写数字
  - 编码显示（3 态）：原始编码 → 带声调拼音 → 无声调拼音
  - 注释模式（3 态）：关闭 → 有声调注释 → 无声调注释
- 二值开关（按类别分组讲解）：
  - 基本类：ascii_mode、emoji_suggestion
  - 转换类：simplification、full_shape、ascii_punct
  - 输入类：prediction（词语预测）、abbrev（缩略输入）
  - 显示类：charset_filter（字符集过滤）、char_priority（单字优先）
  - 编码类：super_tips（超级提示）
  - 注释类：super_comment（超级注释）
- 开关与方案菜单 Ctrl+~ 的关系
- 快捷键绑定开关（toggle 动作）

**YAML 示例**：通用开关配置、万象多状态开关配置、快捷键绑定示例

**交叉引用**：key-bindings、comment-hints、candidate-settings

### 输入行为组（4 篇）

#### fuzzy-pinyin — 模糊音规则（~130 行）

**核心内容**：
- 模糊音原理：为什么需要模糊音（方言影响、发音习惯）
- 全部模糊音规则表：声母模糊（z/zh、c/ch、s/sh、l/n、f/h、r/l）、韵母模糊（an/ang、en/eng、in/ing、ian/iang、uan/uang）
- 每组模糊音的方言背景说明（哪些地区的用户需要）
- 模糊音对输入效率的影响分析：开启越多→重码越多→选词越频繁
- 与双拼的兼容性说明：双拼模式下模糊音的行为差异
- 推荐配置：南方用户（开 l/n、f/h）、北方用户（通常不需要）、保守策略（只开最常犯的 1-2 组）

**YAML 示例**：最小模糊音配置、南方方言推荐、全开配置

**交叉引用**：spelling-scheme

#### spelling-scheme — 拼写方案（~150 行）

**核心内容**：
- 全拼 vs 双拼原理对比：每个音节的按键次数差异、学习曲线
- 万象支持的 7 种拼写方案逐一介绍：
  - 全拼：标准拼音，无学习成本
  - 小鹤双拼：最流行，键位分布均匀，社区资源丰富
  - 自然码双拼：历史最久的双拼方案
  - 微软双拼：微软拼音用户无缝迁移
  - 搜狗双拼：搜狗输入法用户迁移
  - 智能ABC双拼：经典方案
  - 紫光双拼：紫光/华宇用户
- 各方案的键位特点简要对比（哪些韵母位置不同）
- 切换命令：/flypy、/zrm、/mspy 等触发码
- 从全拼迁移到双拼的学习建议（推荐小鹤，2 周适应期）
- 双拼与辅助码的黄金组合：为什么双拼+辅助码是效率最高的方案

**YAML 示例**：切换拼写方案的 patch 写法

**交叉引用**：auxiliary-code、fuzzy-pinyin

#### auxiliary-code — 辅助码配置（~200 行）

**合并来源**：`auxiliary-code.mdx`（概念深度内容）+ `auxiliary-code-config.mdx`（配置项）

**核心内容**：
- 辅助码原理（合并自 auxiliary-code.mdx）：
  - 拼音输入法的重码痛点
  - 音形结合的核心思想：拼音定音 + 形码定形
  - 辅助码不替代拼音，而是补充字形维度
- 8 种辅助码方案对比表（合并自 auxiliary-code.mdx）：

  | 名称 | 字形基础 | 难度 | 适合人群 |
  |------|----------|------|---------|
  | 墨奇码 | 字形拆分 | 中 | 万象推荐默认 |
  | 鹤形 | 字根（类五笔） | 中高 | 小鹤双拼用户 |
  | 自然码 | 部首+笔画 | 中 | 自然码双拼用户 |
  | 虎码 | 字根 | 中高 | 追求低重码 |
  | 五笔 | 五笔字根 | 高 | 已会五笔的用户 |
  | 仓颉 | 仓颉字根 | 高 | 已会仓颉的用户 |
  | 简单鹤 | 鹤形简化 | 低 | 入门辅助码 |
  | 汉心码 | 笔画 | 低 | 不想学字根的用户 |

- 3 种引导方式详解：
  - 直接辅助码：四码末尾直接追加，如 `wjag`（万）→ 效率最高但需要记忆
  - 间接辅助码：双拼后加 `/` 分隔，如 `wj/ag` → 视觉分隔更清晰
  - 反引号引导：输入拼音后按 `` ` `` → 最容易上手，新手推荐
- 辅助码提示配置：开启/关闭、提示字数
- 实际输入示例演示（以「学」字为例的完整输入过程）
- 学习路径：从 0 到盲打的 4 步建议（合并自 auxiliary-code.mdx）

**YAML 示例**：辅助码方案选择、引导方式配置、提示开关

**交叉引用**：spelling-scheme、comment-hints、reverse-lookup

#### reverse-lookup — 反查与筛选（~150 行）

**核心内容**：
- 反查的使用场景：遇到不认识的字时，如何用其他方式输入
- 触发键配置：默认反引号 `` ` ``，可自定义
- 5 种反查方式详解：
  - 两分反查：将字拆成两部分分别输入拼音（如「明」→ ri+yue）
  - 多分反查：拆成多个部分
  - 笔画反查：h（横）s（竖）p（撇）n（捺）z（折）
  - 声调反查：通过声调信息辅助筛选
  - 辅助码反查：利用已知的辅助码信息反查
- 数据源选择：
  - aux（词库注释提取）：轻量，但数据依赖词库完整性
  - db（独立反查数据库）：数据更完整，但需要额外文件
  - 两者的适用场景对比
- 反查与辅助码筛选的配合使用：先反查找到字，再学习它的辅助码

**YAML 示例**：反查触发键配置、数据源选择配置

**交叉引用**：auxiliary-code、special-input

### 辅助功能组（4 篇）

#### punctuation — 标点符号映射（~130 行）

**核心内容**：
- 中英标点切换机制：ascii_punct 开关的作用
- 标点映射的 YAML 写法：punctuator/full_shape 和 punctuator/half_shape
- 配对符号行为：括号、引号的自动配对机制
- 特殊标点的多种输入方式：
  - 省略号「……」：连按两次句号
  - 破折号「——」：连按两次减号
  - 直角引号「」『』：设置方法
- 自定义单个标点映射（如让 `/` 输出 `、`）
- 程序员推荐配置：中文模式下保留部分英文标点

**YAML 示例**：自定义标点映射、直角引号配置、程序员配置

**交叉引用**：switches（ascii_punct 开关）

#### dictionary — 词典管理（~140 行）

**核心内容**：
- 词典系统架构：
  - 主词典（.dict.yaml）：方案自带的核心词库
  - 用户词典：使用中自动积累的个人词频
  - 自定义词典（custom_phrase.txt）：手动添加的自定义短语
- 词频调整机制：Rime 如何根据使用频率动态调整候选词排序
- 用户词典维护：
  - 导出用户词典（sync 功能）
  - 导入/合并词典
  - 清理低频词
- 自定义短语的添加方法：custom_phrase.txt 的格式和用法
- 词典与输入准确率的关系：词库大小、词频质量对日常输入的影响

**YAML 示例**：挂载自定义词典、词典导入配置

**交叉引用**：candidate-settings

#### special-input — 特殊输入（~150 行）

**核心内容**：
- 特殊输入的实现原理：通过 Lua translator 将触发码转换为动态内容
- 11 种特殊触发码逐一详解（按类别分组）：
  - 日期时间类：
    - `/rq`：当前日期（输出格式示例：2026年4月8日 / 2026-04-08 等多种格式）
    - `/sj`：当前时间
    - `/xq`：当前星期
    - `/nl`：农历日期
    - `/jq`：当前节气
    - `/jr`：近期节日
    - `/tt`：Unix 时间戳
  - 工具类：
    - `V` + 表达式：数学计算器（支持四则运算、括号、常用函数）
    - `U` + 编码：Unicode 字符输入（如 U4e07 → 万）
  - 统计类：
    - `/rtj`：今日输入统计
    - `/tj`：累计输入统计
- 每种触发码的输出格式和多候选说明
- 触发码的启用/禁用配置

**YAML 示例**：特殊输入的 recognizer 配置

**交叉引用**：lua-extensions、reverse-lookup

#### lua-extensions — Lua 扩展（~200 行）

**合并来源**：`lua-scripting.mdx`（Lua 入门内容）+ `lua-extensions.mdx`（万象扩展配置）

**核心内容**：
- Lua 在 Rime 中的角色（合并自 lua-scripting.mdx）：
  - 三类组件：translator（翻译器）、filter（过滤器）、processor（处理器）
  - 输入法流水线中 Lua 的位置：用户按键 → processor → translator → filter → 候选词
  - 脚本文件位置：rime.lua 入口文件 + lua/ 子目录
- 万象 4 大内置 Lua 扩展详解：
  - **超级注释**（super_comment）：
    - 功能：为候选词添加辅助码提示、纠错提示
    - 配置：注释候选词长度、纠错提示格式
    - 与 comment-hints 模块的配合关系
  - **超级处理器**（super_processor）：
    - 退格限制：防止误删过多字符
    - 音节循环：Tab 键在音节间循环跳转
    - 声调回落：声调输入不匹配时自动回落为普通输入
  - **用户预测**（user_predict）：
    - 功能：基于输入历史预测下一个可能输入的词
    - 配置参数：最大候选数量（max_candidates）、过期天数（expiration_days）、激活天数（activation_days）
    - 参数调优建议
  - **输入统计**（input_stats）：
    - 记录输入字数、词数等统计
    - 通过 `/tj`、`/rtj` 查看
- 调试方法（合并自 lua-scripting.mdx）：
  - 日志文件位置（macOS / Windows / Linux）
  - log.info() 调试技巧
- 社区 Lua 扩展推荐：常见的第三方 Lua 配方简介

**YAML 示例**：超级注释配置、用户预测参数调优、Lua 组件挂载

**交叉引用**：comment-hints、special-input、switches（super_comment 开关）

### 外观与显示组（3 篇）

#### ascii-mode — 中英文切换（~120 行）

**核心内容**：
- 中英文切换的完整机制：ascii_mode 开关 + ascii_composer 配合工作
- 全局切换 vs 临时切换（inline_ascii）的区别
- 应用级中英切换：指定特定应用默认使用英文模式
  - macOS：通过 app_options 配置
  - Windows：通过 app_options 配置
- 自动切换策略：哪些场景应该自动切英文（终端、IDE、浏览器地址栏）
- 与 key-bindings 的关系说明：ascii_composer/switch_key 定义切换按键，ascii_mode 是被切换的状态

**YAML 示例**：app_options 应用级配置、自动切换配置

**交叉引用**：key-bindings、switches

#### candidate-display — 候选词显示（~130 行）

**核心内容**：
- 横排 vs 竖排的适用场景：
  - 竖排（默认）：适合窄屏、传统用户
  - 横排：节省纵向空间、适合宽屏、现代 UI 风格
- spelling_hints 拼音提示参数详解：
  - 取值含义：0=关闭，数字 N=为 N 字以内的候选词显示拼音
  - 设置 30 可以为几乎所有候选词显示拼音（学习阶段推荐）
  - 设置 0 关闭（熟练后减少视觉干扰）
- always_show_comments 的行为差异：
  - true：始终显示注释信息
  - false：仅在有辅助码筛选时显示
- 与注释模式的配合：不同注释模式下 always_show_comments 的视觉效果差异
- 不同阶段的推荐配置：初学者（全开提示）→ 进阶（部分提示）→ 熟练（关闭提示）

**YAML 示例**：横排配置、拼音提示配置、学习模式完整配置

**交叉引用**：comment-hints、auxiliary-code

#### comment-hints — 注释与提示（~140 行）

**核心内容**：
- 注释模式 3 态详解：
  - 关闭注释：不显示任何注释，最简洁
  - 有声调注释：显示带声调标记的拼音（如 nǐ hǎo），适合学习标准发音
  - 无声调注释：显示不带声调的拼音（如 ni hao），轻量提示
- 编码显示 3 态详解：
  - 原始编码：显示用户实际输入的键位（如 nihk）
  - 带声调拼音：将编码转换为标准拼音显示（如 nǐ hǎo）
  - 无声调拼音：转换为不带声调的拼音（如 ni hao）
- 注释在学习辅助码中的作用：
  - 开启注释可以在候选词旁看到辅助码编码
  - 学习阶段推荐开启，熟练后可关闭减少视觉干扰
- 与超级注释 Lua 扩展的关系：
  - switches 中的注释模式控制「显不显示」
  - lua-extensions 中的超级注释控制「显示什么内容」
  - 两者需要配合使用
- 推荐配置组合：
  - 学习辅助码：注释=有声调 + 编码=原始 + 超级注释开启
  - 日常使用：注释=关闭 + 编码=原始
  - 教学展示：注释=有声调 + 编码=带声调拼音

**YAML 示例**：注释模式配置、编码显示配置、学习模式完整配置

**交叉引用**：auxiliary-code、lua-extensions（超级注释）、candidate-display、switches

---

## 技术变更

### 修复 tutorial-loaders.ts

补全 7 个缺失的 MDX 加载器注册：

```typescript
// src/data/tutorial-loaders.ts — 新增以下 7 条
'spelling-scheme': () => import('@/content/spelling-scheme.mdx'),
'auxiliary-code-config': () => import('@/content/auxiliary-code-config.mdx'),
'reverse-lookup': () => import('@/content/reverse-lookup.mdx'),
'special-input': () => import('@/content/special-input.mdx'),
'lua-extensions': () => import('@/content/lua-extensions.mdx'),
'candidate-display': () => import('@/content/candidate-display.mdx'),
'comment-hints': () => import('@/content/comment-hints.mdx'),
```

### 统一 ConfigSlot 使用

现有 3 篇基础教程仍使用 `<GoToConfigButton>`（switches.mdx、candidate-settings.mdx、key-bindings.mdx），统一替换为 `<ConfigSlot module="xxx" />`。

### 清理合并后的独立文件

合并完成后删除以下文件：
- `src/content/auxiliary-code.mdx` → 内容已并入 `auxiliary-code-config.mdx`
- `src/content/lua-scripting.mdx` → 内容已并入 `lua-extensions.mdx`

需要检查其他 MDX 文件中对这两个文件的交叉引用链接，更新为新路径。

### 不涉及的文件

- `src/data/module-registry.ts` — 不修改
- `src/data/schema-registry.ts` — 不修改
- 所有模块 UI 组件（`src/features/editor/modules/*.tsx`）— 不修改
- `src/components/shared/mdx-components.tsx` — 不修改（ConfigSlot 已注册）

---

## 交叉引用网络

教程之间的关联关系（每篇末尾「相关模块」部分使用）：

```
spelling-scheme  ←→  auxiliary-code     双拼+辅助码是核心组合
auxiliary-code   ←→  comment-hints      辅助码提示依赖注释配置
auxiliary-code   ←→  reverse-lookup     反查可用辅助码筛选
comment-hints    ←→  candidate-display  注释和编码显示密切相关
comment-hints    ←→  lua-extensions     超级注释是 Lua 扩展
special-input    ←→  lua-extensions     特殊输入由 Lua 实现
key-bindings     ←→  ascii-mode         按键切换与中英模式
key-bindings     ←→  switches           快捷键可绑定开关切换
switches         ←→  candidate-settings 部分开关影响候选行为
dictionary       ←→  candidate-settings 词典质量影响候选排序
fuzzy-pinyin     ←→  spelling-scheme    模糊音与拼写方案配合
punctuation      ←→  switches           ascii_punct 开关控制标点
```

---

## 质量标准

每篇教程交付前的检查清单：

- [ ] 行数在 120-200 之间
- [ ] 至少包含 2 个 YAML 代码块（完整 patch 写法）
- [ ] 至少包含 2 个 callout（:::tip / :::warning / :::note）
- [ ] 包含「常见场景」部分，至少 2 个用户画像
- [ ] 包含「学习路径」部分
- [ ] 包含「相关模块」交叉引用（符合上述引用网络）
- [ ] 使用 `<ConfigSlot>` 而非 `<GoToConfigButton>`
- [ ] 概念部分客观文档风，配置推荐部分实战指南风
- [ ] YAML 示例可直接复制使用
- [ ] 万象特有内容标注适用方案（如「此功能需要万象拼音」）

---

## 执行顺序

按依赖关系分 3 批，确保交叉引用时被引用的教程已经存在：

### 第一批：被引用最多的核心模块

1. switches（被 key-bindings、comment-hints、candidate-settings、punctuation 引用）
2. auxiliary-code（被 spelling-scheme、comment-hints、reverse-lookup、candidate-display 引用）
3. lua-extensions（被 comment-hints、special-input 引用）
4. spelling-scheme（被 auxiliary-code、fuzzy-pinyin 引用）

### 第二批：引用第一批的模块

5. key-bindings
6. candidate-settings
7. reverse-lookup
8. comment-hints
9. candidate-display

### 第三批：相对独立的模块

10. schema-manager
11. fuzzy-pinyin
12. punctuation
13. dictionary
14. special-input
15. ascii-mode

### 收尾

16. 修复 tutorial-loaders.ts（补全 7 个加载器）
17. 统一 GoToConfigButton → ConfigSlot
18. 删除 auxiliary-code.mdx 和 lua-scripting.mdx
19. 验证所有交叉引用链接有效
20. 构建验证：确保所有 MDX 文件编译通过
