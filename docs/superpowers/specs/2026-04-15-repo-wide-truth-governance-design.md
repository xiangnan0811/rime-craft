# Repo-wide 内容与产品真值治理设计

> 日期：2026-04-15
> 适用分支：`master`
> 目标层级：修当前问题 + 建立最小长期机制
> 治理策略：平衡收敛（明确错误必须修；高漂移内容尽量保留，但必须降低确定性并显式暴露边界）

## 一、背景与问题陈述

`rime-craft` 在前一轮 public-trust remediation 中已经完成了第一层收敛：

- 公开教程路由、导航、搜索、旧 slug 兼容已经恢复并由 contract tests 兜底
- UI 不再把“载入预设配置”误写成“安装上游方案”
- 方案元数据中的 canonical repo / issues / type label 已完成一轮修正
- README / PRODUCT_CONTRACT / support-contract / Wizard / Export surface 已统一到“正式支持 macOS / Windows 导入导出”这条产品边界

但更深入的 repo-wide 真值审查显示，仓库仍然存在第二层问题：

1. **教程事实仍有残留冲突或证据强度不足的断言**
   - 例如内置同步是否“处理配置文件”的说法在同一教程内部仍可能互相打架
   - 某些 Linux / IBus / 移动端具体命令与能力描述无法被当前官方或上游资料稳定坐实
2. **UI、文档、静态数据虽然主边界一致，但高漂移信息仍有被当作稳定事实展示的倾向**
   - 如 stars / updateFrequency / “最完整” / “更新及时” / “支持所有平台”等断言
3. **对 Rime 上游变化的适配还缺少一套最小长期机制**
   - 目前已有 contract tests，但还没有清晰分层：哪些事实必须强锁，哪些只应做语义约束，哪些应该降级成带来源/时效性的参考信息

本设计的目的不是做一套重型治理框架，而是在当前仓库阶段建立一套**足够轻、但足够稳定**的 repo-wide truth governance 基线。

---

## 二、设计目标与非目标

## 2.1 目标

本轮设计要同时满足以下目标：

1. **修掉当前 repo 里仍然存在的高风险 truth issues**
2. **让 UI / README / 教程 / 静态数据对同一事实给出同一个答案**
3. **把高漂移 truth surface 从“伪装成稳定事实”改成“保留信息但显式暴露边界”**
4. **建立最小长期机制**，让未来新增内容不再主要依赖人工记忆来维持可信度

## 2.2 非目标

本轮明确不做以下事情：

- 不扩大正式支持边界（仍以 `macOS / Windows` 导入导出为正式承诺范围）
- 不引入自动联网拉取社区数据（如 stars / latest activity）
- 不实现上游方案安装器或依赖下载器
- 不重做整套信息架构
- 不在缺少维护者确认的情况下擅自填写 `LICENSE` 归属名义或 `package.json.author`

---

## 三、真值分层模型

本轮的核心设计不是“把所有内容都写得更保守”，而是把仓库里的 truth surface 按变化频率和风险级别分层治理。

## 3.1 Layer A：稳定事实

这类信息变化频率低，一旦确认就应在代码、文档、数据中保持一致。

### 典型例子
- 正式支持边界（`macOS / Windows`）
- canonical repo URL / issues URL / learning-resource URL
- 方案类型标签（如 `wanxiang_pro = double_pinyin`）
- docs route / tutorial slug / loader 映射
- “预设加载 ≠ 上游方案安装” 这类产品边界事实

### 治理方式
- 以**单一真值源**为中心（例如 `support-contract.ts`、`schemas-detail.json`、`tutorial-nav.ts`）
- 使用**强 contract tests** 锁死
- UI 与文档必须直接消费这些真值，而不是各写一套近似说法

## 3.2 Layer B：半稳定事实

这类内容通常有来源，但会随着上游版本、前端实现、平台差异而变化。

### 典型例子
- deploy / sync / installation 机制
- `installation.yaml`、`sync_dir`、`installation_id` 用法
- `custom_phrase` 的典型挂载方式
- 各平台用户目录 / 日志路径
- 某个方案“通常如何安装 / 切换 / 配置”

### 来源裁决规则
- **具体方案行为**：以上游方案当前 README / 代码为准
- **通用 Rime 机制**：以官方 Rime 文档为准
- **证据不足**：降级为“当前常见情况 / 以当前前端或方案文档为准”

