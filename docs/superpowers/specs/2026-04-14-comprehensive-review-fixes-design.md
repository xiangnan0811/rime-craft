# Rime Craft 全面审查修复设计

> 日期: 2026-04-14
> 范围: 安全加固、代码去重、类型加固、运行时优化、架构重构、全面测试补充
> 组织方式: 方案 A — 按领域分 6 批执行

## 背景

项目经历 185 次提交后进行全方位审查，发现以下问题类别：

- 安全问题: 1 HIGH + 3 MEDIUM + 2 LOW
- 代码质量: 2 HIGH + 5 MEDIUM + 4 LOW
- 测试覆盖: ~40-45% 源文件有测试，UI 层几乎为零

所有审查发现均需修复。测试采用全面补充策略（20+ 测试文件）。

## 批次依赖关系

```
Batch 1 (安全加固) ─────────────────────────────────────────→ 独立
Batch 2 (共享模块提取) ──→ Batch 5 (架构重构) 依赖 Batch 2
Batch 3 (类型系统加固) ─────────────────────────────────────→ 独立
Batch 4 (Store 与运行时优化) ───────────────────────────────→ 独立
Batch 5 (架构重构) ─────────────────────────────────────────→ 依赖 Batch 2
Batch 6 (全面测试补充) ─────────────────────────────────────→ 在 1-5 完成后执行
```

Batch 1/3/4 可并行。Batch 2 必须在 Batch 5 之前。Batch 6 最后执行。

---

## Batch 1: 安全加固

### 1.1 原型链污染防护

**文件**: `src/lib/yaml/parser.ts` — `setNestedValue` (L68-82)

**问题**: `setNestedValue` 接受 YAML 中 `/` 分隔的 key，未拒绝 `__proto__`、`constructor`、`prototype`。攻击者可通过 `?share=` URL 或导入文件注入恶意 payload 污染 `Object.prototype`。

**修复**: 在遍历 path 每一步检查 key 是否为危险 key，命中则静默跳过整个路径。

```typescript
const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

function setNestedValue(obj: Record<string, unknown>, path: string[], value: unknown): void {
  let current = obj as Record<string, unknown>
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i]!
    if (DANGEROUS_KEYS.has(key)) return
    if (current[key] === undefined || typeof current[key] !== 'object') {
      current[key] = {}
    }
    current = current[key] as Record<string, unknown>
  }
  const finalKey = path[path.length - 1]!
  if (DANGEROUS_KEYS.has(finalKey)) return
  current[finalKey] = value
}
```

**测试**: `parser.test.ts` 新增用例，验证 `expandPatchPaths({ '__proto__/polluted': true })` 不污染 `Object.prototype`。

### 1.2 URL 解压大小限制

**文件**: `src/lib/compress/share.ts` — `decompressConfig` (L70-78)

**问题**: LZ 解压无大小限制，恶意小 payload 可解压为巨大字符串导致 tab 卡死。

**修复**:
- 压缩数据长度上限 50KB (`compressed.length > 50_000` 返回 null)
- 解压后 JSON 字符串上限 500KB (`json.length > 500_000` 返回 null)

**测试**: `share.test.ts` 新增用例验证超限输入返回 null。

### 1.3 文件上传大小限制

**文件**: `src/features/share/ImportDialog.tsx`, `src/features/share/ShareDialog.tsx`

**问题**: 无文件大小检查，可选择超大文件导致浏览器卡顿。

**修复**: 在 `file.text()` 调用前检查 `file.size > 5 * 1024 * 1024`，超限显示 `'文件过大，最大支持 5MB'`。

### 1.4 Gist ID 校验

**文件**: `src/lib/gist/client.ts` — `extractGistId` (L100-109)

**问题**: fallback 分支直接返回用户原始输入作为 URL path segment。

**修复**: fallback 增加 `/^[a-f0-9]+$/i` 校验，不匹配则抛出 `Error('无效的 Gist ID 格式')`。

**测试**: 新增 `client.test.ts`，覆盖合法 URL、裸 hex ID、非法输入。

### 1.5 GitHub PAT 不持久化

**文件**: `src/features/share/GistDialog.tsx`

**问题**: PAT 存入 sessionStorage，XSS 可窃取。

**修复**: `useState` 初始值改为 `''`，移除 `sessionStorage.setItem` 和 `sessionStorage.getItem` 调用。Token 仅存在组件 state 中。

### 1.6 CSP 配置

