import { lazy, Suspense, useMemo, useState } from 'react'
import { BookOpen } from 'lucide-react'
import { MDXProvider } from '@mdx-js/react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useConfigStore } from '@/stores/config-store'
import { MODULE_REGISTRY } from '@/data/module-registry'
import { MDX_LOADERS } from '@/data/tutorial-loaders'
import { mdxComponents } from '@/components/shared/mdx-components'

/**
 * Mobile-only entry point for the editor's tutorial content. On ≥md viewports
 * the standard `TutorialPanel` renders beside the form; below `md`, that panel
 * is hidden, and this dialog provides access to the same MDX body.
 */
export function MobileTutorialDialog() {
  const [open, setOpen] = useState(false)
  const activeModule = useConfigStore((s) => s.activeModule)
  const moduleDef = MODULE_REGISTRY.find((m) => m.id === activeModule)
  const slug = moduleDef?.tutorialSlug ?? activeModule

  const MdxContent = useMemo(() => {
    const loader = MDX_LOADERS[slug]
    if (!loader) return null
    return lazy(loader)
  }, [slug])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 md:hidden"
          aria-label="打开教程"
        >
          <BookOpen className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            {moduleDef?.label ? `${moduleDef.label} · 教程` : '教程'}
          </DialogTitle>
        </DialogHeader>
        <div className="prose prose-sm max-w-none">
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
      </DialogContent>
    </Dialog>
  )
}
