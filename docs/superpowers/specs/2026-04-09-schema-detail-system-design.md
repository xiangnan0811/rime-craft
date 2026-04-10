# Schema Detail System Design

> 为每个输入方案提供全面的详情页面，增强现有 UI 的方案信息展示，帮助新手和进阶用户深入了解各方案。

## 背景与动机

当前的方案信息展示过于简略：
- 向导页卡片只有名称 + 类型标签 + 一句话描述
- 编辑器方案管理下拉仅显示名称
- 方案对比页缺少外部链接和社区信息

新手用户无法从简短的信息中有效理解各方案的差异和特点。作为教程+配置项目，需要提供更完整的方案介绍，包括官网链接、仓库地址、键位图、学习资源等。

## 设计决策

| 决策项 | 选择 | 理由 |
|--------|------|------|
| 改进范围 | 全部三处统一改进（向导页、方案管理、对比页） | 保持信息一致性 |
| 信息维度 | 全面详情（链接、键位图、截图、口碑、学习资源等） | 作为教程项目不应过于简略 |
| 展示方式 | 独立详情页 `/schema/:id` | 信息量大，独立页面空间充足 |
| 键位图实现 | React 组件动态渲染 | 可交互、可高亮、数据驱动 |
| 数据维护 | JSON 数据文件 | 单一数据源、非开发者可贡献、可校验 |
| 对比页关系 | 保留对比页，详情页是补充 | 对比做横向比较，详情做纵向深入，互相链接 |

## 架构概览

```
schemas-detail.json (单一数据源)
       │
       ▼
  SchemaDetail type (统一 TS 类型)
       │
       ├── SchemaStep.tsx        (向导页 - 读取基础字段 + links)
       ├── SchemaManager.tsx     (方案管理 - 读取基础字段 + links)
       ├── SchemaCompare.tsx     (对比页 - 读取 compare 字段 + links)
       └── SchemaDetailPage.tsx  (详情页 - 读取全部字段)
```

现有的 `schema-registry.ts` 和 `schema-compare-data.ts` 改为从 JSON 派生，保持导出接口向后兼容。

## 1. 数据层

### 1.1 JSON 数据文件

文件路径：`src/data/schemas-detail.json`

每个方案的完整数据结构：

```jsonc
{
  "schemas": [
    {
      // === 基础信息 ===
      "id": "rime_ice",
      "name": "雾凇拼音",
      "type": "full_pinyin",                    // full_pinyin | double_pinyin | shape | mixed
      "description": "功能齐全的全拼方案...",      // 短描述（卡片用）
      "introduction": "雾凇拼音是目前社区最活跃的...", // 详细介绍（详情页用，2-3段，段落间用 \n\n 分隔）
      "author": "Dvel",

      // === 外部链接 ===
      "links": {
        "official": "https://dvel.me/posts/rime-ice/",
        "repository": "https://github.com/iDvel/rime-ice",
        "documentation": "https://dvel.me/posts/rime-ice/",
        "community": [
          { "label": "QQ 群", "url": "https://example.com/qq" },
          { "label": "Telegram", "url": "https://t.me/example" }
        ]
      },

      // === 对比维度 ===
      "compare": {
        "dictSize": "200万+",
        "smartLevel": "高",
        "auxiliaryCode": "不支持",
        "features": ["Emoji", "符号输入", "反查", "日期时间", "计算器", "Lua 扩展"],
        "platforms": ["macOS", "Windows", "Linux", "Android", "iOS"],
        "difficulty": "简单",
        "recommendation": "功能最全的全拼方案，新手首选"
      },

      // === 可视化内容 ===
      "visuals": {
        "screenshots": ["main.png", "emoji.png"],
        "keyboardLayout": null   // 全拼方案不需要键位图
      },

      // === 社区与维护 ===
      "community": {
        "updateFrequency": "活跃（月更）",
        "stars": "10k+",
        "reputation": "社区最受欢迎的全拼方案"
      },

      // === 学习资源 ===
      "learningResources": [
        { "title": "雾凇拼音配置指南", "url": "https://dvel.me/posts/rime-ice/" },
        { "title": "视频教程", "url": "https://example.com/tutorial" }
      ],

      // === 配置集成 ===
      "integration": {
        "presetId": "rime-ice",
        "capabilities": ["special-input"],
        "availableSpellingSchemes": null,
        "availableAuxiliaryCodes": null,
        "customSwitchNames": null
      }
    }
  ]
}
```

### 1.2 键位图数据结构

双拼方案的 `visuals.keyboardLayout` 字段：

