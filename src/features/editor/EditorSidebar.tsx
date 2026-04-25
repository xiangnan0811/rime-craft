import { useState } from 'react'
import { BookOpen, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useConfigStore } from '@/stores/config-store'
import { getSchemaCapabilities } from '@/data/schema-registry'
import {
  MODULE_REGISTRY, MODULE_GROUPS, getModulesForSchema, groupModules,
  type ModuleDefinition,
} from '@/data/module-registry'
import { WorkbenchPanel } from '@/components/shared/WorkbenchPanel'
import { Button } from '@/components/ui/button'

interface EditorSidebarProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function EditorSidebar({ mobileOpen = false, onMobileClose }: EditorSidebarProps = {}) {
  const activeModule = useConfigStore((s) => s.activeModule)
  const setActiveModule = useConfigStore((s) => s.setActiveModule)
  const schemaList = useConfigStore((s) => s.project.defaultConfig.schemaList)
  const [showAll, setShowAll] = useState(false)

  function handleSelect(id: ModuleDefinition['id']) {
    setActiveModule(id)
    onMobileClose?.()
  }

  const primarySchemaId = schemaList[0]?.schema ?? ''
  const capabilities = getSchemaCapabilities(primarySchemaId)
  const applicableModules = getModulesForSchema(capabilities)
  const displayModules = showAll ? MODULE_REGISTRY : applicableModules
  const grouped = groupModules(displayModules)

  function isModuleApplicable(mod: ModuleDefinition): boolean {
    if (mod.applicability.type === 'universal') return true
    if (mod.applicability.type === 'capability') {
      return capabilities.includes(mod.applicability.cap)
    }
    return false
  }

  return (
    <>
      {mobileOpen ? (
        <div
          className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm md:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      ) : null}

      <nav
        className={cn(
          'h-full min-h-0',
          mobileOpen
            ? 'fixed inset-y-0 left-0 z-50 w-72 p-3 md:hidden'
            : 'hidden md:block',
        )}
        aria-label="模块导航"
      >
        <WorkbenchPanel
          title="模块导航"
          subtitle={showAll ? '显示全部模块，并标记当前方案不可用项。' : '按当前主方案能力展示最相关的编辑模块。'}
          actions={mobileOpen && onMobileClose ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMobileClose}
              aria-label="关闭模块导航"
              className="h-8 w-8 md:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          ) : null}
          className="flex h-full min-h-0 flex-col overflow-hidden bg-background/90 backdrop-blur-sm"
        >
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 space-y-4 overflow-y-auto pr-1">
              {MODULE_GROUPS.map((group) => {
                const modules = grouped.get(group.id)
                if (!modules || modules.length === 0) return null

                const applicableCount = modules.filter(isModuleApplicable).length

                return (
                  <section key={group.id} className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                        {group.label}
                      </h3>
                      {showAll ? (
                        <span className="text-[11px] text-muted-foreground">
                          {applicableCount}/{modules.length}
                        </span>
                      ) : null}
                    </div>

                    <ul className="space-y-1">
                      {modules.map((mod) => {
                        const applicable = isModuleApplicable(mod)
                        return (
                          <li key={mod.id}>
                            <button
                              onClick={() => handleSelect(mod.id)}
                              disabled={!applicable && !showAll}
                              className={cn(
                                'w-full rounded-xl px-3 py-2.5 text-left text-sm transition-colors duration-200',
                                activeModule === mod.id
                                  ? 'bg-accent text-accent-foreground shadow-sm'
                                  : applicable
                                    ? 'text-foreground/80 hover:bg-accent/70 hover:text-foreground'
                                    : 'cursor-default text-muted-foreground/60',
                              )}
                            >
                              <span>{mod.label}</span>
                              {!applicable && showAll ? (
                                <span className="ml-1 text-xs">🔒</span>
                              ) : null}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </section>
                )
              })}
            </div>

            <div className="mt-3 border-t border-border/80 pt-3">
              <button
                onClick={() => setShowAll(!showAll)}
                className="flex w-full items-center gap-1.5 rounded-xl px-3 py-2 text-left text-sm text-muted-foreground transition-colors duration-200 hover:bg-accent/60 hover:text-foreground"
              >
                {showAll ? (
                  '隐藏不适用的模块'
                ) : (
                  <>
                    <BookOpen className="h-3.5 w-3.5" />
                    查看所有模块…
                  </>
                )}
              </button>
            </div>
          </div>
        </WorkbenchPanel>
      </nav>
    </>
  )
}
