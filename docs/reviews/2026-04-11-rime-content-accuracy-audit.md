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
- Validation: 对照 upstream / 社区主流实践、真实配置示例和当前教程里的 YAML 片段逐条核对
- Verdict: pending expert review
- Follow-up: 如果无法稳定确认，改写成“常见用法”而不是“固定规则”

### `multi-device-sync.mdx`
- Claim: 用户词典同步后的合并规则可概括为“词条并集 + 最大权重”
- Risk: 词典内部存储与合并行为并非稳定公开规范，写成确定机制风险较高
- Validation: 检查 upstream 文档、可验证的用户行为描述和教程中的对应段落
- Verdict: pending expert review
- Follow-up: 如果缺少稳定依据，改写成“可观察到的常见结果”并去掉算法式断言

### `auxiliary-code-config.mdx`
- Claim: 文中使用的辅助码相关 YAML 字段名与主流方案文件一致
- Risk: 不同方案实现字段名可能不同，教程若写成统一规范会误导用户直接复制
- Validation: 用真实方案文件核对文中字段名与路径
- Verdict: pending expert review
- Follow-up: 若存在方案差异，改成“以该方案为例”并补充差异说明

### `first-deploy.mdx`
- Claim: `rime_deployer --build <user_dir> <build_dir>` 可作为跨前端通用命令形态
- Risk: CLI 形态可能依赖具体前端或包装方式，写成通用契约风险较高
- Validation: 核对 upstream 示例、当前平台实践和文中命令上下文
- Verdict: pending expert review
- Follow-up: 若不能稳定确认，降级为“示例命令”而非“标准命令格式”

### `dictionary.mdx`
- Claim: 自定义短语对应的 translator 注册名可直接概括为 `table_translator@custom_phrase`
- Risk: 不同方案的注册方式可能不同，直接写死容易过度泛化
- Validation: 检查主流方案约定与教程中的上下文是否只适用于特定方案
- Verdict: pending expert review
- Follow-up: 若属于方案约定而非通用规则，正文中必须标明适用范围
