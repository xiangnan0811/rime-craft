import { lazy, Suspense, useMemo } from 'react'
import { MDXProvider } from '@mdx-js/react'
import { BookOpen } from 'lucide-react'
import { useConfigStore } from '@/stores/config-store'
import { MODULE_REGISTRY } from '@/data/module-registry'
import { MDX_LOADERS } from '@/data/tutorial-loaders'
import { mdxComponents } from '@/components/shared/mdx-components'

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
      <div className="flex w-10 flex-shrink-0 flex-col items-center border-l bg-muted/30 pt-4">
        <button
          onClick={onToggleCollapse}
          className="text-muted-foreground hover:text-foreground"
          title="展开教程面板"
          aria-label="展开教程面板"
        >
          <BookOpen className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="w-[420px] flex-shrink-0 overflow-y-auto border-l bg-muted/20">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <BookOpen className="h-3.5 w-3.5" />
          教程
        </span>
        <div className="flex gap-2">
          <button onClick={onEnterImmersive} className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
            沉浸模式 →
          </button>
          <button onClick={onToggleCollapse} className="text-xs text-muted-foreground hover:text-foreground">
            收起
          </button>
        </div>
      </div>
      <div className="prose prose-sm max-w-none p-4">
        <MDXProvider components={mdxComponents}>
          {MdxContent ? (
            <Suspense fallback={<div className="text-muted-foreground">加载教程...</div>}>
              <MdxContent />
            </Suspense>
          ) : (
            <p className="text-muted-foreground">暂无此模块的教程内容</p>
          )}
        </MDXProvider>
      </div>
    </div>
  )
}
