# App Selector Design — 应用选择器设计

> 为「中英文切换」模块的应用添加体验提供跨平台增强方案

## 背景

当前 Rime Craft 的「中英文切换与应用设置」页面支持为特定应用设置默认输入模式。现有功能：
- 快速添加 5 个硬编码的 macOS 应用（Terminal、VS Code、iTerm2、IntelliJ IDEA、Sublime Text）
- 手动输入 Bundle ID / 可执行文件名

**问题**：
1. 用户通常不知道应用的 Bundle ID 或可执行文件名
2. 预置应用太少且仅限 macOS
3. 平台类型仅支持 macOS 和 Windows，缺少 Linux
4. 没有从本地文件系统辅助获取标识符的能力

## 方案概述

采用「渐进式 Dialog」方案：

1. **保留**现有快速添加按钮行（数据来源改为统一数据库）
2. **替换**手动输入区域为「+ 添加应用」按钮
3. 点击后打开 **Dialog**，内含：搜索式预置应用列表 → 本地文件选择 → 终端命令辅助（macOS）→ 手动输入

90% 的用户在搜索层完成操作，剩余用户通过本地选择或手动输入兜底。

## Part 1：预置应用数据库

### 数据结构

```typescript
interface AppEntry {
  /** 应用唯一键 */
  id: string
  /** 应用显示名称 */
  name: string
  /** 应用图标（emoji 或内联 SVG） */
  icon?: string
  /** 各平台的标识符，缺失表示该平台无此应用 */
  platforms: {
    macos?: string
    windows?: string
    linux?: string
  }
  /** 分类标签 */
  category: 'terminal' | 'editor' | 'ide' | 'browser' | 'communication' | 'office' | 'other'
}
```

### 初始数据库（约 20 个应用）

| 分类 | 应用 | macOS | Windows | Linux |
|------|------|-------|---------|-------|
| terminal | Terminal | `com.apple.Terminal` | - | - |
| terminal | iTerm2 | `com.googlecode.iterm2` | - | - |
| terminal | Windows Terminal | - | `WindowsTerminal.exe` | - |
| terminal | Alacritty | `org.alacritty` | `alacritty.exe` | `Alacritty` |
| terminal | Warp | `dev.warp.Warp-Stable` | - | - |
| editor | VS Code | `com.microsoft.VSCode` | `Code.exe` | `code` |
| editor | Sublime Text | `com.sublimetext.4` | `sublime_text.exe` | `sublime_text` |
| ide | IntelliJ IDEA | `com.jetbrains.intellij` | `idea64.exe` | `jetbrains-idea` |
| ide | WebStorm | `com.jetbrains.WebStorm` | `webstorm64.exe` | `jetbrains-webstorm` |
| ide | PyCharm | `com.jetbrains.pycharm` | `pycharm64.exe` | `jetbrains-pycharm` |
| ide | Xcode | `com.apple.dt.Xcode` | - | - |
| ide | Android Studio | `com.google.android.studio` | `studio64.exe` | `android-studio` |
| browser | Chrome | `com.google.Chrome` | `chrome.exe` | `google-chrome` |
| browser | Firefox | `org.mozilla.firefox` | `firefox.exe` | `firefox` |
| browser | Safari | `com.apple.Safari` | - | - |
| browser | Arc | `company.thebrowser.Browser` | `Arc.exe` | - |
| communication | WeChat | `com.tencent.xinWeChat` | `WeChat.exe` | - |
| communication | Telegram | `ru.keepcoder.Telegram` | `Telegram.exe` | `telegram-desktop` |
| office | WPS Office | `com.kingsoft.wpsoffice.mac` | `wps.exe` | `wps` |
| other | Raycast | `com.raycast.macos` | - | - |

### 设计要点

- **文件位置**：`src/data/app-database.ts`，纯数据模块
- **搜索逻辑**：匹配 `name`、`category` 和各平台标识符，支持中文别名（如「微信」→ WeChat）
- **平台过滤**：根据 `targetPlatform` 自动只显示该平台可用的应用
- **图标**：emoji 或简单 SVG，不引入外部图标库

## Part 2：Dialog UI 交互

### 触发方式

- **保留**现有「快速添加常用应用」按钮行（数据来源改为 `app-database.ts`，按当前平台过滤最常用的 5 个）
- **替换**「手动添加应用」输入框为「+ 添加应用」按钮，点击打开 Dialog

### Dialog 布局

```
┌─────────────────────────────────────────────┐
│  添加应用                              [✕]  │
├─────────────────────────────────────────────┤
│  🔍 搜索应用名称...                         │
├─────────────────────────────────────────────┤
│                                             │
│  终端工具                                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │ Terminal  │ │  iTerm2  │ │ Alacritty│    │
│  └──────────┘ └──────────┘ └──────────┘    │
│                                             │
│  编辑器                                      │
│  ┌──────────┐ ┌──────────┐                  │
│  │ VS Code  │ │ Sublime  │                  │
│  └──────────┘ └──────────┘                  │
│                                             │
│  IDE                                        │
│  ┌──────────┐ ┌──────────┐                  │
│  │ IntelliJ │ │ WebStorm │                  │
│  └──────────┘ └──────────┘                  │
│  ...                                        │
│                                             │
├─────────────────────────────────────────────┤
│  找不到你的应用？                             │
│                                             │
│  [📁 从本地选择]  [⌨️ 手动输入标识符]         │
│  [📋 终端命令获取] ← 仅 macOS 显示           │
└─────────────────────────────────────────────┘
```

