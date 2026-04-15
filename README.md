# Rime Craft

Rime Craft 是一个面向 Rime 的可视化配置编辑器与教程站。项目当前**正式支持 macOS / Windows 的导入导出**，并继续提供覆盖 Linux / Android / iOS 的 Rime 生态知识内容。


## 项目边界

- 正式支持：macOS / Windows 导入导出与相关平台文件处理
- 教程覆盖：Linux、Android、iOS 等 Rime 生态可用平台的安装、同步、方案知识
- 当前不承担：自动下载或安装上游 schema / dict 方案包
- 当前不保证：注释保真 round-trip、自动本地保存、所有平台导入导出完全等价

## 本地开发

```bash
npm install
npm test
npx tsc -b
npm run build
npm run dev
```

## 与 Rime / 上游方案的关系

- 本项目不是 Rime 官方项目
- 本项目不会替代上游方案安装流程
- 使用雾凇拼音、万象拼音等方案前，仍需按各自官方文档把方案文件安装到 Rime 用户目录

## 贡献建议

- 事实性教程改动请优先附上官方或上游仓库依据
- 新增或修改涉及 deploy / sync / installation / custom_phrase / 平台支持 / 方案对比等高风险 truth surface 的内容前，请先按 `docs/CONTENT_DEPTH_GUIDE.md` 中的真值分层与来源裁决规则收敛表述，并同步补至少一个对应契约测试或语义测试。
