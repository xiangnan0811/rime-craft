import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { useConfigStore } from '@/stores/config-store'
import { serializeDefaultConfig, serializePlatformConfig, serializeSchemaConfig, buildCustomYaml } from '@/lib/yaml/serializer'
import { serializeCustomPhrases } from '@/lib/config/custom-phrase'
import { FUZZY_RULE_DEFINITIONS } from '@/data/fuzzy-rules'
import { Button } from '@/components/ui/button'
import { getFormalPlatformFileName, isFormalEditorPlatform } from '@/lib/product/support-contract'

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
    const platformFile = isFormalEditorPlatform(project.targetPlatform)
      ? getFormalPlatformFileName(project.targetPlatform)
      : undefined
    if (platformFile && Object.keys(platformPatch).length > 0) {
      const platformPreserved = project.preserved[platformFile]
      zip.file(platformFile, buildCustomYaml(platformPatch, platformPreserved as Record<string, unknown> | undefined))
    }

    // Schema-specific configs (fuzzy rules + switches + punctuator)
    for (const [schemaId, schemaConfig] of Object.entries(project.schemaConfigs)) {
      const schemaPatch: Record<string, unknown> = {}

      // Fuzzy rules
      const enabledRules = schemaConfig.fuzzyRules.filter((r) => r.enabled)
      if (enabledRules.length > 0) {
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
          schemaPatch['speller/algebra/@before 0'] = algebraRules
        }
      }

      // Switches + punctuator
      const schemaExtra = serializeSchemaConfig(schemaConfig)
      Object.assign(schemaPatch, schemaExtra)

      if (Object.keys(schemaPatch).length > 0) {
        zip.file(`${schemaId}.custom.yaml`, buildCustomYaml(schemaPatch))
      }
    }

    // custom_phrase.txt
    if (project.customPhrases.length > 0) {
      zip.file('custom_phrase.txt', serializeCustomPhrases(project.customPhrases))
    }

    const blob = await zip.generateAsync({ type: 'blob' })
    saveAs(blob, 'rime-config.zip')
  }

  return <Button size="sm" onClick={handleExport}>导出配置</Button>
}
