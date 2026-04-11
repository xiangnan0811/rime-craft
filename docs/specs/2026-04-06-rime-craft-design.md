# Rime Craft — Design Spec

**Date**: 2026-04-06
**Status**: Draft
**Author**: weibo + Claude

> **状态说明（2026-04-11）**
>
> 本文档是 2026-04-06 的原始产品设计草案，用于保留当时的范围设想，不代表当前 live product contract。
> 当前正式产品契约请以 [docs/PRODUCT_CONTRACT.md](../PRODUCT_CONTRACT.md) 为准；批量审查后的分期路线与后续收敛请参见 [docs/superpowers/specs/2026-04-11-post-batch-roadmap-design.md](../superpowers/specs/2026-04-11-post-batch-roadmap-design.md)。

---

## 1. 项目概述

### 定位

面向所有 Rime 用户的 Web 可视化配置编辑器 + 交互式全面教程站。

### 目标用户

- **新手**：刚接触 Rime，需要引导式流程和教学内容
- **有经验的用户**：已在使用 Rime，想更方便地微调配置，减少手动编辑 YAML

### 支持平台

全平台：鼠须管（macOS）、小狼毫（Windows）、ibus-rime / fcitx-rime（Linux）、同文（Android）、仓输入法（iOS）

### 核心功能

1. 可视化配置编辑器（表单模式 + YAML 模式双向同步）
2. 全面 Rime 教程站（从安装到进阶）
3. 主题工作室（候选框外观可视化编辑 + 实时预览）
4. 实时输入模拟器（基于配置规则的行为模拟）
5. 方案对比工具（主流输入方案横向对比）
6. 配置导入/导出与社区分享

---

## 2. 技术架构

### 技术栈

| 层级 | 选型 |
|------|------|
| 框架 | Vite + React 18 + TypeScript |
| 路由 | React Router v7 |
| 状态管理 | Zustand |
| UI 组件库 | Shadcn/ui（Radix UI） |
| 样式 | Tailwind CSS |
| 教程内容 | MDX |
| YAML 处理 | yaml（eemeli/yaml），支持 CST 解析与注释保留 |
| 代码编辑器 | CodeMirror 6（轻量 ~200KB，YAML 高亮足够用） |
| URL 压缩 | lz-string |
| 部署 | GitHub Pages / Vercel / Cloudflare Pages |

### 架构模式

纯前端单体 SPA，零后端依赖。所有配置数据存储在浏览器端（内存 + localStorage），不涉及服务端存储。

### 核心数据流

```
用户导入配置 / 选择预设
       ↓
  解析为内部数据模型 (TypeScript 类型)
       ↓
  可视化编辑器 ⇄ YAML 原始编辑器（双向同步）
       ↓
  实时预览模拟器
       ↓
  导出为 Rime 配置文件包（zip）
```

### 页面结构

| 页面 | 路由 | 说明 |
|------|------|------|
| 首页 | `/` | 项目介绍、快速开始入口 |
| 配置编辑器 | `/editor` | 核心功能，可视化编辑各项配置 |
| 教程中心 | `/docs/*` | 从零开始的 Rime 学习路径 |
| 主题工作室 | `/theme` | 可视化编辑候选框外观 |
| 方案对比 | `/compare` | 不同输入方案的特点对比 |

### 数据模型

编辑器的核心数据结构，所有 UI 组件和 YAML 序列化围绕此模型工作：

