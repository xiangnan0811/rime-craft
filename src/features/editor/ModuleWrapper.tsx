import { useState, useRef, useCallback, lazy, Suspense } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useConfigStore } from '@/stores/config-store'
import { createSourceFilesFromProject } from '@/lib/workspace/source-files'
import { rebuildWorkspaceFromSourceFiles } from '@/features/share/importer'
import {
  extractModuleYaml,
  extractModuleYamlFromSourceFile,
  applyModuleYaml,
  applyModuleYamlToSourceFile,
  resolveModuleSourceFile,
} from '@/lib/yaml/module-yaml'

const YamlEditor = lazy(() =>
  import('@/components/shared/YamlEditor').then((m) => ({ default: m.YamlEditor }))
)

interface ModuleWrapperProps {
  module: string;
  children: React.ReactNode;
}

export function ModuleWrapper({ module, children }: ModuleWrapperProps) {
  const project = useConfigStore((s) => s.project)
  const sourceFiles = useConfigStore((s) => s.sourceFiles)
  const replaceWorkspace = useConfigStore((s) => s.replaceWorkspace)
  const [parseError, setParseError] = useState<string>()
  const [yamlValue, setYamlValue] = useState('')
  const sourceRef = useRef<'form' | 'yaml'>('form')
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  // When switching to YAML tab, extract current state
  const handleTabChange = useCallback(
    (value: string) => {
      if (value === 'yaml') {
        sourceRef.current = 'form'
        const sourceFile = resolveModuleSourceFile(module, project, sourceFiles)
        setYamlValue(
          sourceFile
            ? extractModuleYamlFromSourceFile(module, sourceFile)
            : extractModuleYaml(module, project),
        )
        setParseError(undefined)
      }
    },
    [module, project, sourceFiles],
  )

  const handleYamlChange = useCallback(
    (value: string) => {
      setYamlValue(value)
      setParseError(undefined)

      if (debounceRef.current) clearTimeout(debounceRef.current)

      debounceRef.current = setTimeout(() => {
        sourceRef.current = 'yaml'
        const state = useConfigStore.getState()
        const currentSourceFile = resolveModuleSourceFile(
          module,
          state.project,
          state.sourceFiles,
        )

        let nextSourceFiles = state.sourceFiles
        if (currentSourceFile) {
          const artifactResult = applyModuleYamlToSourceFile(
            module,
            value,
            currentSourceFile,
          )
          if (artifactResult.error) {
            setParseError(artifactResult.error)
            return
          }

          nextSourceFiles = {
            ...state.sourceFiles,
            [artifactResult.sourceFile.fileName]: artifactResult.sourceFile,
          }
        }

        const result = applyModuleYaml(module, value, state.project)
        if (result.error) {
          setParseError(result.error)
        } else {
          const rebuiltWorkspace = currentSourceFile
            ? rebuildWorkspaceFromSourceFiles(nextSourceFiles)
            : undefined

          if (rebuiltWorkspace?.summary.errors.length) {
            setParseError(rebuiltWorkspace.summary.errors.join('\n'))
            return
          }

          replaceWorkspace(
            rebuiltWorkspace?.project ?? result.project,
            rebuiltWorkspace?.sourceFiles ??
              createSourceFilesFromProject(result.project),
          )
        }
      }, 300)
    },
    [module, replaceWorkspace],
  )

  return (
    <Tabs defaultValue="form" onValueChange={handleTabChange}>
      <TabsList className="mb-4">
        <TabsTrigger value="form">表单模式</TabsTrigger>
        <TabsTrigger value="yaml">YAML 模式</TabsTrigger>
      </TabsList>
      <TabsContent value="form">{children}</TabsContent>
      <TabsContent value="yaml">
        <Suspense
          fallback={
            <div className="rounded-md border border-dashed p-8 text-center text-gray-400">
              加载编辑器...
            </div>
          }
        >
          <YamlEditor value={yamlValue} onChange={handleYamlChange} error={parseError} />
        </Suspense>
      </TabsContent>
    </Tabs>
  )
}
