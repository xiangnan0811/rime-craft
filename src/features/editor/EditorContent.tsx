import { Suspense } from 'react'
import { useConfigStore } from '@/stores/config-store'
import { ModuleWrapper } from './ModuleWrapper'
import { MODULE_COMPONENTS } from '@/data/module-registry'
import { ModuleErrorBoundary } from '@/components/shared/ModuleErrorBoundary'

export function EditorContent() {
  const activeModule = useConfigStore((s) => s.activeModule)

  const Component = MODULE_COMPONENTS[activeModule]

  if (!Component) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-2xl text-muted-foreground">
          模块「{activeModule}」尚未实现。
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mx-auto max-w-2xl">
        <ModuleWrapper module={activeModule}>
          <ModuleErrorBoundary moduleName={activeModule}>
            <Suspense fallback={<div className="text-muted-foreground">加载中...</div>}>
              <Component />
            </Suspense>
          </ModuleErrorBoundary>
        </ModuleWrapper>
      </div>
    </div>
  )
}
