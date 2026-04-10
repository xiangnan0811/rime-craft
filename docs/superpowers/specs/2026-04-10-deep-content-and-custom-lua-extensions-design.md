# rime-craft 内容深度化与 Lua 扩展统一重构 — 设计文档

**日期**：2026-04-10
**状态**：设计定稿，待实施
**范围**：全项目教程内容深度化、UI 支持自定义 Lua 扩展、特殊输入与 Lua 扩展模块统一重构

---

## 1. 背景与动机

### 1.1 当前痛点

rime-craft 目前作为 RIME 输入法的 Web 配置编辑器，存在三个核心问题：

1. **功能覆盖浮于表面**：特殊输入页面只暴露 11 个万象拼音预设的触发器（如 `/rq` 日期、`V` 计算器），用户只能开关和改触发码。但 RIME 的本质是"可完全定制"的输入法，用户应当能够自定义任何 Lua 触发器——只暴露预设背离了 RIME 设计初衷。

2. **教程内容深度不足**：22 个 MDX 教程文件平均 ~130 行，大部分只覆盖"是什么 + 怎么操作"，缺少原理机制、完整示例、自定义扩展、常见问题、维护建议等深度内容。`what-is-rime.mdx` 仅 49 行，`double-pinyin-guide.mdx` 仅 72 行，严重不足。

3. **模块边界割裂**：「特殊输入」和「Lua 扩展」是两个独立模块，但实际上都基于 Lua。输入统计的配置在 Lua 扩展模块，但其触发码 `/tj` 在特殊输入模块——同一个功能被拆到两处，用户理解成本高。

### 1.2 目标

- **全面深化**：15 个编辑器模块 + 7 个概念文档全部达到"原理 + 操作 + 自定义 + 维护"的完整深度
- **UI 支持自定义**：用户可以在浏览器中编写、管理 Lua 脚本，并创建自定义触发器
- **统一重构**：特殊输入与 Lua 扩展合并为一个结构清晰的模块
- **渐进披露**：内容分层呈现，新手看基础，高手可展开进阶

### 1.3 非目标

本次设计明确**不做**以下内容：

- 浏览器内实时运行/调试 Lua 脚本（超出 Web 配置编辑器能力范围）
- Lua 语义校验（交给 RIME 部署时校验）
- 输入法沙盒环境（开发成本远超收益）
- Wizard 式分步引导（过度工程化，用渐进披露足够）
- 使用 Monaco 编辑器（体积 ~2MB 过重，改用 CodeMirror 6 ~150KB）

---

## 2. 设计方案概览

采用**双轨并行**策略：

- **Track A（基础设施）**：内容深度指南 + 3 个渐进披露 MDX 组件（可复用）
- **Track B（标杆模块）**：特殊输入 + Lua 扩展的统一重构 + 自定义 Lua 编辑能力

两轨在标杆模块上汇合——用新 UI 组件 + 新内容指南打造合并后的"Lua 扩展"模块，作为后续推广到其他模块的范本。

整个工作分 **4 批交付**：第 1 批为基础设施 + 标杆模块（本次实施范围），后续批次按优先级推广到剩余模块。

---

## 3. 内容深度指南（Track A · 核心标准）

这是所有模块教程的统一深度标准。不是固定模板，而是**最低深度要求 + 3 层渐进内容模型**。

### 3.1 三层内容模型

每个模块的 MDX 教程按以下三层组织。第 1-2 层默认展开，第 3 层用 `<Details>` 折叠，按需展开。

#### 第 1 层：核心（必须）

所有模块必须覆盖：

- **是什么** — 一句话定义 + 它解决什么问题 + 为什么需要它
- **快速上手** — 最常用的 2-3 个操作，配合 UI 说明
- **配置项详解** — 每个配置项的含义、默认值、取值范围、效果

#### 第 2 层：理解（必须，篇幅按复杂度调整）

所有模块必须覆盖：

- **原理机制** — 这个功能在 RIME 中是怎么工作的（涉及的 YAML 字段、Lua 组件、引擎调用链）
- **完整示例** — 可复制的 YAML/Lua 代码块，展示从配置到效果的完整过程
- **常见场景** — 不同用户群体（办公、程序员、写作）的推荐搭配

