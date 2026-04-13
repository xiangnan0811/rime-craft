import { useEffect, useRef } from 'react'
import { useConfigStore } from '@/stores/config-store'
import { parseShareUrl } from '@/lib/compress/share'
import {
  applyModuleYaml,
  applyModuleYamlToSourceFile,
  resolveModuleSourceFile,
} from '@/lib/yaml/module-yaml'
import { createSourceFilesFromProject } from '@/lib/workspace/source-files'
import { rebuildWorkspaceFromSourceFiles } from './importer'

export function useShareUrl() {
  const replaceWorkspace = useConfigStore((s) => s.replaceWorkspace)
  const setActiveModule = useConfigStore((s) => s.setActiveModule)
  const applied = useRef(false)

  useEffect(() => {
    if (applied.current) return
    applied.current = true

    const shared = parseShareUrl(window.location.search)
    if (!shared) return

    const state = useConfigStore.getState()
    const project = state.project
    const result = applyModuleYaml(shared.module, shared.yaml, project)
    if (!result.error) {
      const currentSourceFile = resolveModuleSourceFile(
        shared.module,
        state.project,
        state.sourceFiles,
      )

      if (currentSourceFile) {
        const artifactResult = applyModuleYamlToSourceFile(
          shared.module,
          shared.yaml,
          currentSourceFile,
        )
        if (artifactResult.error) {
          return
        }

        const nextSourceFiles = {
          ...state.sourceFiles,
          [artifactResult.sourceFile.fileName]: artifactResult.sourceFile,
        }
        const rebuiltWorkspace = rebuildWorkspaceFromSourceFiles(nextSourceFiles)
        if (rebuiltWorkspace.summary.errors.length > 0) {
          return
        }

        replaceWorkspace(rebuiltWorkspace.project, rebuiltWorkspace.sourceFiles)
        setActiveModule(shared.module)
        window.history.replaceState({}, '', window.location.pathname)
        return
      }

      replaceWorkspace(
        result.project,
        createSourceFilesFromProject(result.project),
      )
      setActiveModule(shared.module)
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [replaceWorkspace, setActiveModule])
}
