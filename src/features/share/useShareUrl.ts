import { useEffect, useRef } from 'react'
import { useConfigStore } from '@/stores/config-store'
import { parseShareUrl } from '@/lib/compress/share'
import { applyModuleYaml } from '@/lib/yaml/module-yaml'
import { createSourceFilesFromProject } from '@/lib/workspace/source-files'

export function useShareUrl() {
  const replaceWorkspace = useConfigStore((s) => s.replaceWorkspace)
  const setActiveModule = useConfigStore((s) => s.setActiveModule)
  const applied = useRef(false)

  useEffect(() => {
    if (applied.current) return
    applied.current = true

    const shared = parseShareUrl(window.location.search)
    if (!shared) return

    const project = useConfigStore.getState().project
    const result = applyModuleYaml(shared.module, shared.yaml, project)
    if (!result.error) {
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