### 治理方式
- 教程文案必须使用边界词，如：
  - `当前常见做法`
  - `通常`
  - `环境相关`
  - `以当前前端/方案文档为准`
- 测试以**语义合同**为主，而不是一字不差的 exact string

## 3.3 Layer C：高漂移事实

这类信息最容易在短时间内失真，也最容易被用户误当成“当前客观事实”。

### 典型例子
- `community.stars`
- `updateFrequency`
- “最完整” / “最受欢迎” / “更新及时”
- 广泛平台支持的强断言
- 竞争性、比较性、主观性描述

### 治理方式
- 允许保留信息密度，但**禁止继续裸露成稳定事实**
- 可以采用以下处理之一：
  - 从关键决策位下沉
  - 加 `人工维护` / `快照信息` / `以当前 README 为准` 等轻量标记
  - 增加 `lastVerifiedAt` 一类最小结构化元数据
- 测试不锁具体数值，只锁：
  - 是否已被降级
  - 是否已显式暴露来源/时效性边界

---

## 四、本轮修复范围

本轮分成四个修复面和一个最小长期机制面。

## 4.1 教程事实准确性修复面

### 优先对象
- `src/content/multi-device-sync.mdx`
- `src/content/installation.mdx`
- `src/content/first-deploy.mdx`
- `src/content/what-is-rime.mdx`
- `src/content/schema-manager.mdx`
- 必要时连带：
  - `src/content/dictionary.mdx`
  - `src/content/spelling-scheme.mdx`

### 要修的问题类型
1. 明确矛盾（同一页面前后打架）
2. 命令级建议的证据强度不足
3. 把经验总结写成稳定事实
4. 高漂移移动端断言未带边界

## 4.2 UI 与文档一致性修复面

### 优先对象
- `src/app/home/HomePage.tsx`
- `src/features/compare/SchemaCompare.tsx`
- `src/features/schema-detail/SchemaHeader.tsx`
- `src/features/editor/modules/SchemaManager.tsx`
- `src/features/wizard/steps/PlatformStep.tsx`
- `README.md`
- `docs/PRODUCT_CONTRACT.md`

### 要修的问题类型
1. 正式支持边界在不同入口表达不一致
2. “载入预设”与“真实安装”边界表达不一致
3. 高漂移信息仍摆在主决策位，像稳定事实一样展示

## 4.3 上游漂移风险修复面

### 优先对象
- `src/data/schemas-detail.json`
- `src/features/compare/SchemaCompare.tsx`
- `src/features/schema-detail/SchemaHeader.tsx`
- 相关详情/对比展示区块

### 要修的问题类型
1. 高漂移字段继续被当作当前事实展示
2. 缺少来源/时效性表达
3. 数据层没有分层，所有字段被同等对待

## 4.4 测试与防回归修复面

### 目标
让这轮治理从“一次性人工修补”升级成“有最低限度回归保护”。

### 本轮测试目标
- 扩展 `src/content/rime-trust-contract.test.ts`
- 必要时扩展 `src/data/schema-data.contract.test.ts`
- 只在关键 UI truth surface 上补轻量回归测试
- 避免把整段教程或高漂移事实做成 brittle snapshot

## 4.5 最小长期机制面

本轮不会建立完整治理平台，但会把以下规则正式化：

1. truth surface 分层规则
2. 来源裁决规则
3. 展示规则
4. 新增高风险内容的进入门槛

---

## 五、来源裁决与展示策略

## 5.1 来源裁决规则

### 方案特定行为
例如：
- Wanxiang PRO 是否仅双拼
- 某方案如何安装
- 某个辅助码或 Lua 机制如何挂载

**默认优先级：**
1. 上游方案当前 README
2. 上游方案当前代码
3. 若两者冲突或证据不足，则降级表述

### 通用 Rime 机制
例如：
- `installation.yaml`
- `sync_dir` / `installation_id`
- deploy / sync 机制
- 用户资料夹 / 快照语义

**默认优先级：**
1. 官方 Rime 文档
2. 当前具体前端/发行版文档
3. 若仍不足以坐实，则降级表述

## 5.2 展示策略规则

### 允许继续前置展示的内容
- 正式支持边界
- 方案类型
- canonical repo/docs/issues 链接
- 是否有 preset
- 稳定能力标签（来源足够强时）

