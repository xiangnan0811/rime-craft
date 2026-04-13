# Rime Content Accuracy Audit

## Scope

This review covers the five tutorials that were explicitly flagged as containing approximated or inferred Rime behavior:

- `src/content/config-structure.mdx`
- `src/content/multi-device-sync.mdx`
- `src/content/auxiliary-code-config.mdx`
- `src/content/first-deploy.mdx`
- `src/content/dictionary.mdx`

## Review rubric

For each file, record:

- Claim under review
- Why it is risky
- Validation method (upstream docs / real config / manual Rime knowledge / community source)
- Verdict: keep / soften / correct / remove
- Follow-up edit required?

## Findings

### `config-structure.mdx`
- Claim: `__patch:` 的作用域与 `@before n` / `@after n` 数组操作按文中示例描述工作
- Risk: 语义细节若来自二手资料，容易把“常见实践”写成“固定规则”
- Validation: 对照官方定制指南中的 `__patch:`、`@before` / `@after` / `@next` 示例，并回看当前教程里的 YAML 片段
- Verdict: keep
- Follow-up: 正文补一句“以官方定制指南和方案源码为准”，避免把示例扩写成所有指令的完整规范

### `multi-device-sync.mdx`
- Claim: 用户词典同步后的合并规则可概括为“词条并集 + 最大权重”
- Risk: 词典内部存储与合并行为并非稳定公开规范，写成确定机制风险较高
- Validation: 检查官方用户指南对 `sync_dir` / `installation_id` / 用户词典快照合并的描述；未找到稳定公开的逐字段算法契约
- Verdict: soften
- Follow-up: 改写成“常见可观察结果”，保留用户可操作结论，去掉算法式断言

### `auxiliary-code-config.mdx`
- Claim: 文中使用的辅助码相关 YAML 字段名与主流方案文件一致
- Risk: 不同方案实现字段名可能不同，教程若写成统一规范会误导用户直接复制
- Validation: 对照当前编辑器支持的辅助码字段模型，并检查教程原文是否把方案约定写成了通用契约
- Verdict: soften
- Follow-up: 改成“以下示例以当前编辑器/该类方案的常见写法为例”，避免宣称是所有主流方案的统一字段名

### `first-deploy.mdx`
- Claim: `rime_deployer --build <user_dir> <build_dir>` 可作为跨前端通用命令形态
- Risk: CLI 形态可能依赖具体前端或包装方式，写成通用契约风险较高
- Validation: 官方资料能确认“重新部署/同步”入口与 `rime_deployer` 的存在，但未给出统一的跨前端 CLI 形态；现有命令更接近环境相关示例
- Verdict: soften
- Follow-up: 保留命令示例，但明确写成“常见手动方式/示例路径”，不再宣称是通用标准命令格式

### `dictionary.mdx`
- Claim: 自定义短语对应的 translator 注册名可直接概括为 `table_translator@custom_phrase`
- Risk: 不同方案的注册方式可能不同，直接写死容易过度泛化
- Validation: 官方用户指南引用了朙月拼音方案中的 `custom_phrase` 配置方式，但没有把该 translator 名称定义为所有方案的通用契约
- Verdict: soften
- Follow-up: 改成“在朙月拼音等采用该约定的方案里，常见做法是……”并提醒以具体方案源码为准