#### 第 3 层：进阶（按复杂度可选，用 `<Details>` 折叠）

复杂模块（如 Lua 扩展、候选词设置、按键绑定）必须覆盖，简单模块（如 ASCII 模式）可选：

- **自定义扩展** — 如何超越编辑器预设，手写 YAML/Lua 实现更多可能
- **常见问题与排错** — 配置不生效的检查步骤、典型错误及修复
- **注意事项与维护** — 升级方案时的兼容性、备份策略、多设备同步注意点
- **底层细节** — RIME 引擎相关的深入技术细节

### 3.2 内容发布前的检查清单

每个模块教程发布前必须通过以下五项检查：

| 检查项 | 要求 |
|------|------|
| 新手能否仅看第 1 层就完成基本配置？ | 必须满足 |
| 用户是否理解"为什么这样配置"？ | 第 2 层必须覆盖 |
| 想要超越预设的用户是否有路径？ | 第 3 层必须覆盖 |
| 出了问题能否自助排查？ | FAQ 必须覆盖 |
| 示例代码能否直接复制使用？ | 必须可用 |

### 3.3 落地位置

将 3.1 和 3.2 的内容抽出写入 `docs/CONTENT_DEPTH_GUIDE.md`，作为项目级的内容贡献规范。新增或修改 MDX 教程时需遵守此指南。

---

## 4. 渐进披露 UI 组件（Track A · 技术基础）

新增 3 个 MDX 组件，注册到 `src/components/shared/mdx-components.tsx`，供所有教程文件使用。

### 4.1 `<Details>` — 可折叠内容区

**位置**：`src/components/shared/Details.tsx`

**用途**：承载第 3 层进阶内容，默认折叠。

**Props**：
```typescript
interface DetailsProps {
  title: string;                                // 折叠状态下显示的标题
  level?: 'intermediate' | 'advanced';          // 难度标记，可选
  defaultOpen?: boolean;                        // 初始是否展开，默认 false
  children: React.ReactNode;
}
```

**行为**：
- 默认折叠，点击标题展开
- `level="intermediate"`：标题旁显示蓝色「扩展」badge
- `level="advanced"`：标题旁显示紫色「进阶」badge
- 展开/折叠状态不持久化，页面刷新后恢复初始状态
- 使用无障碍标准：`<details>/<summary>` 或等效的 ARIA 属性
- 左侧有色条视觉提示（浅灰/蓝/紫），嵌套在正文流中不打断阅读

**MDX 用法示例**：
```mdx
<Details title="原理：lua_translator 的调用链" level="advanced">
  当 RIME 引擎遇到一段编码时，会按 schema 中注册的 translator 顺序调用...
  ```yaml
  engine:
    translators:
      - lua_translator@date_translator
  ```
</Details>
```

### 4.2 `<StepGuide>` + `<Step>` — 分步操作指南

**位置**：`src/components/shared/StepGuide.tsx`

**用途**：将多步操作流程可视化，每步有编号、说明、可选的代码块和预期结果。视觉增强的有序列表，不是 wizard。

**Props**：
```typescript
interface StepGuideProps {
  children: React.ReactNode;  // 应包含多个 <Step>
}

interface StepProps {
  title: string;
  children: React.ReactNode;
}
```

**行为**：
- 自动为每个 `<Step>` 编号（圆圈数字图标）
- 步骤之间有垂直连接线，视觉上呈现流程感
- 每步的标题用中等加粗字号，子内容正常排版
- 代码块、图片、其他 MDX 内容可自由嵌入

**MDX 用法示例**：
```mdx
<StepGuide>
  <Step title="创建 Lua 脚本文件">
    在 RIME 用户目录下创建 `lua/my_translator.lua`...
  </Step>
  <Step title="在 schema 中注册">
    编辑 `xxx.custom.yaml`，添加 patch...
  </Step>
  <Step title="重新部署并验证">
    执行「重新部署」，输入 `/hello` 应看到候选词 "Hello!"
  </Step>
</StepGuide>
```

### 4.3 `<YamlPreview>` — YAML 配置预览

**位置**：`src/components/shared/YamlPreview.tsx`

**用途**：展示 YAML 配置片段时支持行高亮、标题、说明。基于现有 `Pre` 组件扩展。

