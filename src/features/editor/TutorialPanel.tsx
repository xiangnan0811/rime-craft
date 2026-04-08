import { lazy, Suspense, useMemo } from 'react'
import { useConfigStore } from '@/stores/config-store'
import { MODULE_REGISTRY } from '@/data/module-registry'
import { MDX_LOADERS } from '@/data/tutorial-loaders'

interface TutorialPanelProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onEnterImmersive: () => void;
}

export function TutorialPanel({ collapsed, onToggleCollapse, onEnterImmersive }: TutorialPanelProps) {
  const activeModule = useConfigStore((s) => s.activeModule)
  const moduleDef = MODULE_REGISTRY.find((m) => m.id === activeModule)
  const slug = moduleDef?.tutorialSlug ?? activeModule

  const MdxContent = useMemo(() => {
    const loader = MDX_LOADERS[slug]
    if (!loader) return null
    return lazy(loader)
  }, [slug])

  if (collapsed) {
    return (
      <div className="flex w-10 flex-shrink-0 flex-col items-center border-l bg-gray-50 pt-4">
        <button onClick={onToggleCollapse} className="text-gray-400 hover:text-gray-600" title="展开教程面板">
          📖
        </button>
      </div>
    )
  }

  return (
    <div className="w-72 flex-shrink-0 overflow-y-auto border-l bg-gray-50/50">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-xs font-semibold text-gray-500">📖 教程</span>
        <div className="flex gap-2">
          <button onClick={onEnterImmersive} className="text-xs text-blue-500 hover:text-blue-700">
            沉浸模式 →
          </button>
          <button onClick={onToggleCollapse} className="text-xs text-gray-400 hover:text-gray-600">
            收起
          </button>
        </div>
      </div>
      <div className="prose prose-sm max-w-none p-4">
        {MdxContent ? (
          <Suspense fallback={<div className="text-gray-400">加载教程...</div>}>
            <MdxContent />
          </Suspense>
        ) : (
          <p className="text-gray-400">暂无此模块的教程内容</p>
        )}
      </div>
    </div>
  )
}
