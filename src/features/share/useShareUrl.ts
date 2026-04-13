import { useEffect, useRef } from 'react'
import { useConfigStore } from '@/stores/config-store'
import { parseShareUrl } from '@/lib/compress/share'
import {
  applyModuleYamlToWorkspace,
} from '@/lib/yaml/module-yaml'

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
    const result = applyModuleYamlToWorkspace(
      shared.module,
      shared.yaml,
      state.project,
      state.sourceFiles,
    )
    if (!result.error) {
      replaceWorkspace(result.project, result.sourceFiles)
      setActiveModule(shared.module)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [replaceWorkspace, setActiveModule])
}