**Props**：
```typescript
interface YamlPreviewProps {
  title?: string;                // 顶部显示的文件名或标题
  highlight?: number[];          // 需要高亮的行号数组（1-based）
  caption?: string;              // 代码块下方的说明文字
  diff?: boolean;                // 是否启用 diff 模式（+/- 着色）
  children: React.ReactNode;     // 通常是 <pre><code> 代码块
}
```

**行为**：
- 复用 `CodeBlock.tsx` 中的复制按钮逻辑
- `highlight` 指定的行显示浅黄色背景
- `diff` 模式下，`+` 开头的行绿色，`-` 开头的行红色
- `caption` 显示在代码块下方，斜体灰色字

**MDX 用法示例**：
```mdx
<YamlPreview
  title="xxx.custom.yaml"
  highlight={[3, 4]}
  caption="第 3-4 行是自定义 trigger 的关键配置"
>
  ```yaml
  patch:
    engine/translators/+:
      - lua_translator@date_translator
      - lua_translator@my_translator
  ```
</YamlPreview>
```

### 4.4 注册到 MDX 组件映射

修改 `src/components/shared/mdx-components.tsx`：

```typescript
import { Details } from './Details'
import { StepGuide, Step } from './StepGuide'
import { YamlPreview } from './YamlPreview'

export const mdxComponents = {
  // ... existing
  Details,
  StepGuide,
  Step,
  YamlPreview,
}
```

---

## 5. 模块统一重构 —「Lua 扩展」（Track B · 核心）

### 5.1 为什么合并

当前两个独立模块有严重的概念重叠：

| 现象 | 原因 |
|-----|------|
| 特殊输入的 11 个触发器（`/rq`、`/tj` 等）实际都是 Lua 实现 | RIME 的特殊输入机制就是 `lua_translator` |
| 输入统计配置在 Lua 扩展模块，但其触发码 `/tj` 在特殊输入模块 | 同一功能被拆到两处 |
| 用户看不到"特殊输入是 Lua 扩展的一种应用"这个本质 | 模块切分误导理解 |
| 用户不知道可以自定义触发器 | UI 只暴露预设 |

合并后用户有一个统一的 Lua 扩展入口，理解成本降低，扩展能力提升。

### 5.2 新模块结构（3 个 Tab）

合并后的模块 ID 仍为 `lua-extensions`（减少迁移成本），label 为「Lua 扩展」，内部分为 3 个 Tab：

```
┌─────────────────────────────────────────────────┐
│  Lua 扩展                                        │
│  ┌──────────┬──────────────┬──────────────┐      │
│  │ 特殊输入  │  内置功能增强  │  自定义脚本  │      │
│  └──────────┴──────────────┴──────────────┘      │
└─────────────────────────────────────────────────┘
```

#### Tab 1：特殊输入

保留现有功能 + 新增自定义触发器区：

**预设触发器区**（现状保留）：
- 11 个万象预设触发器，分 3 个分类（日期时间、工具、统计）
- 每个触发器有开关 + 触发码自定义输入框
- 预设触发器显示"内置"badge

**自定义触发器区**（新增）：
- 「+ 添加自定义触发器」按钮
- 每个自定义触发器显示：名称、触发码、关联的 Lua 脚本名、「编辑」「删除」按钮
- 自定义触发器显示"用户"badge
- 新增/编辑使用对话框形式，包含字段：
  - 名称（用户可读，如"IP 地址查询"）
  - 触发码（如 `/ip`）
  - 描述
  - 关联脚本（下拉选择 Tab 3 中已注册的 Lua 脚本，或"新建脚本"快速入口）

#### Tab 2：内置功能增强

即现有 `LuaExtensions.tsx` 的内容，保持不变：
- 超级注释（superComment）
- 超级处理器（superProcessor）
- 超级替换（superReplacer）
- 用户预测（userPredict）
- 输入统计（inputStatistics）

这些都是万象方案内置 Lua 功能的参数调整，用户不需要写代码。

#### Tab 3：自定义脚本

全新的 Lua 脚本管理界面：

**脚本列表**：
- 显示所有用户注册的 Lua 脚本
- 每条显示：文件名、类型 badge（Translator / Filter / Processor）、简短描述、「编辑」「删除」按钮
- 顶部有「新建脚本」按钮，点击后弹出类型选择（Translator / Filter / Processor），然后用对应模板填充编辑器