```jsonc
{
  "keyboardLayout": {
    "name": "自然码双拼",
    "rows": [
      // 第一行：Q-P
      [
        { "key": "Q", "initial": "q", "final": "iu" },
        { "key": "W", "initial": "w", "final": "ia" },
        // ...
        { "key": "P", "initial": "p", "final": "un" }
      ],
      // 第二行：A-L + ;
      [
        { "key": "A", "initial": null, "final": "a" },
        // ...
        { "key": "L", "initial": "l", "final": "ai" },
        { "key": ";", "initial": null, "final": "ing", "isSpecial": true }
      ],
      // 第三行：Z-M
      [
        { "key": "Z", "initial": "z", "final": "ei" },
        // ...
        { "key": "V", "initial": "zh", "final": "v", "isDualRole": true },
        // ...
        { "key": "M", "initial": "m", "final": "ian" }
      ]
    ]
  }
}
```

- 按键集合完全数据驱动，每行是一个数组，支持任意键
- `isSpecial: true` 标记非字母键（`;` `'` `/` 等）
- `isDualRole: true` 标记同时承担声母和韵母的键

### 1.3 类型定义

在 `src/types/schema.ts` 中定义统一类型：

```typescript
export interface SchemaDetail {
  id: string
  name: string
  type: 'full_pinyin' | 'double_pinyin' | 'shape' | 'mixed'
  description: string
  introduction: string
  author: string
  links: SchemaLinks
  compare: SchemaCompareInfo
  visuals: SchemaVisuals
  community: SchemaCommunity
  learningResources: LearningResource[]
  integration: SchemaIntegration
}

export interface SchemaLinks {
  official: string | null
  repository: string | null
  documentation: string | null
  community: { label: string; url: string }[]
}

export interface SchemaCompareInfo {
  dictSize: string
  smartLevel: '基础' | '中等' | '高'
  auxiliaryCode: string
  features: string[]
  platforms: string[]
  difficulty: '简单' | '中等' | '困难'
  recommendation: string
}

export interface SchemaVisuals {
  screenshots: string[]
  keyboardLayout: KeyboardLayoutData | null
}

export interface KeyboardLayoutData {
  name: string
  rows: KeyMapping[][]
}

export interface KeyMapping {
  key: string
  initial: string | null
  final: string
  isSpecial?: boolean
  isDualRole?: boolean
}

export interface SchemaCommunity {
  updateFrequency: string
  stars: string
  reputation: string
}

export interface LearningResource {
  title: string
  url: string
}

export interface SchemaIntegration {
  presetId: string | null
  capabilities: string[]
  availableSpellingSchemes: string[] | null
  availableAuxiliaryCodes: string[] | null
  customSwitchNames: string[] | null
}
```

### 1.4 迁移策略

- `schema-registry.ts`：改为从 JSON 导入，导出的 `SCHEMA_REGISTRY`、`SchemaInfo` 接口、`schemaHasCapability()`、`getSchemaCapabilities()` 保持不变
- `schema-compare-data.ts`：改为从 JSON 的 `compare` 字段派生，导出的 `SCHEMA_COMPARE_DATA` 和 `SchemaCompareData` 接口保持不变
- 现有消费方无需修改

## 2. 方案详情页

### 2.1 路由

路径：`/schema/:id`（如 `/schema/rime_ice`）

### 2.2 页面结构

**Header 区域**：
- 方案名称 + 类型标签（全拼/双拼/形码）+ 推荐标签（如"新手推荐"）
- 作者 + 关键数据（词库规模、更新频率）
- 操作按钮：Stars 徽章、"使用此方案"按钮
- 外部链接栏：官方网站、GitHub 仓库、官方文档、社区链接

**Tab 导航**：
- 方案介绍（默认）
- 功能特性
- 截图预览
- 学习资源
- 键位图（仅双拼方案显示）

**方案介绍 Tab**：
- 详细介绍文字（`introduction` 字段，2-3 段）
- 四宫格统计卡片（词库规模、智能程度、上手难度、更新频率）
- 功能特性标签云
- 平台支持徽章

**功能特性 Tab**：
- 以列表形式展示每个 feature 的简要说明

**截图预览 Tab**：
- 方案截图画廊（`visuals.screenshots`）

**学习资源 Tab**：
- 卡片列表展示教程、文档、视频等链接（`learningResources`）

**键位图 Tab（双拼专属）**：
- `<KeyboardLayout>` 组件渲染交互式键位图