**文件**: `index.html`

**修复**: `<head>` 中添加：

```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://api.github.com; img-src 'self' data:;" />
```

注: `style-src 'unsafe-inline'` 是 Tailwind CSS 运行时注入样式所必需的。若构建后确认无运行时内联样式，可移除此项以进一步加固。

---

## Batch 2: 共享模块提取

### 2.1 提取 `src/lib/yaml/patch-utils.ts`

**来源**: `module-yaml.ts` (L429-477) 和 `source-files.ts` (L108-166) 中重复的三个函数。

**新文件导出**:

```typescript
export function flattenPatchEntries(
  value: Record<string, unknown>, path?: string[]
): Array<{ path: string[]; value: unknown }>

export function isYamlMapNodeEmpty(node: unknown): node is { items: unknown[] }

export function pruneEmptyParents(
  doc: ReturnType<typeof parseDocument>, path: string[]
): void
```

**消费方变更**:
- `module-yaml.ts`: 删除本地定义，import from `'./patch-utils'`
- `source-files.ts`: 删除本地定义，import from `'@/lib/yaml/patch-utils'`

`source-files.ts` 独有的 `normalizePathSegment`、`normalizePatchPath` 等不移动。`module-yaml.ts` 独有的 `pathKey` 不移动。

**测试**: 新增 `patch-utils.test.ts`。

### 2.2 提取 `src/lib/workspace/validators.ts`

**来源**: `storage.ts` (L4-67) 和 `share.ts` (L21-48) 中重复的校验逻辑。

**新文件导出**:

```typescript
export const SOURCE_FILE_KINDS: Set<string>
export function isRecord(value: unknown): value is Record<string, unknown>
export function isValidSourceFile(value: unknown): boolean
export function isValidProject(value: unknown): boolean
```

**消费方变更**:
- `storage.ts`: 删除 `SOURCE_FILE_KINDS`、`isRecord`、`isValidSourceFile` 本地定义，从 `'./validators'` 导入。保留 `isValidEditorUI`、`isWorkspaceSnapshot`。
- `share.ts`: 删除 `SOURCE_FILE_KINDS`、`isRecord`、`isPersistedSourceFile` 本地定义，从 `'@/lib/workspace/validators'` 导入 `isValidSourceFile` 替代。

**测试**: 新增 `validators.test.ts`。

### 2.3 `parseConfigSnapshot` 补充项目校验

**文件**: `src/lib/compress/share.ts` — `parseConfigSnapshot` (L134-163)

**修复**: 在 `structuredClone` 之前调用 `isValidProject(parsed.project)`，不通过返回 `{ error: '无效的配置快照：project 结构不完整' }`。

依赖 2.2 提取的 `isValidProject`。

---

## Batch 3: 类型系统加固

### 3.1 `EditorModule` 改为 string literal union

**文件**: `src/types/config.ts` (L264)

```typescript
export type EditorModule =
  | 'schema-manager'
  | 'candidate-settings'
  | 'key-bindings'
  | 'switches'
  | 'fuzzy-pinyin'
  | 'spelling-scheme'
  | 'auxiliary-code'
  | 'reverse-lookup'
  | 'punctuation'
  | 'dictionary'
  | 'lua-extensions'
  | 'ascii-mode'
  | 'candidate-display'
  | 'comment-hints'
```

在 `types/config.ts` 中手动列举，避免 `module-registry.ts → types/config.ts` 循环依赖。

### 3.2 `MODULE_COMPONENTS` 键类型约束

**文件**: `src/data/module-registry.ts` (L146)

从 `Record<string, ...>` 改为 `Record<EditorModule, ...>`。

### 3.3 `ModuleDefinition.id` 类型约束

**文件**: `src/data/module-registry.ts` (L14)

`id: string` → `id: EditorModule`。

### 3.4 波及适配

- `module-yaml.ts` 中 `MODULE_KEY_MAP` → `Partial<Record<EditorModule, ...>>`
- `share.ts` 中 `parseShareUrl` → 增加运行时校验 `VALID_MODULES.has(data.module)`，不合法返回 null

**验证**: `tsc -b` 通过即确认类型一致性。

---

## Batch 4: Store 与运行时优化

### 4.1 Schema 更新 helper 提取

**文件**: `src/stores/config-store.ts` (L259-305)

提取 store 内部 `updateSchemaField` helper，`setFuzzyRules`、`setSwitches`、`setPunctuator` 三处简化为单行调用。fallback `{ schemaId, fuzzyRules: [] }` 只出现一次。