### 交互流程

**搜索选择**：
1. 搜索框输入 → 实时过滤应用列表（name + category + 标识符匹配）
2. 点击应用卡片 → 自动填入当前平台标识符 → 关闭 Dialog → 调用 `setAppOption`
3. 已添加的应用灰色禁用，不可重复添加

**从本地选择**（点击后展开面板）：
- **macOS**：文件选择器 accept=`.plist`，引导：「右键 .app → 显示包内容 → Contents → 选择 Info.plist」。解析 XML 提取 `CFBundleIdentifier`
- **Windows**：文件选择器 accept=`.exe`，引导：「浏览到应用安装目录，选择 .exe 文件」。取 `file.name`
- **Linux**：文件选择器 accept=`.desktop`，引导：「选择 /usr/share/applications 下的 .desktop 文件」。解析 `StartupWMClass` 或 `Exec`

**终端命令获取**（仅 macOS）：
- 展示命令：`mdls -name kMDItemCFBundleIdentifier -raw /Applications/应用名.app`
- 「复制命令」按钮
- 粘贴结果的输入框

**手动输入**：
- 展开输入框 + 确认按钮，placeholder 根据平台显示示例

### 组件拆分

```
AppSelectorDialog (Dialog 容器)
├── AppSearchInput (搜索输入框)
├── AppGrid (按分类分组的应用网格)
│   └── AppCard (单个应用卡片)
├── LocalAppPicker (本地文件选择)
├── TerminalCommandHelper (终端命令提示 - macOS only)
└── ManualInput (手动输入标识符)
```

## Part 3：跨平台文件解析

### 平台标识符体系

| 平台 | Rime 使用的标识符 | 来源 | 示例 |
|------|------------------|------|------|
| macOS | Bundle Identifier | Info.plist 中的 `CFBundleIdentifier` | `com.microsoft.VSCode` |
| Windows | 可执行文件名 | `.exe` 文件名 | `Code.exe` |
| Linux | WM_CLASS / 进程名 | `.desktop` 的 `StartupWMClass` 或 `Exec` | `code` |

### 解析逻辑

**macOS — Info.plist**：
```
选择 Info.plist → FileReader 读取文本 → DOMParser 解析 XML
→ 找 <key>CFBundleIdentifier</key> → 取下一个 <string> 的文本
→ 成功则填入，失败则引导用终端命令或手动输入
```

注意：部分 `.app` 的 Info.plist 是二进制格式，解析会失败，需错误提示引导。

**Windows — .exe**：
```
选择 .exe → 取 file.name → 直接作为标识符
```

**Linux — .desktop**：
```
选择 .desktop → FileReader 读取文本 → 逐行解析 INI 格式
→ 优先取 StartupWMClass → 没有则取 Exec（去路径前缀和参数）
```

### 代码组织

新增 `src/lib/app-identifier.ts`：

```typescript
/** 从 macOS Info.plist XML 提取 Bundle ID */
export function parseBundleIdFromPlist(xmlContent: string): string | null

/** 从 .exe 文件对象提取文件名 */
export function getExeFileName(file: File): string

/** 从 Linux .desktop 文件内容提取 WM_CLASS 或命令名 */
export function parseDesktopFile(content: string): string | null
```

### 错误处理

| 场景 | 处理 |
|------|------|
| Info.plist 是二进制格式 | 提示「此文件为二进制格式，请使用终端命令获取」 |
| Info.plist 无 CFBundleIdentifier | 提示「未找到 Bundle ID，请手动输入」 |
| 用户选了非预期文件 | 提示「请选择正确的文件类型」 |
| .desktop 缺少 StartupWMClass 和 Exec | 提示「未能解析应用标识符，请手动输入」 |

## Part 4：类型系统与存储层改动

### PlatformConfig 扩展

```typescript
// 之前
platform: 'macos' | 'windows'

// 之后
platform: 'macos' | 'windows' | 'linux'
```

### 联动修改清单

| 文件 | 改动 |
|------|------|
| `src/types/config.ts` | platform 类型加入 `'linux'` |
| `src/lib/config/defaults.ts` | 默认值逻辑考虑 linux |
| `src/lib/yaml/parser.ts` | 解析时识别 linux 平台 |
| `src/lib/yaml/serializer.ts` | 序列化时正确输出 linux |
| `src/features/wizard/steps/BasicConfigStep.tsx` | 向导快速添加适配平台 |
| `src/stores/config-store.ts` | 无需改动（已泛化为 `string` key） |

### COMMON_APPS 迁移

`AsciiMode.tsx` 中硬编码的 `COMMON_APPS` 迁移至 `src/data/app-database.ts`。快速添加按钮从数据库中按当前平台过滤最常用的 5 个应用。

### 新增文件

| 文件 | 用途 |
|------|------|
| `src/data/app-database.ts` | 预置应用数据库 |
| `src/lib/app-identifier.ts` | 跨平台文件解析工具 |
| `src/features/editor/components/AppSelectorDialog.tsx` | Dialog 容器 |
| `src/features/editor/components/AppSearchInput.tsx` | 搜索输入框 |
| `src/features/editor/components/AppGrid.tsx` | 应用网格（含 AppCard） |
| `src/features/editor/components/LocalAppPicker.tsx` | 本地文件选择 |
| `src/features/editor/components/TerminalCommandHelper.tsx` | 终端命令提示 |

不需要新增 UI 基础组件 — Dialog、Input、Button 等均可使用现有 Radix UI 组件。