### 必须降级或打标的内容
- `stars`
- `updateFrequency`
- 高主观性 reputational 文案
- 时效性很强的平台广度判断

### 本轮推荐做法
采用轻量、用户可见的方式暴露边界：
- `人工维护`
- `快照信息`
- `以上游 README 为准`
- 如需数据支持，可为高漂移字段预留最小结构：
  - `lastVerifiedAt`
  - `sourceType`

---

## 六、实现策略与权衡

## 6.1 教程实现策略

### 第一类：明确错误，直接修
例如：
- `multi-device-sync.mdx` 中关于配置文件是否被内置同步“处理”的冲突

### 第二类：证据不足但常见，降级为“当前常见情况”
例如：
- 某些 Linux / IBus 命令级建议
- 某些移动端能力强断言

### 第三类：高漂移内容，保留但改变产品地位
例如：
- 从“像当前事实一样展示”改成“参考信息 + 来源/时效性标记”

## 6.2 UI/数据实现策略

### 第一步：先确认单一真值源
- 产品边界：`docs/PRODUCT_CONTRACT.md` / `src/lib/product/support-contract.ts`
- 方案元数据：`src/data/schemas-detail.json`
- 教程机制：`src/content/*.mdx`

### 第二步：让 UI 成为这些真值的消费者
- 不让 Compare / Detail / Home / Wizard 各自自由发挥
- 所有用户决策位必须回答三个问题：
  1. 这是不是正式支持能力？
  2. 这是不是模板/预设？
  3. 这是不是稳定事实，还是参考信息？

## 6.3 测试策略

### 稳定事实 → 强合同
- repo URL
- issues URL
- type label
- tutorial route/loader truth
- 正式支持平台边界

### 半稳定事实 → 语义合同
- 安装前提
- redeploy 需要性
- frontend-first / CLI-fallback
- sync 是 user-dictionary-first 而不是可靠配置合并

### 高漂移事实 → 不锁具体值
- 不写死 stars / 活跃度 / “最完整”
- 只锁它们是否已被降级或打标

---

## 七、最小长期机制

本轮落地后，仓库应明确保留以下机制：

### 机制 1：truth surface 分层
任何新事实先判断是 Layer A / B / C，再决定怎么写、怎么测、怎么展示。

### 机制 2：来源裁决
未来新增教程或元数据时，必须回答：
- 这是方案行为还是通用 Rime 机制？
- 证据来源是哪一层？
- 如果证据不足，是否已降级表述？

### 机制 3：展示守门
任何高漂移字段若放在主决策位，必须说明为什么允许；否则默认下沉或打标。

### 机制 4：内容进入门槛
未来如果新增以下内容：
- deploy
- sync
- installation
- custom_phrase
- 平台支持
- 方案对比
必须同步更新至少一个对应 contract / semantic test。

---

## 八、验收标准

本轮设计只有在以下五条同时满足时才算完成：

### A. 明确事实错误归零
在本轮纳入范围的高风险 truth surfaces 上，不再存在：
- 前后矛盾
- 已被官方/上游明确证伪的断言
- 会直接误导用户照抄错误步骤的命令级说明

### B. UI 与文档边界一致
用户从首页、Wizard、Compare、Detail、SchemaManager、README、PRODUCT_CONTRACT 任一入口进入，都能得到同一套产品边界认知。

### C. 高漂移 truth surface 被显式降级或打标
至少最危险的一批高漂移字段必须做到：
- 下沉展示位
- 或显式标识来源/时效性
- 或通过措辞降级为参考信息

### D. 测试锁住真值边界
- 稳定事实有 contract tests
- 半稳定事实有语义合同
- 新增/扩展测试能覆盖本轮修复的关键 truth surfaces
- 不把高漂移事实锁成固定数值或 brittle 句子

### E. 仓库验证不退化
以下命令通过：
- `npm test`
- `npx tsc -b`
- `npm run build`

并且工作树干净。

---

## 九、后续实现交接

本设计通过用户审阅后，下一步进入 `writing-plans`，产出实现计划。

实现计划应按以下顺序组织：
1. 教程事实准确性修复
2. 高漂移字段展示策略调整
3. UI 与文档一致性补齐
4. 测试与合同扩展
5. 最小长期机制落地

不建议跳过 spec 直接编码，也不建议在计划阶段再重新争论“是否允许改展示策略”或“是否允许显式暴露来源/时效性”——这些边界已在本设计中确认。