```typescript
/** 项目顶层状态 */
interface RimeProject {
  targetPlatform: 'macos' | 'windows' | 'linux' | 'android' | 'ios';
  defaultConfig: DefaultConfig;
  platformConfig: PlatformConfig;
  schemaConfigs: Record<string, SchemaConfig>;
  customPhrases: CustomPhrase[];
  /** 编辑器不识别的字段，导出时原样写回 */
  _preserved: PreservedNodes;
}

/** default.custom.yaml → patch 层 */
interface DefaultConfig {
  schemaList: SchemaListItem[];
  pageSize: number;
  selectKeys: string;
  keyBinder: KeyBinderConfig;
  asciiComposer: AsciiComposerConfig;
  switcher: SwitcherConfig;
}

/** squirrel.custom.yaml / weasel.custom.yaml → patch 层 */
interface PlatformConfig {
  platform: 'macos' | 'windows';
  style: ThemeStyle;
  appOptions: Record<string, AppOption>;
}

/** <schema>.custom.yaml → patch 层 */
interface SchemaConfig {
  schemaId: string;
  speller?: SpellerConfig;       // 模糊音规则
  punctuator?: PunctuatorConfig; // 标点映射
  switches?: SwitchConfig[];     // 开关（emoji、简繁等）
}

/** 主题样式（编辑器内部用标准 HEX，导出时转 Rime 的 0xBBGGRR） */
interface ThemeStyle {
  colorScheme: string;
  horizontal: boolean;
  fontFace: string;
  fontSize: number;
  cornerRadius: number;
  borderWidth: number;
  colors: {
    backgroundColor: string;     // "#RRGGBB"
    borderColor: string;
    textColor: string;
    hilitedTextColor: string;
    hilitedBackColor: string;
    candidateTextColor: string;
    commentTextColor: string;
    labelColor: string;
  };
}

/** 自定义短语（custom_phrase.txt） */
interface CustomPhrase {
  text: string;      // 词条
  code: string;      // 编码
  weight: number;    // 权重
}

/** 保留用户原始配置中编辑器不识别的部分 */
interface PreservedNodes {
  /** 文件路径 → YAML CST 节点，导出时合并回去 */
  byFile: Record<string, yaml.Document.Parsed>;
}
```

**设计原则**：

- 每个 `interface` 对应一个 Rime 配置文件的 `patch` 层
- 只包含编辑器支持编辑的字段，其余通过 `PreservedNodes` 保留
- 颜色统一用标准 HEX（`#RRGGBB`），仅在导出时转换为 Rime 的 `0xBBGGRR`

### YAML 解析策略

选用 `yaml`（eemeli/yaml）而非 `js-yaml`，原因：

| 能力 | js-yaml | yaml (eemeli/yaml) |
|------|---------|-------------------|
| 注释保留 | ❌ | ✅ CST 层解析 |
| 格式保留（空行、缩进风格） | ❌ | ✅ |
| Round-trip 编辑 | ❌ | ✅ 修改后序列化保持原格式 |
| TypeScript 类型 | 弱 | ✅ 完整类型定义 |

#### 解析流程

```
.custom.yaml 文件
       ↓
  CST 解析（保留注释、格式）
       ↓
  AST 提取值 → 映射到 TypeScript 数据模型
       ↓
  表单模式绑定 ⇄ YAML 编辑器绑定
       ↓
  用户编辑 → 更新数据模型 → patch 回 CST → 序列化输出
```

#### 关键约束

- **解析容错**：用户 YAML 语法错误时不崩溃，标记错误位置，保留上次合法状态
- **patch 语义**：正确处理 Rime 的 `/` 路径语法（如 `"style/color_scheme": value`）
- **编码处理**：支持 UTF-8 with BOM（Windows 用户常见）

### 项目目录结构

```
rime-craft/
├── public/
│   └── presets/                  # 预设配置 JSON
├── src/
│   ├── app/                     # 路由页面
│   │   ├── home/
│   │   ├── editor/
│   │   ├── theme/
│   │   ├── docs/
│   │   └── compare/
│   ├── components/              # 通用组件
│   │   ├── ui/                  # shadcn/ui
│   │   └── shared/              # 业务通用（SimulatorPanel 等）
│   ├── features/                # 功能模块
│   │   ├── editor/              # 配置编辑器
│   │   │   ├── modules/         # 8 个编辑模块
│   │   │   ├── form-mode/
│   │   │   └── yaml-mode/
│   │   ├── theme/               # 主题工作室
│   │   ├── simulator/           # 输入模拟器
│   │   ├── compare/             # 方案对比
│   │   └── share/               # 导入/导出/分享
│   ├── lib/                     # 核心逻辑（无 UI 依赖）
│   │   ├── yaml/                # YAML 解析/序列化、CST 操作
│   │   ├── config/              # 配置合并、diff、patch
│   │   ├── color/               # HEX ↔ 0xBBGGRR 转换
│   │   └── compress/            # lz-string 压缩
│   ├── stores/                  # Zustand stores
│   ├── types/                   # TypeScript 类型定义
│   ├── data/                    # 静态数据（方案信息、预设主题、双拼映射表）
│   └── content/                 # MDX 教程内容
│       ├── getting-started/
│       ├── config-guide/
│       ├── advanced/
│       └── schemas/
├── gallery/                     # 社区配置展示（JSON + 元数据）
└── scripts/                     # 构建辅助脚本
```

