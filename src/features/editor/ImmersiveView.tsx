import { lazy, Suspense, useMemo } from 'react'
import { useConfigStore } from '@/stores/config-store'
import { MODULE_REGISTRY } from '@/data/module-registry'
import { MDX_LOADERS } from '@/data/tutorial-loaders'
import { EditorContext } from './EditorContext'

interface ImmersiveViewProps {
  onExitImmersive: () => void;
}

export function ImmersiveView({ onExitImmersive }: ImmersiveViewProps) {
  const activeModule = useConfigStore((s) => s.activeModule)
  const moduleDef = MODULE_REGISTRY.find((m) => m.id === activeModule)
  const slug = moduleDef?.tutorialSlug ?? activeModule

  const MdxContent = useMemo(() => {
    const loader = MDX_LOADERS[slug]
    if (!loader) return null
    return lazy(loader)
  }, [slug])

  return (
    <EditorContext.Provider value={{ isImmersive: true }}>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-2xl">
          <button onClick={onExitImmersive} className="mb-4 text-sm text-blue-500 hover:text-blue-700">
            ← 返回面板模式
          </button>
          <div className="prose prose-sm max-w-none">
            {MdxContent ? (
              <Suspense fallback={<div className="text-gray-400">加载教程...</div>}>
                <MdxContent />
              </Suspense>
            ) : (
              <p className="text-gray-400">暂无此模块的教程内容</p>
            )}
          </div>
        </div>
      </div>
    </EditorContext.Provider>
  )
}
