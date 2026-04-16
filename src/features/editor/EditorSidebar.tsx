import { useState } from 'react'
import { BookOpen, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useConfigStore } from '@/stores/config-store'
import { getSchemaCapabilities } from '@/data/schema-registry'
import {
  MODULE_REGISTRY, MODULE_GROUPS, getModulesForSchema, groupModules,
  type ModuleDefinition,
} from '@/data/module-registry'
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
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}
      <nav
        className={cn(
          'flex-shrink-0 overflow-y-auto border-r bg-muted/30',
          'md:block md:w-60',
          mobileOpen
            ? 'fixed inset-y-0 left-0 z-50 w-72 shadow-xl md:static md:shadow-none'
            : 'hidden',
        )}
      >
        {mobileOpen && onMobileClose && (
          <div className="flex items-center justify-between border-b px-3 py-2 md:hidden">
            <span className="text-sm font-semibold">模块</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={onMobileClose}
              aria-label="关闭模块导航"
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="p-4">
        {MODULE_GROUPS.map((group) => {
          const modules = grouped.get(group.id)
          if (!modules || modules.length === 0) return null

          const applicableCount = modules.filter(isModuleApplicable).length

          return (
            <div key={group.id} className="mb-4">
              <div className="mb-1 flex items-center justify-between px-3">
                <h3 className="text-xs font-semibold uppercase text-muted-foreground">
                  {group.label}
                </h3>
                {showAll && (
                  <span className="text-xs text-muted-foreground">
                    {applicableCount}/{modules.length}
                  </span>
                )}
              </div>
              <ul className="space-y-0.5">
                {modules.map((mod) => {
                  const applicable = isModuleApplicable(mod)
                  return (
                    <li key={mod.id}>
                      <button
                        onClick={() => handleSelect(mod.id)}
                        disabled={!applicable && !showAll}
                        className={cn(
                          'w-full rounded-md px-3 py-2 text-left text-sm transition-colors',
                          activeModule === mod.id
                            ? 'bg-background font-medium text-foreground shadow-sm'
                            : applicable
                              ? 'text-foreground/80 hover:bg-accent hover:text-accent-foreground'
                              : 'cursor-default text-muted-foreground/60',
                        )}
                      >
                        <span>{mod.label}</span>
                        {!applicable && showAll && (
                          <span className="ml-1 text-xs">🔒</span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}

        <div className="mt-2 border-t pt-2">
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex w-full items-center gap-1.5 px-3 py-2 text-left text-sm text-muted-foreground hover:text-foreground"
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
      </nav>
    </>
  )
}