---

## 3. 配置编辑器

### 3.1 布局方案（三种保留，实现时取舍）

**方案 A — 左导航 + 右编辑**：经典设置页面布局，左侧树形导航快速跳转，右侧表单编辑。每个配置项旁有"查看教程"链接。

**方案 B — 三栏布局**：导航 + 编辑 + 实时预览。编辑时右侧实时看到效果，信息密度高，小屏可能拥挤。

**方案 C — 步骤向导 + 自由编辑**：新手走向导流程一步步配置（选平台→选方案→基础配置→外观→导出），老用户可跳过直接进入自由编辑界面。

可组合使用：C 的向导作为新手入口，A 的自由编辑作为主界面，B 的预览作为可收起的侧边栏。

### 3.2 配置文件映射

| Rime 配置文件 | 适用平台 | 编辑器对应模块 |
|---|---|---|
| `default.custom.yaml` | 全平台通用 | 方案管理、候选词、按键绑定、中英切换、开关设置 |
| `squirrel.custom.yaml` | macOS | 主题外观、应用级配置 |
| `weasel.custom.yaml` | Windows | 主题外观、应用级配置 |
| `<schema>.custom.yaml` | 取决于方案 | 模糊音、辅助码、标点符号、词典等方案级配置 |
| `custom_phrase.txt` | 全平台 | 自定义短语管理 |

### 3.3 编辑模块（8 个）

**1. 输入方案管理**
- 方案列表的启用/禁用/排序
- 常见方案介绍（雾凇拼音、万象拼音、自然码等）
- 双拼方案选择（小鹤、自然码、微软、搜狗等）

**2. 候选词设置**
- 候选词数量（page_size）
- 选词按键（1-9 / a-z 等）
- 候选词排序规则

**3. 按键绑定**
- Shift/Ctrl/Caps Lock 行为（中英切换方式）
- 翻页按键
- 特殊功能键映射
- 可视化按键映射表

**4. 模糊音规则**
- 声母模糊（z/zh, c/ch, s/sh, l/n, f/h 等）
- 韵母模糊（an/ang, en/eng, in/ing 等）
- 勾选式开关，每条规则配示例说明

**5. 标点符号映射**
- 全角/半角切换
- 每个标点的映射规则编辑
- 特殊符号快捷输入

**6. 词典管理**
- 自定义短语编辑器（custom_phrase.txt）
- 批量导入/导出
- 词条搜索和编辑

**7. 中英文切换与应用设置**
- 默认中/英文模式
- 应用级默认语言（如 Terminal/VSCode 默认英文）
- 应用列表管理（通过 bundle identifier）

**8. 开关与杂项**
- Emoji 开关
- 简繁转换（简/通繁/港繁/台繁）
- 字符集过滤
- 输入预测开关
- 辅助码提示

### 3.4 编辑模式

每个模块提供两种编辑模式，用户可切换：
- **表单模式**（默认）— 可视化表单，每项有说明和交互控件
- **YAML 模式** — CodeMirror 6 直接编辑对应的 YAML 片段，实时语法校验

两种模式双向同步 — 表单改动实时反映到 YAML，反之亦然。

#### 双向同步技术方案

同步以内部数据模型（TypeScript 类型）为中心，两种模式各自与模型保持单向绑定：

```
表单 UI ──写入──→ 内部模型 ──序列化──→ YAML 文本
YAML 文本 ──解析──→ 内部模型 ──渲染──→ 表单 UI
```

**关键处理**：

1. **YAML → 模型的容错**：用户在 YAML 模式输入不合法内容时，不立即覆盖模型；仅在语法校验通过后同步，校验失败时在编辑器内显示行内错误提示
2. **未知字段保留**：YAML 中编辑器不认识的字段存入 `_preserved`，表单不展示但序列化时原样写回
3. **注释保留**：使用 `yaml` 库的 CST 层解析，修改时仅 patch 变更节点，用户写的注释和空行格式不丢失
4. **防抖策略**：YAML 编辑触发解析使用 300ms 防抖；表单编辑即时同步到 YAML（无感知延迟）
5. **冲突避免**：同一时刻只有一个模式是"编辑源"，切换模式时以当前模式的内容为准

### 3.5 配置合并策略

#### Rime patch 语义

Rime 的 `.custom.yaml` 文件通过 `patch` 机制覆盖默认配置，编辑器需正确处理以下语义：

