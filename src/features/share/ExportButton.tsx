import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { useConfigStore } from '@/stores/config-store'
import { serializeDefaultConfig, serializePlatformConfig, buildCustomYaml } from '@/lib/yaml/serializer'
import { FUZZY_RULE_DEFINITIONS } from '@/data/fuzzy-rules'
import { Button } from '@/components/ui/button'

export function ExportButton() {
  const project = useConfigStore((s) => s.project)

  async function handleExport() {
    const zip = new JSZip()

    // default.custom.yaml
    const defaultPatch = serializeDefaultConfig(project.defaultConfig)
    const defaultPreserved = project.preserved['default.custom.yaml']
    zip.file('default.custom.yaml', buildCustomYaml(defaultPatch, defaultPreserved as Record<string, unknown> | undefined))

    // Platform config
    const platformPatch = serializePlatformConfig(project.platformConfig)
    if (Object.keys(platformPatch).length > 0) {
      const platformFile = project.targetPlatform === 'windows' ? 'weasel.custom.yaml' : 'squirrel.custom.yaml'
      const platformPreserved = project.preserved[platformFile]
      zip.file(platformFile, buildCustomYaml(platformPatch, platformPreserved as Record<string, unknown> | undefined))
    }

    // Schema-specific configs (fuzzy rules)
    for (const [schemaId, schemaConfig] of Object.entries(project.schemaConfigs)) {
      const enabledRules = schemaConfig.fuzzyRules.filter((r) => r.enabled)
      if (enabledRules.length === 0) continue

      const algebraRules: string[] = []
      const seenRules = new Set<string>()
      for (const rule of enabledRules) {
        const def = FUZZY_RULE_DEFINITIONS.find((d) => d.id === rule.ruleId)
        if (!def) continue
        for (const expr of def.algebraRules) {
          if (!seenRules.has(expr)) {
            seenRules.add(expr)
            algebraRules.push(expr)
          }
        }
      }

      if (algebraRules.length > 0) {
        const patch: Record<string, unknown> = { 'speller/algebra/@before 0': algebraRules }
        zip.file(`${schemaId}.custom.yaml`, buildCustomYaml(patch))
      }
    }

    const blob = await zip.generateAsync({ type: 'blob' })
    saveAs(blob, 'rime-config.zip')
  }

  return <Button size="sm" onClick={handleExport}>导出配置</Button>
}
