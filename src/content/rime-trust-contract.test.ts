import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const contentDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)))
const read = (fileName: string) =>
  fs.readFileSync(path.join(contentDir, fileName), 'utf8')

const expectLinuxDeployFallbackContract = (source: string) => {
  expect(source).toMatch(/Linux/)
  expect(source).toMatch(/优先/)
  expect(source).toMatch(/重新部署|Deploy/)
  expect(source).toMatch(/命令行/)
  expect(source).toMatch(/环境相关|补充|fallback/)
}

describe('public trust content contract', () => {
  it('keeps installation.yaml sync examples out of patch syntax', () => {
    const dictionary = read('dictionary.mdx')
    expect(dictionary).not.toMatch(/patch:\s+installation_id:/)
    expect(dictionary).toMatch(/installation\.yaml/)
  })

  it('describes preset loading honestly as install-prerequisite plus redeploy, not schema installation', () => {
    const whatIsRime = read('what-is-rime.mdx')
    const schemaManager = read('schema-manager.mdx')

    expect(whatIsRime).toMatch(/方案资料并载入.*预设配置/)
    expect(whatIsRime).toMatch(/仍需先把对应方案文件安装到用户目录/)
    expect(whatIsRime).toMatch(/再执行重新部署/)

    expect(schemaManager).toMatch(/预设配置模板/)
    expect(schemaManager).toMatch(/前提是目标设备已安装相应方案文件/)
    expect(schemaManager).toMatch(/不会替代上游方案包安装/)
    expect(schemaManager).toMatch(/放入 Rime 用户目录/)

    expect(whatIsRime).not.toMatch(/无需手动下载配置文件/)
    expect(schemaManager).not.toMatch(/可以直接通过编辑器添加，无需手动配置文件/)
  })

  it('treats Linux deploy commands as frontend-first and CLI-fallback-only across the assigned guides', () => {
    const firstDeploy = read('first-deploy.mdx')
    const whatIsRime = read('what-is-rime.mdx')
    const schemaManager = read('schema-manager.mdx')
    const spellingScheme = read('spelling-scheme.mdx')

    expectLinuxDeployFallbackContract(firstDeploy)
    expectLinuxDeployFallbackContract(whatIsRime)
    expectLinuxDeployFallbackContract(schemaManager)
    expectLinuxDeployFallbackContract(spellingScheme)

    expect(firstDeploy).toMatch(/旧版本|老版本|workaround/)
    expect(firstDeploy).not.toMatch(/ibus-daemon -drx/)
    expect(whatIsRime).not.toMatch(/Linux 执行 `ibus-daemon -drx` 或等效命令/)
    expect(schemaManager).not.toMatch(/Linux 使用 `ibus-daemon -drx` 或对应命令/)
    expect(spellingScheme).not.toMatch(/Linux：`ibus-daemon -drx` 或对应命令/)
  })

  it('describes built-in sync as user-dictionary-first plus config backup without safe merge', () => {
    const multi = read('multi-device-sync.mdx')

    expect(multi).toMatch(/用户词典/)
    expect(multi).toMatch(/备份和分发|单向.*备份/)
    expect(multi).toMatch(/没有可靠的冲突合并机制|不做三向合并/)
    expect(multi).not.toMatch(/内置同步不处理这些文件/)
  })

  it('does not present a repo-local Linux ibus sync command as the default path', () => {
    const multi = read('multi-device-sync.mdx')

    expect(multi).toMatch(/Linux（ibus-rime）/)
    expect(multi).toMatch(/前端.*用户资料同步|以当前前端.*说明为准/)
    expect(multi).not.toMatch(/rime_api_console --sync/)
  })
})