```typescript
const updateSchemaField = <K extends keyof SchemaConfig>(
  schemaId: string, field: K, value: SchemaConfig[K]
): void => {
  const state = get()
  const project = {
    ...state.project,
    schemaConfigs: {
      ...state.project.schemaConfigs,
      [schemaId]: {
        ...(state.project.schemaConfigs[schemaId] ?? { schemaId, fuzzyRules: [] }),
        schemaId,
        [field]: value,
      },
    },
  }
  updateProjectWorkspace(project)
}
```

### 4.2 localStorage 持久化 debounce

**文件**: `src/stores/config-store.ts` (L38-55)

`persistCurrentState` 改为 500ms trailing debounce（原生 `setTimeout`，无第三方依赖）。

### 4.3 初始 project 双重创建消除

**文件**: `src/stores/config-store.ts` (L124-129)

两次 `createInitialProject()` 合并为一次，复用同一引用。

### 4.4 ErrorBoundary 包裹 lazy-loaded 模块

**新文件**: `src/components/shared/ModuleErrorBoundary.tsx`

React class component ErrorBoundary，渲染错误时显示 `"模块「{moduleName}」加载出错，请刷新页面重试。"`。

**变更**: `EditorContent.tsx` 用 `<ModuleErrorBoundary>` 包裹 `<Suspense>`。

### 4.5 DarkModeToggle 安全 localStorage 访问

**文件**: `src/components/shared/DarkModeToggle.tsx`

`localStorage.setItem` 包裹 try-catch，受限环境静默忽略。

### 4.6 diff.ts key bindings 比较改进

**文件**: `src/lib/config/diff.ts` (L38-41)

长度比较改为 `JSON.stringify` 内容比较。

---

## Batch 5: 架构重构 — module-yaml.ts 拆分

### 5.1 拆分目标

```
src/lib/yaml/
├── patch-utils.ts          ← Batch 2 已提取
├── module-key-map.ts       ← 新：模块→YAML key 映射常量 (~150 行)
├── module-yaml-extract.ts  ← 新：从 project/workspace 提取 YAML (~350 行)
├── module-yaml-apply.ts    ← 新：将 YAML 应用到 project/workspace (~400 行)
└── module-yaml.ts          ← 保留为 barrel re-export
```

### 5.2 `module-key-map.ts`

- `ModuleKeyMapping` 接口
- `MODULE_KEY_MAP` 常量
- `getModuleMappings(module)` / `getModuleFileName(module, project)`

### 5.3 `module-yaml-extract.ts`

- `extractModuleYaml` / `extractModuleYamlFromWorkspace`
- `parseYamlSlice`
- 依赖: `module-key-map.ts`、`patch-utils.ts`、`serializer.ts`

### 5.4 `module-yaml-apply.ts`

- `applyModuleYaml` / `applyModuleYamlToWorkspace`
- 大型 switch 分派逻辑
- 依赖: `module-key-map.ts`、`patch-utils.ts`、`parser.ts`

### 5.5 `module-yaml.ts` barrel

仅 re-export 公共 API，所有现有 import 路径不变，零破坏性。

### 5.6 风险控制

- 已有 `module-yaml.test.ts` 测试不修改、不移动，barrel 确保原样通过
- 纯机械移动 + barrel 导出，不改变运行逻辑

---

## Batch 6: 全面测试补充

### 6.1 关键层 — 8 个文件

| 文件 | 覆盖目标 |
|------|----------|
| `features/share/importer.test.ts` | 导入分派、多文件合并、错误收集、TSV 解析、rebuildWorkspaceFromSourceFiles |
| `lib/gist/client.test.ts` | extractGistId 校验、loadPublicGist mock fetch |
| `lib/compress/share-parse.test.ts` | parseShareUrl、parseConfigSnapshot、decompressConfig 超限 |
| `stores/config-store-actions.test.ts` | clearWorkspace、setTargetPlatform、updateSchemaConfig、debounce |
| `features/simulator/useSimulator.test.ts` | 前缀匹配、去重、pageSize、空输入 |
| `lib/yaml/patch-utils.test.ts` | Batch 2 新模块测试 |
| `lib/workspace/validators.test.ts` | Batch 2 新模块测试 |
| `lib/yaml/parser-security.test.ts` | Batch 1 原型链污染防护验证 |

### 6.2 重要层 — 8 个文件