**Lua 编辑器**（主内容区）：
- 基于 **CodeMirror 6**（~150KB gzipped）
- 依赖：`codemirror`、`@codemirror/lang-lua`、`@codemirror/view`、`@codemirror/state`、`@codemirror/theme-one-dark`
- 功能：Lua 语法高亮、行号、括号匹配、自动缩进、基础编辑快捷键
- 工具栏按钮：「加载模板」（按类型填充骨架代码）、「格式化」（简单缩进修正）、「重置」
- **不做**：实时执行、语义校验、断点调试

**脚本注册 YAML 预览**：
- 编辑器下方显示根据当前脚本自动生成的 YAML patch（注册到 `engine/translators` / `engine/filters` / `engine/processors`）
- 只读预览，用户保存脚本时自动合并到 schema 的 YAML 输出

### 5.3 类型系统变更

修改 `src/types/config.ts`：

```typescript
// 新增：自定义触发器
export interface CustomTrigger {
  id: string;              // UUID（生成）
  name: string;            // 用户命名
  triggerCode: string;     // 如 "/ip"
  description: string;
  scriptId: string;        // 关联的 LuaScript.id
}

// 新增：Lua 脚本
export interface LuaScript {
  id: string;              // UUID
  fileName: string;        // 如 "my_translator.lua"，必须符合 Lua 文件名规范
  scriptType: 'translator' | 'filter' | 'processor';
  description: string;
  code: string;            // Lua 源码
}

// 扩展：特殊输入配置
export interface SpecialInputConfig {
  enabledTriggers: SpecialTrigger[];    // 保持不变（预设触发器）
  customTriggers: CustomTrigger[];      // 新增：自定义触发器
}

// 扩展：schema 级配置
export interface SchemaConfig {
  schemaId: string;
  fuzzyRules: FuzzyRuleState[];
  switches?: SwitchItem[];
  punctuator?: PunctuatorConfig;
  translator?: TranslatorConfig;
  spellingScheme?: SpellingScheme;
  auxiliaryCode?: AuxiliaryCodeConfig;
  reverseLookup?: ReverseLookupConfig;
  specialInput?: SpecialInputConfig;
  luaExtensions?: LuaExtensionsConfig;
  luaScripts?: LuaScript[];             // 新增：自定义脚本列表
  displayConfig?: DisplayConfig;
}
```

### 5.4 模块注册变更

修改 `src/data/module-registry.ts`：

```typescript
// 删除这两个条目：
// { id: 'special-input', ... }
// { id: 'lua-extensions', ... }

// 改为单一条目：
{
  id: 'lua-extensions',
  label: 'Lua 扩展',
  group: 'auxiliary',
  tutorialSlug: 'lua-extensions',
  applicability: { type: 'capability', cap: 'lua-extensions' },
}
```

`MODULE_COMPONENTS` 中同步删除 `special-input` 的 lazy import。

### 5.5 Schema 能力声明迁移

当前有些 schema 声明 `special-input` capability 但未声明 `lua-extensions`。迁移规则：

- 任何声明 `special-input` 的 schema 必须同时声明 `lua-extensions`（特殊输入本就是 Lua 实现）
- 编写迁移脚本扫描 `src/data/schemas-detail.json`，自动补齐
- `getModulesForSchema()` 的过滤逻辑保持不变，因为只剩下 `lua-extensions` 一个 capability

### 5.6 组件文件组织

新的目录结构：

```
src/features/editor/modules/
├── LuaExtensions.tsx                    # 重构：3-Tab 容器
├── SpecialInput.tsx                     # 删除
└── lua/                                 # 新目录
    ├── SpecialInputTab.tsx              # Tab 1 内容
    ├── BuiltinEnhancementsTab.tsx       # Tab 2 内容（从旧 LuaExtensions.tsx 迁移）
    ├── CustomScriptsTab.tsx             # Tab 3 容器
    ├── LuaCodeEditor.tsx                # CodeMirror 6 封装
    ├── CustomTriggerForm.tsx            # 自定义触发器对话框
    ├── CustomTriggerList.tsx            # 自定义触发器列表
    ├── LuaScriptList.tsx                # Lua 脚本列表
    └── LuaScriptYamlPreview.tsx         # 脚本注册的 YAML 预览
```

