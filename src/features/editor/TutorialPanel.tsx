import { lazy, Suspense, useMemo } from 'react'
import { MDXProvider } from '@mdx-js/react'
import { BookOpen } from 'lucide-react'
import { WorkbenchPanel } from '@/components/shared/WorkbenchPanel'
import { Button } from '@/components/ui/button'
import { useConfigStore } from '@/stores/config-store'
import { MODULE_REGISTRY } from '@/data/module-registry'
import { MDX_LOADERS } from '@/data/tutorial-loaders'
import { mdxComponents } from '@/components/shared/mdx-components'

interface TutorialPanelProps {
  collapsed: boolean
  onToggleCollapse: () => void
  onEnterImmersive: () => void
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
      <div className="flex h-full w-14 flex-shrink-0 items-start justify-center">
        <div className="flex h-full w-full items-start justify-center rounded-2xl border border-border bg-background/80 px-2 py-4 shadow-sm">
          <button
            onClick={onToggleCollapse}
            className="text-muted-foreground transition-colors duration-200 hover:text-foreground"
            title="展开教程面板"
            aria-label="展开教程面板"
          >
            <BookOpen className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full">
      <WorkbenchPanel
        title={moduleDef?.label ? `${moduleDef.label} · 教程` : '教程'}
        subtitle="保留模块说明与沉浸式阅读入口，同时减轻面板头部的视觉压力。"
        actions={(
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={onEnterImmersive} className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground">
              沉浸模式
            </Button>
            <Button variant="ghost" size="sm" onClick={onToggleCollapse} className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground">
              收起
            </Button>
          </div>
        )}
        className="flex h-full min-h-0 flex-col overflow-hidden bg-background/80"
      >
        <div className="prose prose-sm min-h-0 max-w-none flex-1 overflow-y-auto pr-1">
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
      </WorkbenchPanel>
    </div>
  )
}
