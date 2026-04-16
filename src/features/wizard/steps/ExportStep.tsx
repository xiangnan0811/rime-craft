import { useNavigate } from 'react-router-dom'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useConfigStore } from '@/stores/config-store'
import { createEmptyProject } from '@/lib/config/defaults'
import { createSourceFilesFromProject } from '@/lib/workspace/source-files'
import { PRESET_THEMES } from '@/data/preset-themes'
import { SCHEMA_REGISTRY } from '@/data/schema-registry'
import type { RimeProject } from '@/types/config'
import type { WizardState } from '../WizardPage'

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

function buildProjectArtifacts(state: WizardState) {
  const project = buildProject(state)

  return {
    project,
    sourceFiles: createSourceFilesFromProject(project),
  }
}

interface ExportStepProps {
  state: WizardState
}

export function ExportStep({ state }: ExportStepProps) {
  const replaceWorkspace = useConfigStore((s) => s.replaceWorkspace)
  const navigate = useNavigate()

  const schemaName =
    SCHEMA_REGISTRY.find((s) => s.id === state.schemaId)?.name ?? state.schemaId

  async function handleExport() {
    const { sourceFiles } = buildProjectArtifacts(state)
    const zip = new JSZip()

    for (const sourceFile of Object.values(sourceFiles)) {
      if (sourceFile.kind === 'schema' || sourceFile.kind === 'custom_phrase') {
        continue
      }

      zip.file(sourceFile.fileName, sourceFile.content)
    }

    const blob = await zip.generateAsync({ type: 'blob' })
    saveAs(blob, 'rime-config.zip')
  }

  function handleContinueEdit() {
    const { project, sourceFiles } = buildProjectArtifacts(state)
    replaceWorkspace(project, sourceFiles)
    navigate('/editor')
  }

  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold">配置完成</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        请确认以下配置，然后选择导出或继续编辑。
      </p>

      <div className="rounded-lg border bg-muted/50 p-4">
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">平台</dt>
            <dd className="font-medium">{state.platform}</dd>
          </div>
          <Separator />
          <div className="flex justify-between">
            <dt className="text-muted-foreground">输入方案</dt>
            <dd className="font-medium">{schemaName}</dd>
          </div>
          <Separator />
          <div className="flex justify-between">
            <dt className="text-muted-foreground">候选词数量</dt>
            <dd className="font-medium">{state.pageSize}</dd>
          </div>
          <Separator />
          <div className="flex justify-between">
            <dt className="text-muted-foreground">左 Shift</dt>
            <dd className="font-medium">{state.shiftLBehavior}</dd>
          </div>
          <Separator />
          <div className="flex justify-between">
            <dt className="text-muted-foreground">英文模式应用</dt>
            <dd className="font-medium">
              {state.asciiModeApps.length > 0
                ? state.asciiModeApps.join(', ')
                : '无'}
            </dd>
          </div>
          <Separator />
          <div className="flex justify-between">
            <dt className="text-muted-foreground">主题</dt>
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