**底部 CTA**：
- "想和其他方案对比？" 引导跳转对比页
- "使用此方案" 按钮（重复，方便底部操作）

### 2.3 组件文件

```
src/features/schema-detail/
  ├── SchemaDetailPage.tsx      # 页面入口，路由组件
  ├── SchemaHeader.tsx          # Header 区域
  ├── SchemaIntroTab.tsx        # 方案介绍 Tab
  ├── SchemaFeaturesTab.tsx     # 功能特性 Tab
  ├── SchemaScreenshotsTab.tsx  # 截图预览 Tab
  ├── SchemaResourcesTab.tsx    # 学习资源 Tab
  └── KeyboardLayout.tsx        # 键位图组件（可复用）
```

## 3. 键位图组件

### 3.1 组件接口

```typescript
interface KeyboardLayoutProps {
  data: KeyboardLayoutData
}
```

### 3.2 渲染规则

- 每行按 `rows` 数组顺序渲染，第二行缩进，第三行进一步缩进（模拟实体键盘）
- 每个按键显示：上方字母/符号（黑色粗体），下方韵母映射（蓝色）
- `initial` 为 `null` 时韵母颜色用灰色（表示该键无特殊声母映射，如 `A` 键或非字母键 `;`）

### 3.3 视觉样式

| 按键类型 | 样式 |
|---------|------|
| 普通字母键 | 白色背景，灰色边框 |
| 非字母键（`isSpecial`） | 浅紫色背景，紫色边框 |
| 双角色键（`isDualRole`） | 浅黄色背景，黄色边框 |
| Hover 状态 | 浅蓝色背景，蓝色边框 |

### 3.4 交互行为

- Hover 按键时高亮，显示 tooltip：完整映射信息 + 该键位的示例汉字
- 组件响应式：移动端缩小按键尺寸，保持可读性

## 4. 现有 UI 改造

### 4.1 向导页 `SchemaStep.tsx`

改造内容：
- 卡片增加作者信息
- 卡片增加难度标签（简单=绿色，中等=黄色，困难=红色）
- 卡片右上角加"了解更多"链接图标，点击跳转 `/schema/:id`（新标签页，不打断向导流程）
- 有推荐标签的方案显示推荐 badge
- 卡片底部增加一行关键特征摘要（如 "200万+词库 · Lua扩展 · 社区活跃"）

### 4.2 编辑器方案管理 `SchemaManager.tsx`

改造内容：
- 下拉菜单选项增加副标题行（类型 + 难度 + 推荐语）
- 已添加方案卡片增加"查看详情"按钮 → `/schema/:id`
- 卡片右侧增加外部链接快捷图标（GitHub、官网），默认半透明，hover 卡片时完全显示
- 底部新增"浏览所有方案 →"链接 → 对比页

### 4.3 方案对比页 `SchemaCompare.tsx`

改造内容：
- 表头方案名改为可点击链接 → `/schema/:id`
- 表头下方新增外部链接图标行（GitHub、官网）
- 新增对比维度：更新活跃度、社区规模（Stars）
- "使用这个方案"按钮旁增加"查看详情"次要按钮

## 5. 截图资源

截图文件存放在 `public/screenshots/` 目录下，按方案 ID 命名子目录：

```
public/screenshots/
  ├── rime-ice/
  │   ├── main.png
  │   └── emoji.png
  ├── wanxiang/
  │   └── main.png
  └── ...
```

JSON 中 `visuals.screenshots` 存储相对路径，渲染时拼接为 `/screenshots/{id}/{filename}`。

## 6. 方案覆盖范围

需要为以下 13 个方案填充完整数据：

| 方案 | 类型 | 需要键位图 |
|------|------|-----------|
| 雾凇拼音 | 全拼 | 否 |
| 万象拼音 | 全拼 | 否 |
| 万象拼音 PRO | 全拼 | 否 |
| 小鹤双拼 | 双拼 | 是 |
| 自然码双拼 | 双拼 | 是 |
| 微软双拼 | 双拼 | 是 |
| 搜狗双拼 | 双拼 | 是 |
| 朙月拼音 | 全拼 | 否 |
| 地球拼音 | 全拼 | 否 |
| 五笔86 | 形码 | 否 |
| 五笔98 | 形码 | 否 |
| 仓颉五代 | 形码 | 否 |
| 郑码 | 形码 | 否 |

## 7. 不包含在本次设计中

- 用户评分/投票系统（需要后端支持）
- 方案自动安装功能
- 方案版本号的自动同步
- 搜索/筛选方案功能（可作为后续迭代）