### 5.7 Zustand store 变更

修改 `src/stores/config-store.ts`，新增 action：

```typescript
// 自定义触发器
addCustomTrigger(schemaId: string, trigger: Omit<CustomTrigger, 'id'>): void;
updateCustomTrigger(schemaId: string, id: string, partial: Partial<CustomTrigger>): void;
deleteCustomTrigger(schemaId: string, id: string): void;

// Lua 脚本
addLuaScript(schemaId: string, script: Omit<LuaScript, 'id'>): void;
updateLuaScript(schemaId: string, id: string, partial: Partial<LuaScript>): void;
deleteLuaScript(schemaId: string, id: string): void;
```

### 5.8 YAML 序列化/反序列化

修改 `src/lib/yaml/` 下的相关函数：

**输出路径**（导出/分享/下载）：
- `customTriggers` 和 `luaScripts` 转换为 schema `.custom.yaml` 中的 patch，注册到 `engine/translators` / `engine/filters` / `engine/processors`
- 每个 `LuaScript` 的 `code` 字段同时作为独立的 `.lua` 文件输出——通过项目现有的导出机制（下载 ZIP 包或显示在专门的"Lua 脚本"文件列表中，具体遵循当前导出方式）
- 若项目当前的"导出"/"分享"功能只导出 YAML 不导出 Lua 文件，本次需要扩展导出逻辑，将 `luaScripts` 作为独立条目纳入导出包

**输入路径**（导入）：
- 扫描导入的 YAML，识别 `lua_translator@xxx` / `lua_filter@xxx` / `lua_processor@xxx` 模块引用
- 对每个识别出的 Lua 模块引用，若导入数据包含对应的 `.lua` 文件，则解析为 `LuaScript` 条目
- 若只有 YAML 没有对应 `.lua` 文件（如只导入了 custom.yaml），将 Lua 模块引用保留在 `preserved` 字段，UI 上提示用户"检测到未知 Lua 模块引用，请导入对应的 .lua 文件"

**基础用例范围**（第 1 批必须支持）：
1. 新建自定义触发器 → 导出 YAML + Lua 文件 → 导入回来，数据完整恢复
2. 新建 Lua 脚本（Translator / Filter / Processor 三种类型都要验证）→ 导出 → 导入回来，代码完整恢复
3. 同时存在预设触发器、自定义触发器和 Lua 脚本时，导出的 YAML 中 patch 结构正确（不重复、顺序稳定）

**高级用例（第 1 批可用 `preserved` 保留原样）**：
- 用户手写的复杂 YAML patch（多层嵌套、条件 include 等）
- RIME 官方尚未正式文档化的 Lua API 用法
- 这些场景下编辑器读入时不解析，写出时原样保留，确保零数据丢失

### 5.9 Lua 脚本模板

新建 `src/data/lua-script-templates.ts`：

```typescript
export const LUA_SCRIPT_TEMPLATES = {
  translator: `-- {name}
-- 类型：Translator（翻译器）
-- 作用：将特定输入映射为候选词

local function {name}(input, seg, env)
  -- TODO: 在此实现你的翻译逻辑
  -- 示例：输入 /hello 输出 "Hello, World!"
  if input == "/hello" then
    yield(Candidate("word", seg.start, seg._end, "Hello, World!", "自定义"))
  end
end

return {name}
`,
  filter: `-- {name}
-- 类型：Filter（过滤器）
-- 作用：对已有候选词进行过滤、排序或修改

local function {name}(input, env)
  for cand in input:iter() do
    -- TODO: 在此处理候选词
    yield(cand)
  end
end

return {name}
`,
  processor: `-- {name}
-- 类型：Processor（处理器）
-- 作用：拦截按键事件

local function {name}(key, env)
  -- 返回值：
  --   kNoop    = 0  未处理，继续传递
  --   kAccepted = 1  已处理，拦截
  --   kRejected = 2  拒绝处理
  return 0  -- kNoop
end

return {name}
`,
}
```

### 5.10 教程内容重构

`src/content/lua-extensions.mdx` 按第 3 节的深度指南**完整重写**，作为标杆范本：

