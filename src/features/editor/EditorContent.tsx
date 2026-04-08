import { Suspense } from 'react'
import { useConfigStore } from '@/stores/config-store'
import { ModuleWrapper } from './ModuleWrapper'
import { MODULE_COMPONENTS, MODULE_REGISTRY } from '@/data/module-registry'

export function EditorContent() {
  const activeModule = useConfigStore((s) => s.activeModule)

  const Component = MODULE_COMPONENTS[activeModule]

  if (!Component) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-2xl text-gray-400">
          模块「{activeModule}」尚未实现。
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mx-auto max-w-2xl">
        <ModuleWrapper module={activeModule}>
          <Suspense fallback={<div className="text-gray-400">加载中...</div>}>
            <Component />
          </Suspense>
        </ModuleWrapper>
      </div>
    </div>
  )
}