- `key: value` — 替换整个键值
- `"key/subkey": value` — 用 `/` 路径定位嵌套字段，不影响同级其他字段
- `"key/+": [items]` — 追加列表项（`__append` 语义）
- `"key/=": [items]` — 替换整个列表

#### 编辑器处理流程

用户上传已有配置后：
1. 解析所有 `.custom.yaml` 文件，提取 `patch` 内容
2. 加载方案默认配置作为基准，应用 patch 得到完整生效配置
3. 与默认值 diff，在编辑器中标记"已修改"项（视觉区分）
4. 用户编辑后，只生成 `patch` 层的变更（不覆盖用户未触及的配置）
5. 识别不出的配置项保留原样，导出时原样写回（不丢失用户的自定义配置）
6. 导出时保持 Rime 的 custom 文件分层结构

#### 冲突处理

- 同一字段在多个文件中被修改时，按 Rime 加载顺序（default → schema → custom）确定优先级
- 编辑器中用视觉标记提示"此项在多处配置中出现"，避免用户困惑

### 3.6 预设方案

提供多种开箱即用的预设配置组合：
- **极简拼音**：默认全拼，最少配置
- **双拼快手**：小鹤双拼 + 常用模糊音
- **万象拼音推荐**：万象拼音 PRO + 直接辅助码 + 推荐主题
- **五笔经典**：五笔86标准配置
- 用户可基于预设修改，预设仅作为起点

---

## 4. 主题工作室

### 4.1 实时预览区

- 页面中央展示模拟的候选框，所有修改即时反映
- 可切换横排/竖排模式
- 可输入自定义预览文本（默认："你好世界 nihao"）
- 支持切换亮色/暗色系统主题预览
- 可切换 macOS 风格和 Windows 风格外观模拟

### 4.2 可编辑属性

| 分类 | 属性 |
|------|------|
| 颜色 | 背景色、边框色、候选文字色、选中项高亮色、拼音串颜色、标签颜色、注释颜色 |
| 字体 | 字体族、字号、行间距、候选标签字号 |
| 布局 | 横排/竖排、候选间距、内边距、圆角、边框宽度 |
| 效果 | 背景模糊（macOS）、阴影、透明度 |

### 4.3 编辑方式

- 拾色器选择颜色（支持十六进制输入）
- 滑块调节数值（字号、间距、圆角等）
- 下拉选择字体（预设常见中文字体列表）

### 4.4 颜色格式转换

- Rime 使用 `0xBBGGRR` 格式（BGR 而非 RGB）
- 编辑器内部使用标准 HEX/RGB，导出时自动转换
- YAML 模式中也显示转换后的真实颜色预览

### 4.5 预设主题

- 内置 10+ 精选主题（默认、Material、Nord、Dracula、Solarized、macOS 原生风格等）
- 用户可基于预设修改，也可从零创建
- 兼容导入润笔 / RIME 西米的主题格式

### 4.6 平台差异处理

- macOS（squirrel.yaml）和 Windows（weasel.yaml）的主题配置格式不同
- 编辑器统一编辑，导出时根据选择的目标平台生成对应格式

---

## 5. 实时预览 / 输入模拟器

### 5.1 模拟能力

| 行为 | 依据的配置 |
|------|-----------|
| 拼音串展示 | 双拼方案映射表 |
| 候选词数量和布局 | page_size、横排/竖排 |
| 选词按键 | 选词键配置 |
| 翻页操作 | 翻页键配置 |
| 模糊音效果 | 输入 `si` 同时匹配 `shi` 的结果 |
| 标点输出 | 标点映射表 |
| 中英切换 | Shift/Caps 行为 |
| 候选框外观 | 主题工作室的样式 |

### 5.2 模拟器边界

- **能做到**：按键映射、候选框样式、模糊音匹配演示、标点转换、双拼拆解展示
- **做不到**：真实的词频排序、语言模型预测、用户词库学习（依赖 librime 引擎，纯前端无法实现）
- **处理方式**：候选词使用内置的常用词示例库（可从雾凇拼音等开源词库采样），标注"实际候选词由 Rime 引擎决定，此处仅为演示"
- **高准确度部分**：双拼键位映射、标点映射、模糊音规则匹配是确定性逻辑，可做到 100% 准确模拟，UI 上可着重标注

### 5.3 出现位置