**第 1 层（核心）**：
- 什么是 Lua 扩展：RIME 引擎的可编程能力
- 3 个 Tab 各做什么（特殊输入 / 内置增强 / 自定义脚本）
- 快速上手：开关一个预设触发器、调整一个内置功能参数

**第 2 层（理解）**：
- RIME 的 Lua 组件模型：Translator vs Filter vs Processor 的差异与使用场景
- 完整示例：从写一个 `/ip` 自定义触发器到使用（用 `<StepGuide>` 组件呈现）
- `<YamlPreview>` 展示注册前后的 YAML 变化
- 常见场景：办公用的日期时间、程序员用的计算器/时间戳、写作用的农历节气

**第 3 层（进阶，全部用 `<Details>` 折叠）**：
- RIME engine 组件调用链：prism → segmentor → translator → filter → processor 的数据流
- 高级 Lua API：Candidate、Segment、Context、Engine 对象的常用方法
- 排错指南：
  - 自定义触发器不生效的检查步骤
  - Lua 脚本语法错误如何定位
  - 部署日志查看方法
- 维护与同步：
  - 升级万象方案时自定义脚本的备份策略
  - 多设备同步时 Lua 脚本的路径差异
  - 如何从社区复用他人的 Lua 脚本

**删除**：`src/content/special-input.mdx`（内容合并到 lua-extensions.mdx）

### 5.11 教程链接修正

扫描所有 MDX 文件中对 `./special-input` 的链接，改为 `./lua-extensions`。影响文件：至少 `reverse-lookup.mdx`、其他若有。

---

## 6. 全模块审计与优先级（后续批次规划）

15 个编辑器模块按深度需求分为 4 档，加上独立概念文档为档位 E。

### 6.1 档位 A：旗舰模块（第 1 批）

- **合并后的 Lua 扩展**：标杆模块，同时涉及 UI 重构 + 完整 3 层内容 + 所有新组件的示范使用

### 6.2 档位 B：高优先级（第 2 批）

高频使用 + 复杂度高的 6 个模块：

| 模块 | 当前行数 | 关键深化点 |
|-----|---------|----------|
| candidate-settings（候选词设置） | 245 | TranslatorConfig 各字段的 RIME 底层含义、词典加载原理 |
| key-bindings（按键绑定） | 143 | `when/accept/send/toggle` 语义模型、自定义键位的完整流程 |
| switches（开关与杂项） | 165 | 开关的 YAML 生成机制、如何创建自定义开关 |
| fuzzy-pinyin（模糊音规则） | 119 | 模糊音如何编译进 prism、derive 机制 |
| auxiliary-code-config（辅助码配置） | 151 | 不同辅助码方案的原理对比、自定义辅助码表 |
| punctuation（标点符号映射） | 123 | halfShape/fullShape 完整定义、自定义标点映射 |

这一批只做**内容深化 + 必要的 UI 补充**（如 key-bindings 增加自定义按键入口），不涉及模块重构。

### 6.3 档位 C：中优先级（第 3 批）

高频使用 + 中等复杂度的 4 个模块：

| 模块 | 当前行数 | 关键深化点 |
|-----|---------|----------|
| schema-manager（输入方案管理） | 108 | schema 安装原理、依赖解析、多方案共存 |
| spelling-scheme（拼写方案） | 110 | 双拼映射表的定义方式、自定义拼写 |
| reverse-lookup（反查与筛选） | 117 | 反查引擎原理、自定义反查数据源 |
| dictionary（词典管理） | 126 | 词典编译流程、词频调整原理、词库合并策略 |

### 6.4 档位 D：低优先级（第 4 批）

功能简单、低频使用的 3 个模块：

| 模块 | 当前行数 | 处理方式 |
|-----|---------|---------|
| ascii-mode（中英文切换） | 123 | 补充第 3 层即可 |
| candidate-display（候选词显示） | 115 | 补充原理层，主要是参数调节 |
| comment-hints（注释与提示） | 119 | 补充原理层 |

### 6.5 档位 E：概念/引导文档（第 3 批同步进行）

不对应编辑器模块的独立文档，需要从"配置编辑器"视角改写：

