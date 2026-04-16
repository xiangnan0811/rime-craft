import { useState, useRef, useCallback, lazy, Suspense } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useConfigStore } from '@/stores/config-store'
import {
  applyModuleYamlToWorkspace,
  extractModuleYamlFromWorkspace,
} from '@/lib/yaml/module-yaml'
import type { EditorModule } from '@/types/config'

const YamlEditor = lazy(() =>
  import('@/components/shared/YamlEditor').then((m) => ({ default: m.YamlEditor }))
)

interface ModuleWrapperProps {
  module: EditorModule;
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
        setYamlValue(extractModuleYamlFromWorkspace(module, project, sourceFiles))
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
        const result = applyModuleYamlToWorkspace(
          module,
          value,
          state.project,
          state.sourceFiles,
        )
        if (result.error) {
          setParseError(result.error)
        } else {
          replaceWorkspace(result.project, result.sourceFiles)
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
            <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
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