- 配置编辑器中：可收起的右侧/底部面板
- 主题工作室中：中央预览区的一部分
- 教程页面中：嵌入在相关教程段落中作为交互式演示

---

## 6. 教程中心

### 6.1 内容结构（四层）

**第一层：入门指南**
- Rime 是什么，为什么选择 Rime
- 各平台安装教程（鼠须管/小狼毫/ibus-rime/fcitx-rime/同文/仓）
- 第一次部署和基本使用
- 配置文件在哪里、是什么结构

**第二层：配置详解**（与编辑器 8 个模块一一对应）
- 每篇包含：概念解释 → 配置项逐条说明 → 常见搭配 → 实际效果演示

**第三层：进阶技巧**
- 双拼方案原理与选择指南
- 辅助码系统详解（直接辅助码、引导辅助码）
- 自定义词库的制作和维护
- Lua 脚本扩展入门
- 多设备配置同步方案

**第四层：方案专题**
- 主流输入方案深度解析（雾凇拼音、万象拼音、小鹤音形等）
- 从其他输入法迁移指南（搜狗→Rime、微信输入法→Rime 等）

### 6.2 教程与编辑器联动

**编辑器 → 教程**：
- 每个配置项旁有 `📖 了解更多` 链接
- 点击后在右侧抽屉或新 tab 打开对应教程段落（不离开编辑器页面，不丢失编辑状态）
- 教程中高亮当前正在编辑的配置项

**教程 → 编辑器**：
- 教程中的配置项示例带有 `🔧 去配置` 按钮
- 点击后跳转到编辑器对应模块，自动定位到该配置项
- 教程中嵌入交互式演示（使用模拟器组件），用户可以直接在教程中体验效果

### 6.3 内容格式

使用 MDX，在 Markdown 中嵌入 React 交互组件：

```mdx
## 模糊音配置详解

> 什么是模糊音？模糊音是指将发音相近的声母或韵母视为相同...

<FuzzyPinyinDemo initial="si" />
<GoToConfig module="fuzzy" field="z_zh" />
```

---

## 7. 方案对比工具

### 7.1 对比维度

| 维度 | 说明 |
|------|------|
| 基本信息 | 方案名称、作者/维护者、最后更新时间、GitHub 星标数 |
| 输入方式 | 全拼/双拼/形码/音形混合 |
| 词库规模 | 词条数量、词库来源 |
| 智能程度 | 是否有语言模型、整句输入能力、自学习 |
| 辅助码 | 是否支持、支持哪些辅助码系统 |
| 扩展功能 | Emoji、符号输入、计算器、日期时间、反查等 |
| 平台支持 | 哪些平台可用 |
| 上手难度 | 安装复杂度、配置复杂度、学习曲线评级 |

### 7.2 交互方式

- 用户选择 2-4 个方案进行并排对比
- 表格形式展示，差异项高亮
- 每个方案配简短推荐语和适用人群描述
- "使用这个方案"按钮，跳转到编辑器并自动加载该方案的预设配置

### 7.3 内置方案数据

初期手工维护 10-15 个主流方案的数据，以 JSON 文件存储，通过 GitHub PR 接受社区补充。

方案列表：雾凇拼音、万象拼音（标准/PRO）、小鹤音形、自然码、微软双拼、搜狗双拼、地球拼音、五笔86/98/06、仓颉、郑码等。

---

## 8. 配置导入/导出与社区分享

### 8.1 导入方式（三种）

- **上传压缩包**：整个 Rime 用户目录打包（zip），系统自动识别并解析所有配置文件
- **逐个上传文件**：拖拽或选择单个 `.yaml` / `.txt` 文件
- **粘贴 YAML**：直接粘贴内容到编辑器

导入后展示摘要："识别到 N 项自定义配置，N 个方案文件，N 条自定义短语"

### 8.2 导出

根据用户选择的目标平台生成对应配置文件集合，打包为 zip。只生成 `.custom.yaml`（补丁文件），不覆盖方案主文件。

导出包结构：
```
rime-config/
├── default.custom.yaml
├── squirrel.custom.yaml      # macOS 用户
├── weasel.custom.yaml        # Windows 用户
├── <schema>.custom.yaml
└── custom_phrase.txt
```

### 8.3 社区分享（纯前端方案）

**URL 分享**：配置序列化为 lz-string 压缩后的 URL 参数。
- 限制：仅适合分享**单模块配置片段**（如模糊音规则、主题配色）
- URL 长度控制在 2000 字符以内（兼容所有浏览器和社交平台转发）
- 完整配置请使用文件分享或 Gist

