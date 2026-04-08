# 配置编辑器升级设计 — 对齐万象拼音 Pro

**日期**: 2026-04-08
**状态**: Draft
**参考**: 万象拼音 (https://github.com/amzxyz/rime_wanxiang)

## 概述

当前配置编辑器有 8 个模块，配置项简单（4 个开关、5 个按键绑定、2 项候选词设置），无法覆盖万象拼音 Pro 等现代方案的丰富配置面（13+ 开关、辅助码、反查、Lua 扩展等）。同时教程和编辑器分离，用户需要在 `/docs` 和 `/editor` 之间跳转。

本设计通过以下改造解决这两个问题：

1. **方案驱动的模块注册表** — 替换硬编码的静态模块列表，支持方案能力动态展示
2. **全面对齐万象配置面** — 从 8 模块扩展到 15 模块，覆盖辅助码、反查、特殊输入、Lua 扩展等
3. **教程侧边栏联动 + 沉浸模式** — 编辑器右侧实时显示教程，可切换为教程主导的沉浸模式

## 架构方案：方案驱动注册表（Schema-Driven Registry）

### 核心数据结构

```typescript
interface ModuleDefinition {
  id: string;                          // 唯一标识，如 'auxiliary-code'
  label: string;                       // 显示名称
  group: ModuleGroup;                  // 所属分组
  icon?: string;                       // 侧边栏图标
  component: React.LazyExoticComponent<any>; // 懒加载组件
  tutorialSlug?: string;               // 关联的 MDX 教程 slug
  applicability: SchemaApplicability;  // 方案兼容性
  getModifiedCount?: (project: RimeProject) => number;
}

type ModuleGroup =
  | 'basic'       // 基本设置
  | 'input'       // 输入行为
  | 'auxiliary'    // 辅助功能
  | 'appearance';  // 外观与显示

type SchemaApplicability =
  | { type: 'universal' }
  | { type: 'schemas'; ids: string[] }
  | { type: 'capability'; cap: string };
```

### SchemaInfo 扩展

```typescript
interface SchemaInfo {
  id: string;
  name: string;
  description: string;
  type: 'full_pinyin' | 'double_pinyin' | 'shape' | 'mixed';
  capabilities: string[];
  availableSpellingSchemes?: SpellingScheme[];
  availableAuxiliaryCodes?: AuxiliaryCodeScheme[];
  customSwitchNames?: string[];
}
```

万象拼音示例：

```typescript
{
  id: 'wanxiang',
  name: '万象拼音',
  description: '新一代拼音方案，支持直接辅助码',
  type: 'full_pinyin',
  capabilities: [
    'multi-spelling', 'auxiliary-code', 'reverse-lookup',
    'special-input', 'lua-extensions', 'super-comment'
  ],
  availableSpellingSchemes: ['full_pinyin', 'flypy', 'zrm', 'mspy', 'sogou', 'abc', 'ziguang'],
  availableAuxiliaryCodes: ['moqi', 'hexing', 'zrm', 'tiger', 'wubi', 'cangjie', 'simple_he', 'hanxin'],
  customSwitchNames: [
    'chinese_english', 'prediction', 'abbrev',
    'charset_filter', 'char_priority', 'super_tips'
  ],
}
```

### 侧边栏行为

- 根据当前主方案的 `capabilities` 过滤模块列表
- 不适用的模块默认隐藏
- 底部提供「查看所有模块...」入口（探索模式），展开后不可用模块显示 🔒 + 提示文字
- 每个分组标题右侧显示完成度（如 `2/4`）
- 每个模块旁显示已修改项数量徽标

## 模块清单（4 组 15 模块）

### 基本设置（universal）

| 模块 | 状态 | 说明 |
|------|------|------|
| 输入方案管理 | 现有 | 不变 |
| 候选词设置 | 扩充 | 新增 horizontal、enableCompletion、enableUserDict、coreWordLength、maxWordLength、maxHomophones、maxHomographs |
| 按键绑定 | 扩充 | 新增功能快捷键子区域（Tab/Ctrl+A/S/E/T/G/J/K、翻页键等） |
| 开关与杂项 | 扩充 | 从 4 个扩展到 13+ 个，按类别分组，支持多态开关（简繁 4 态、编码显示 3 态等） |

### 输入行为

| 模块 | 状态 | 适用性 | 说明 |
|------|------|--------|------|
| 模糊音规则 | 现有 | universal | 不变 |
| 拼写方案 | **新增** | capability: multi-spelling | 全拼/双拼选择、声调隔离（适用于支持多种拼写方案切换的方案如万象） |
| 辅助码配置 | **新增** | capability: auxiliary-code | 方案选择（8种）、引导方式、提示设置 |
| 反查与筛选 | **新增** | capability: reverse-lookup | 触发键、数据源、反查方式 |

### 辅助功能

| 模块 | 状态 | 适用性 | 说明 |
|------|------|--------|------|
| 标点符号映射 | 现有 | universal | 不变 |
| 词典管理 | 现有 | universal | 不变 |
| 特殊输入 | **新增** | capability: special-input | 日期/时间/计算器/Unicode 等触发器管理 |
| Lua 扩展 | **新增** | capability: lua-extensions | 超级注释/处理器/预测/快符/统计 配置 |

### 外观与显示

| 模块 | 状态 | 适用性 | 说明 |
|------|------|--------|------|
| 中英文切换 | 现有 | universal | 不变 |
| 候选词显示 | **新增** | universal | translator 中与显示相关的设置子集：spellingHints（拼音提示长度）、alwaysShowComments（始终显示注释）、候选格式模板 |
| 注释与提示 | **新增** | capability: super-comment | 注释模式、Tips 数据源、辅助码提示样式 |

## 类型系统扩展

### SchemaConfig 扩展

```typescript
interface SchemaConfig {
  schemaId: string;
  fuzzyRules: FuzzyRuleState[];
  switches?: SwitchItem[];
  punctuator?: PunctuatorConfig;
  // 新增
  translator?: TranslatorConfig;
  spellingScheme?: SpellingScheme;
  auxiliaryCode?: AuxiliaryCodeConfig;
  reverseLookup?: ReverseLookupConfig;
  specialInput?: SpecialInputConfig;
  luaExtensions?: LuaExtensionsConfig;
  displayConfig?: DisplayConfig;
}
```

### 新增类型

```typescript
interface TranslatorConfig {
  enableCompletion: boolean;
  enableUserDict: boolean;
  coreWordLength: number;
  maxWordLength: number;
  maxHomophones: number;
  maxHomographs: number;
  spellingHints: number;
  alwaysShowComments: boolean;
}

type SpellingScheme =
  | 'full_pinyin' | 'flypy' | 'zrm' | 'mspy'
  | 'sogou' | 'abc' | 'ziguang';

interface AuxiliaryCodeConfig {
  scheme: AuxiliaryCodeScheme;
  triggerMode: 'direct' | 'indirect' | 'backtick';
  hintEnabled: boolean;
  hintLength: number;
  splitHintEnabled: boolean;
}

type AuxiliaryCodeScheme =
  | 'moqi' | 'hexing' | 'zrm' | 'tiger'
  | 'wubi' | 'cangjie' | 'simple_he' | 'hanxin';

interface ReverseLookupConfig {
  triggerKey: string;
  dataSource: ('aux' | 'db')[];
  enabledMethods: ReverseLookupMethod[];
}

type ReverseLookupMethod =
  | 'two_part' | 'multi_part' | 'stroke'
  | 'tone' | 'auxiliary';

interface SpecialInputConfig {
  enabledTriggers: SpecialTrigger[];
}

interface SpecialTrigger {
  id: string;
  enabled: boolean;
  triggerCode: string;
}

interface LuaExtensionsConfig {
  superComment?: {
    candidateLength: number;
    correctorType: string;
  };
  superProcessor?: {
    backspaceLimit: boolean;
    segLoop: boolean;
    toneFallback: boolean;
    limitRepeated: string;
  };
  userPredict?: {
    maxCandidates: number;
    expiryDays: number;
    activationDays: number;
  };
  superReplacer?: {
    chain: boolean;
    delimiter: string;
  };
  inputStatistics?: {
    enabled: boolean;
  };
}

interface DisplayConfig {
  horizontal: boolean;
  commentMode: 'off' | 'toned' | 'toneless';
  encodingDisplay: 'raw' | 'toned' | 'toneless';
}
```

### SwitchItem 多态支持

```typescript
type SwitchItem = SimpleSwitchItem | MultiStateSwitchItem;

interface SimpleSwitchItem {
  name: string;
  reset: number;
  states: [string, string];
}

interface MultiStateSwitchItem {
  options: string[];
  reset: number;
  states: string[];
}
```

### KeyBinding 扩展

```typescript
interface KeyBinding {
  when: string;
  accept: string;
  send: string;
  toggle?: string;
  description?: string;
  category?: 'switch' | 'navigation' | 'editing' | 'function';
}
```

### DefaultConfig 扩展

```typescript
interface DefaultConfig {
  schemaList: SchemaListItem[];
  pageSize: number;
  selectKeys: string;
  asciiComposer: AsciiComposerConfig;
  keyBinder: KeyBinderConfig;
  horizontal?: boolean;
}
```

## 布局设计

### 面板模式（默认）

三栏布局：

```
┌─────────────┬────────────────────────────┬──────────────────┐
│  侧边栏      │  配置区域                    │  教程面板         │
│  (分组导航)   │  (表单/YAML Tab)            │  (MDX 渲染)      │
│             │                            │                  │
│  基本设置     │  ┌─ 表单模式 ─┬─ YAML ─┐    │  📖 输入方案管理  │
│  > 方案管理 1 │  │                     │    │                │
│    候选词   2 │  │  [方案列表卡片]       │    │  输入方案是 Rime │
│    按键绑定   │  │  [添加方案]          │    │  的核心概念...   │
│    开关      │  │                     │    │                │
│             │  └─────────────────────┘    │  ```yaml        │
│  输入行为 2/4│                            │  patch:         │
│    模糊音    │                            │    schema_list:  │
│    拼写方案   │                            │  ```            │
│    辅助码    │                            │                │
│    反查      │                            │  💡 重新部署后... │
│             │                            │                │
│  ──────────  │                            │  [沉浸模式 →]    │
│  📖 所有模块  │                            │                │
└─────────────┴────────────────────────────┴──────────────────┘
```

- 教程面板可通过按钮收起，收起后配置区域占满右侧
- 面板自动跟随当前活跃模块加载对应 MDX 教程

### 沉浸模式

教程主导布局，配置组件嵌入文章流：

```
┌─────────────┬──────────────────────────────────────────────┐
│  侧边栏      │  [← 返回面板模式]                              │
│  (同左)      │                                              │
│             │  # 输入方案管理                                 │
│             │                                              │
│             │  输入方案（Schema）是 Rime 的核心概念...          │
│             │                                              │
│             │  ## 配置项说明                                  │
│             │                                              │
│             │  ┌─────── ⚡ 在此配置 ──────────────────┐      │
│             │  │                                     │      │
│             │  │  [方案列表卡片]                       │      │
│             │  │  [添加方案下拉框]                     │      │
│             │  │                                     │      │
│             │  └─────────────────────────────────────┘      │
│             │                                              │
│             │  :::tip                                       │
│             │  重新部署后才会生效。                            │
│             │  :::                                          │
│             │                                              │
│             │  ## 主流方案介绍                                │
│             │  ...                                          │
└─────────────┴──────────────────────────────────────────────┘
```

## 教程集成架构

### ConfigSlot 组件

在 MDX 中标记配置组件插入位置，根据渲染上下文切换行为：

```tsx
function ConfigSlot({ module }: { module: string }) {
  const { isImmersive } = useEditorContext();

  if (isImmersive) {
    const ModuleComponent = MODULE_REGISTRY[module].component;
    return (
      <div className="config-slot-embedded">
        <ModuleComponent />
      </div>
    );
  }

  return <GoToConfigButton module={module} />;
}
```

### MDX 迁移

现有 MDX 末尾的 `<GoToConfigButton>` 替换为 `<ConfigSlot>`：

```diff
- <GoToConfigButton module="schema-manager" label="在编辑器中配置输入方案" />
+ <ConfigSlot module="schema-manager" />
```

### 滚动联动（面板模式）

- 配置表单区域用 `data-section` 属性标记段落
- 教程面板中对应标题有匹配的 `id`
- `IntersectionObserver` 监听表单区域可见性，驱动教程面板滚动

### 编辑器 UI 状态

```typescript
interface EditorUIState {
  viewMode: 'panel' | 'immersive';
  tutorialCollapsed: boolean;
  activeSection?: string;
}
```

### 路由

- `/editor` → 面板模式（默认）
- `/editor?mode=immersive` → 沉浸模式
- `/editor?mode=immersive&module=auxiliary-code` → 沉浸模式直达指定模块
- `/docs` 保留，增加「在编辑器中打开」入口

## YAML 序列化与兼容性

### 新增配置的 YAML 映射

主要影响 `<schema>.custom.yaml`，使用 Rime 标准的 `patch:` + 路径语法：

```yaml
patch:
  translator/enable_completion: true
  translator/enable_user_dict: false
  translator/core_word_length: 4
  super_comment/candidate_length: 2
  user_predict/max_candidates: 10
```

### 多态开关序列化

```yaml
switches:
  # 二态开关
  - name: emoji
    reset: 1
    states: [表情关, 表情开]
  # 多态开关（用 options 代替 name）
  - options: [s2s, s2t, s2hk, s2tw]
    reset: 0
    states: [简体, 通繁, 港繁, 臺繁]
```

### 兼容性策略

- **向后兼容**：所有新增字段 optional，导入旧配置不会 break
- **增量导出**：只序列化用户修改过的字段（与当前 diff 策略一致）
- **preserved 机制**：编辑器不认识的 YAML 键保存到 `preserved` 字典，导出时原样写回
- **URL 分享**：现有 LZ 压缩机制无需改动，新字段自动包含

### 解析器扩展

- 解析 `translator/xxx` 路径到 `TranslatorConfig`
- 解析多态 `switches`（`options` 字段 vs `name` 字段）
- 解析 Lua 扩展参数路径
- 未识别字段 fallback 到 `preserved`

### 模块 YAML 提取

每个模块的 YAML Tab 只展示该模块相关的配置片段，通过 `MODULE_YAML_EXTRACTORS` 映射表实现。