| 文件 | 当前行数 | 升级方向 |
|-----|---------|---------|
| what-is-rime.mdx | 49 | 最短，信息量严重不足。扩充 RIME 整体架构、输入法引擎组件模型 |
| installation.mdx | 86 | 跨平台安装指南，增加每平台部署路径、日志排查 |
| first-deploy.mdx | 89 | 增加部署机制原理、失败排错 |
| config-structure.mdx | 102 | **基础文档**，大幅扩充 patch 语法、default/schema/build 三层关系 |
| double-pinyin-guide.mdx | 72 | 增加双拼历史、方案对比原理 |
| custom-dictionary.mdx | 114 | 增加词库格式规范、编译流程 |
| multi-device-sync.mdx | 133 | 增加不同平台的同步差异、冲突处理 |

---

## 7. 分批交付计划

### 7.1 第 1 批（本次实施范围）

**目标**：内容深度指南落地 + 渐进披露 UI 组件 + 标杆模块重构。

**交付物清单**：

**文档与规范**：
1. `docs/CONTENT_DEPTH_GUIDE.md` — 内容深度指南（从第 3 节抽出落地）

**MDX 组件**：
2. `src/components/shared/Details.tsx` — 可折叠进阶区组件
3. `src/components/shared/StepGuide.tsx` — 分步操作指南组件（同文件导出 Step）
4. `src/components/shared/YamlPreview.tsx` — YAML 配置预览组件
5. `src/components/shared/mdx-components.tsx` — 注册 3 个新组件

**类型与数据**：
6. `src/types/config.ts` — 新增 `CustomTrigger`、`LuaScript` 类型，扩展 `SpecialInputConfig`、`SchemaConfig`
7. `src/data/module-registry.ts` — 删除 `special-input`，合并到 `lua-extensions`
8. `src/data/lua-script-templates.ts` — Translator/Filter/Processor 的模板代码
9. `src/data/schemas-detail.json` — 迁移 schema 能力声明（确保 `special-input` → `lua-extensions`）

**模块组件重构**：
10. `src/features/editor/modules/LuaExtensions.tsx` — 重构为 3-Tab 容器
11. `src/features/editor/modules/SpecialInput.tsx` — 删除
12. `src/features/editor/modules/lua/SpecialInputTab.tsx` — Tab 1（预设 + 自定义触发器）
13. `src/features/editor/modules/lua/BuiltinEnhancementsTab.tsx` — Tab 2（从旧 LuaExtensions 迁移）
14. `src/features/editor/modules/lua/CustomScriptsTab.tsx` — Tab 3 容器
15. `src/features/editor/modules/lua/LuaCodeEditor.tsx` — CodeMirror 6 封装
16. `src/features/editor/modules/lua/CustomTriggerForm.tsx` — 自定义触发器对话框
17. `src/features/editor/modules/lua/CustomTriggerList.tsx` — 自定义触发器列表
18. `src/features/editor/modules/lua/LuaScriptList.tsx` — 脚本列表
19. `src/features/editor/modules/lua/LuaScriptYamlPreview.tsx` — 脚本注册 YAML 预览

**Store 与序列化**：
20. `src/stores/config-store.ts` — 新增 6 个 action（3 个 customTrigger + 3 个 luaScript）
21. `src/lib/yaml/` — 更新 YAML 生成/解析以处理 `customTriggers` 和 `luaScripts`

**教程内容**：
22. `src/content/lua-extensions.mdx` — 按深度指南完整重写，使用所有新组件作为范本
23. `src/content/special-input.mdx` — 删除（内容合并到上条）
24. 扫描其他 MDX 中 `./special-input` 链接并改为 `./lua-extensions`

**依赖**：
25. `package.json` — 新增 `codemirror`、`@codemirror/lang-lua`、`@codemirror/view`、`@codemirror/state`、`@codemirror/theme-one-dark`