| 文件 | 覆盖目标 |
|------|----------|
| `features/theme/ThemePresetSelector.test.tsx` | 预设选择、store 更新 |
| `features/theme/ThemeColorSection.test.tsx` | 颜色修改调用 updateThemeColors |
| `features/wizard/steps/ExportStep.test.tsx` | 根据 wizard state 生成正确 YAML |
| `features/wizard/wizard-reducer.test.ts` | SET_STEP/SET_SCHEMA/SET_PAGE_SIZE/SET_SHIFT_L/SET_THEME |
| `features/compare/SchemaCompare.test.tsx` | isDifferent 标记、"使用这个方案" 调用 loadProject |
| `features/share/useShareUrl.test.ts` | URL 解析→workspace 替换→URL 清除 |
| `features/editor/modules/FuzzyPinyin.test.tsx` | 读取 primary schema、toggle 规则合并 |
| `features/editor/modules/Punctuation.test.tsx` | valueToString/stringToValue、重置默认值 |

### 6.3 补全层 — 6 个文件

| 文件 | 覆盖目标 |
|------|----------|
| `features/editor/modules/KeyBindings.test.tsx` | 绑定增删改 |
| `features/editor/modules/Switches.test.tsx` | 开关配置 |
| `features/editor/modules/Dictionary.test.tsx` | 词典管理 |
| `features/editor/modules/AsciiMode.test.tsx` | 中英文切换 |
| `lib/docs/search-index.test.ts` | 文档搜索索引 |
| `lib/yaml/roundtrip-extended.test.ts` | theme/fuzzy/lua/triggers 完整 round-trip |

### 6.4 测试约定

- 组件测试: `@testing-library/react` + `userEvent.setup()`
- Store 初始化: `useConfigStore.getState().reset()` in `beforeEach`
- 纯逻辑 hook: `renderHook`
- Mock fetch: `vi.stubGlobal('fetch', ...)` + `vi.unstubAllGlobals()` in `afterEach`
- 不使用 `window.alert`/`window.confirm` stub

---

## 变更文件汇总

### 修改的现有文件 (~15 个)

| 文件 | 批次 | 变更类型 |
|------|------|----------|
| `src/lib/yaml/parser.ts` | 1 | 安全修复 |
| `src/lib/compress/share.ts` | 1,2,3 | 安全限制 + 导入 validators + 类型适配 |
| `src/lib/gist/client.ts` | 1 | Gist ID 校验 |
| `src/features/share/ImportDialog.tsx` | 1 | 文件大小限制 |
| `src/features/share/ShareDialog.tsx` | 1 | 文件大小限制 |
| `src/features/share/GistDialog.tsx` | 1 | 移除 sessionStorage |
| `index.html` | 1 | CSP 配置 |
| `src/lib/yaml/module-yaml.ts` | 2,3,5 | 提取函数 + 类型 + barrel 化 |
| `src/lib/workspace/source-files.ts` | 2 | 提取函数 |
| `src/lib/workspace/storage.ts` | 2 | 导入 validators |
| `src/types/config.ts` | 3 | EditorModule literal union |
| `src/data/module-registry.ts` | 3 | 类型约束 |
| `src/stores/config-store.ts` | 4 | helper 提取 + debounce + 初始化修复 |
| `src/features/editor/EditorContent.tsx` | 4 | ErrorBoundary |
| `src/components/shared/DarkModeToggle.tsx` | 4 | try-catch |
| `src/lib/config/diff.ts` | 4 | bindings 比较改进 |

### 新增文件 (~26 个)

| 文件 | 批次 |
|------|------|
| `src/lib/yaml/patch-utils.ts` | 2 |
| `src/lib/workspace/validators.ts` | 2 |
| `src/components/shared/ModuleErrorBoundary.tsx` | 4 |
| `src/lib/yaml/module-key-map.ts` | 5 |
| `src/lib/yaml/module-yaml-extract.ts` | 5 |
| `src/lib/yaml/module-yaml-apply.ts` | 5 |
| 20+ 测试文件 | 6 |

---

## 验收标准

每个批次完成后:
1. `npx tsc -b` 零错误
2. `npm test` 全部通过
3. `npm run build` 成功

全部批次完成后:
- 测试数量从 225 增长到 ~350+
- 零 `any` 类型（保持现状）
- 零已知安全漏洞
- `module-yaml.ts` 从 1228 行拆分为 3 个 150-400 行文件
