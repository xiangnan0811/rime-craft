import { useNavigate } from 'react-router-dom'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useConfigStore } from '@/stores/config-store'
import { createEmptyProject } from '@/lib/config/defaults'
import { PRESET_THEMES } from '@/data/preset-themes'
import { SCHEMA_REGISTRY } from '@/data/schema-registry'
import type { FormalEditorPlatform } from '@/lib/product/support-contract'
import {
  serializeDefaultConfig,
  serializePlatformConfig,
  buildCustomYaml,
} from '@/lib/yaml/serializer'
import type { RimeProject } from '@/types/config'
import type { WizardState } from '../WizardPage'

function getPlatformFileName(platform: FormalEditorPlatform) {
  switch (platform) {
    case 'macos':
      return 'squirrel.custom.yaml'
    case 'windows':
      return 'weasel.custom.yaml'
  }
}

function buildProject(state: WizardState): RimeProject {
  const project = createEmptyProject()
  project.targetPlatform = state.platform
  project.defaultConfig.schemaList = [{ schema: state.schemaId }]
  project.defaultConfig.pageSize = state.pageSize
  project.defaultConfig.asciiComposer.switchKey.shiftL = state.shiftLBehavior
  project.platformConfig.platform = state.platform
  for (const app of state.asciiModeApps) {
    project.platformConfig.appOptions[app] = { asciiMode: true }
  }
  const theme = PRESET_THEMES.find((t) => t.name === state.themeName)
  if (theme) {
    project.platformConfig.style = structuredClone(theme)
  }
  return project
}

interface ExportStepProps {
  state: WizardState
}

export function ExportStep({ state }: ExportStepProps) {
  const loadProject = useConfigStore((s) => s.loadProject)
  const navigate = useNavigate()

  const schemaName =
    SCHEMA_REGISTRY.find((s) => s.id === state.schemaId)?.name ?? state.schemaId

  async function handleExport() {
    const project = buildProject(state)
    const zip = new JSZip()

    const defaultPatch = serializeDefaultConfig(project.defaultConfig)
    zip.file('default.custom.yaml', buildCustomYaml(defaultPatch))

    const platformPatch = serializePlatformConfig(project.platformConfig)
    if (Object.keys(platformPatch).length > 0) {
      const platformFile = getPlatformFileName(state.platform)
      zip.file(platformFile, buildCustomYaml(platformPatch))
    }

    const blob = await zip.generateAsync({ type: 'blob' })
    saveAs(blob, 'rime-config.zip')
  }

  function handleContinueEdit() {
    const project = buildProject(state)
    loadProject(project)
    navigate('/editor')
  }

  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold">配置完成</h2>
      <p className="mb-6 text-sm text-gray-500">
        请确认以下配置，然后选择导出或继续编辑。
      </p>

      <div className="rounded-lg border bg-gray-50 p-4">
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">平台</dt>
            <dd className="font-medium">{state.platform}</dd>
          </div>
          <Separator />
          <div className="flex justify-between">
            <dt className="text-gray-500">输入方案</dt>
            <dd className="font-medium">{schemaName}</dd>
          </div>
          <Separator />
          <div className="flex justify-between">
            <dt className="text-gray-500">候选词数量</dt>
            <dd className="font-medium">{state.pageSize}</dd>
          </div>
          <Separator />
          <div className="flex justify-between">
            <dt className="text-gray-500">左 Shift</dt>
            <dd className="font-medium">{state.shiftLBehavior}</dd>
          </div>
          <Separator />
          <div className="flex justify-between">
            <dt className="text-gray-500">英文模式应用</dt>
            <dd className="font-medium">
              {state.asciiModeApps.length > 0
                ? state.asciiModeApps.join(', ')
                : '无'}
            </dd>
          </div>
          <Separator />
          <div className="flex justify-between">
            <dt className="text-gray-500">主题</dt>
            <dd className="font-medium">{state.themeName}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-8 flex justify-center gap-4">
        <Button onClick={handleExport}>导出配置</Button>
        <Button variant="outline" onClick={handleContinueEdit}>
          继续编辑
        </Button>
      </div>
    </div>
  )
}