**文件分享**：导出为 `.json` 格式的配置快照文件，他人在网站上导入即可加载。

**GitHub Gist 集成**（可选功能）：
- 导出为 Gist：用户提供 GitHub Personal Access Token（仅需 `gist` scope 最小权限）
- 导入公开 Gist：通过 URL 直接导入，无需认证
- 版本管理：利用 Gist 版本历史追踪配置变更
- **安全策略**：Token 仅存于会话内存（`sessionStorage`），页面关闭即清除；明确提示用户使用 Fine-grained PAT 并限制为只读/写 Gist 权限
- 远期可考虑 GitHub OAuth App 方式替代手动 Token

**配置展示画廊**：项目仓库 `gallery/` 目录收录社区贡献的优秀配置方案，通过 GitHub PR 提交，构建时自动生成画廊页面，用户可一键导入。

---

## 9. 非功能需求

### 性能

- 首屏加载 < 3s（教程内容和编辑器模块 lazy loading）
- 配置解析/生成 < 500ms
- 编辑器双向同步延迟 < 100ms

### 国际化

- 初期仅中文界面（目标用户群体以中文用户为主）
- 架构上预留 i18n 能力，后续可扩展英文/日文

### 浏览器兼容

- Chrome/Edge 90+、Firefox 90+、Safari 15+
- 响应式布局，支持桌面和平板
- 移动端：Phase 1 优先支持教程阅读；表单模式在大屏手机/平板上可用，架构上不排除移动端编辑能力

### 可访问性

- 键盘导航支持
- 适当的 ARIA 标签
- 色彩对比度符合 WCAG AA

---

## 10. 竞品对比与差异化

| 现有工具 | 覆盖范围 | 本项目差异化 |
|---------|---------|-------------|
| 润笔 Rime Soak | 主题/外观 | 全配置覆盖 + 教程 + 模拟器 |
| RIME 西米 | macOS 配色 | 全平台 + 全配置 |
| RimeControl | Windows 基础设置 | 全平台 Web + 教程联动 |
| 中州韵助手 | 桌面应用，较全 | Web 版，无需安装，教程集成 |

核心差异化：**全平台 Web + 完整配置覆盖 + 教程深度联动 + 输入模拟器 + 社区分享**，目前市面上没有同时具备这些能力的工具。

---

## 11. 分阶段实施建议

项目规模较大，建议分阶段推进：

**Phase 1 — MVP（核心配置编辑 + 导入导出）**

*目标：用户能导入已有配置、可视化编辑高频项、导出可用的配置文件包。*

1. 项目脚手架（Vite + React + TypeScript + Tailwind + Shadcn/ui）
2. **数据模型定义与 YAML 解析/序列化**（技术验证先行：用真实 Rime 配置文件跑通 parse → edit → serialize round-trip）
3. 5 个高频编辑模块的表单模式：
   - 输入方案管理、候选词设置、按键绑定、模糊音规则、中英文切换与应用设置
4. 配置导入（上传文件 / 粘贴 YAML）与导出（zip 下载）
5. 预设方案（3 个：极简拼音、双拼快手、雾凇拼音推荐）
6. 基础路由、首页、候选框静态预览（不需要完整主题工作室）

**Phase 2 — 编辑器完善 + 教程**
- 剩余 3 个编辑模块（标点符号映射、词典管理、开关与杂项）
- CodeMirror YAML 编辑模式与表单双向同步
- MDX 教程内容（入门指南 + 配置详解，与编辑器模块一一对应）
- 编辑器 ↔ 教程双向联动
- 配置合并策略完善（diff 标记、冲突提示）
- 更多预设方案

**Phase 3 — 主题工作室 + 模拟器**
- 可视化主题编辑器（拾色器、滑块、字体选择）
- 候选框实时预览（横排/竖排、亮色/暗色）
- HEX ↔ 0xBBGGRR 自动转换
- 预设主题库（10+ 主题）
- 平台差异导出（squirrel / weasel）
- 输入模拟器
- 进阶教程内容

**Phase 4 — 社区与增强**
- 方案对比工具
- URL 分享（限单模块配置片段）/ JSON 文件分享
- GitHub Gist 集成（可选）
- 配置展示画廊
- 步骤向导（新手引导入口）