**验收标准**：
- 所有现有编辑器功能无回归，`npm run build` 通过
- 用户能在 UI 中添加、编辑、删除自定义触发器
- 用户能在 UI 中创建、编辑、删除 Lua 脚本
- CodeMirror 编辑器正常显示 Lua 语法高亮
- 模板按钮可正确填充 Translator/Filter/Processor 骨架代码
- 修改触发器或脚本后，YAML 导出包含正确的 patch
- `lua-extensions.mdx` 教程符合深度指南所有要求
- 新 MDX 组件（Details / StepGuide / YamlPreview）在 docs 页面和编辑器 TutorialPanel 中都正常渲染
- 旧的 `special-input` 模块 ID 不再出现在 sidebar
- **打包体积增量 ≤ 200KB gzipped**（CodeMirror 6 基础包 + Lua 语法支持预计 ~150KB，留 50KB 余量）
- CodeMirror 使用 dynamic import 懒加载，进入「自定义脚本」Tab 前不应加载

### 7.2 第 2 批（后续）

档位 B 的 6 个模块按深度指南深化内容 + 少量 UI 补充。批次结束前回顾深度指南和 UI 组件是否需要调整。

### 7.3 第 3 批（后续）

档位 C 的 4 个编辑器模块 + 档位 E 的 7 个概念文档。

### 7.4 第 4 批（后续）

档位 D 的 3 个模块 + 整体内容一致性审核。

### 7.5 批次回顾机制

每批结束后进行一次回顾：
- 深度指南是否需要调整？
- UI 组件是否需要新增/优化？
- 用户反馈（如果有）是否揭示了新的内容缺口？

---

## 8. 风险与缓解

| 风险 | 可能性 | 影响 | 缓解 |
|-----|-------|-----|-----|
| CodeMirror 集成增加打包体积 | 高 | 中 | 使用 dynamic import 懒加载；只在进入 Tab 3 时加载 |
| Lua 脚本 YAML 序列化/反序列化逻辑复杂 | 中 | 高 | 先实现基础用例，复杂场景用 `preserved` 字段保留原始 YAML |
| 合并 `special-input` 和 `lua-extensions` 破坏现有用户数据 | 低 | 高 | `specialInput` 配置结构向后兼容；schema 能力声明提供迁移脚本 |
| 用户写出有问题的 Lua 脚本导致 RIME 部署失败 | 中 | 低 | 文档明确说明：编辑器不做 Lua 校验，依赖 RIME 部署时反馈；教程提供排错指南 |
| 教程深化工作量远超预期，批次计划延期 | 中 | 中 | 只明确第 1 批范围，后续批次按实际节奏推进，不承诺时间 |
| 深度指南在后续批次中被证明不适用 | 中 | 中 | 每批次结束回顾并调整指南 |

---

## 9. 未解决的问题

本设计有意留白的决策点，将在实施中具体确定：

- **Details 组件的视觉层级色**：浅灰/蓝/紫的具体 HEX 值，交给实施时与现有设计系统对齐
- **Lua 脚本文件名校验规则**：是否强制 snake_case？最大长度？暂用简单的字符白名单（字母、数字、下划线、连字符），后续按需收紧
- **Lua 脚本最大行数限制**：是否限制？初版不做限制，如出现滥用再加约束
- **YAML patch 合并时的冲突处理**：当用户自定义 trigger 与预设 trigger 使用相同触发码时的处理策略——初版给出 UI 警告，不阻止保存

---

## 10. 附录

### 10.1 项目当前状态数据

- 22 个 MDX 教程文件，总 2683 行，平均 ~130 行
- 15 个编辑器模块，分 4 组（basic / input / auxiliary / appearance）
- 其中 2 个模块（special-input、lua-extensions）本次合并
- 最短教程 `what-is-rime.mdx` 仅 49 行
- 最长教程 `candidate-settings.mdx` 245 行

### 10.2 关键文件路径速查

| 文件 | 作用 |
|-----|-----|
| `src/types/config.ts` | 所有配置类型定义（本次扩展） |
| `src/data/module-registry.ts` | 模块注册表（本次修改） |
| `src/data/special-trigger-definitions.ts` | 11 个预设触发器（保留） |
| `src/features/editor/modules/LuaExtensions.tsx` | 主 Lua 扩展模块（本次重构） |
| `src/features/editor/modules/SpecialInput.tsx` | 特殊输入模块（本次删除） |
| `src/components/shared/mdx-components.tsx` | MDX 组件映射（本次扩展） |
| `src/content/lua-extensions.mdx` | 教程内容（本次重写） |
| `src/stores/config-store.ts` | Zustand store（本次扩展） |
| `src/lib/yaml/` | YAML 序列化逻辑（本次扩展） |
