import { Suspense } from 'react'
import { Zap } from 'lucide-react'
import { useEditorContext } from '@/features/editor/EditorContext'
import { MODULE_COMPONENTS } from '@/data/module-registry'
import type { EditorModule } from '@/types/config'

interface ConfigSlotProps {
  module: EditorModule;
  label?: string;
}

export function ConfigSlot({ module, label }: ConfigSlotProps) {
  const { isImmersive } = useEditorContext()

  if (isImmersive) {
    const Component = MODULE_COMPONENTS[module]
    if (!Component) return null

    return (
      <div className="my-6 rounded-lg border-2 border-blue-500 bg-blue-50/30 p-4 dark:bg-blue-950/20">
        <div className="mb-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded bg-blue-500 px-2 py-0.5 text-xs text-white">
            <Zap className="h-3 w-3" aria-hidden="true" />
            在此配置
          </span>
          <span className="text-xs text-muted-foreground">你的修改会实时生效</span>
        </div>
        <Suspense fallback={<div className="text-muted-foreground">加载中...</div>}>
          <Component />
        </Suspense>
      </div>
    )
  }

  // In non-immersive context (docs page or panel mode), render a link
  return (
    <a
      href={`/editor`}
      className="my-4 inline-flex items-center gap-1 rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-600 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/40"
    >
      <Zap className="h-3.5 w-3.5" aria-hidden="true" />
      {label ?? '在编辑器中配置'}
    </a>
  )
}
