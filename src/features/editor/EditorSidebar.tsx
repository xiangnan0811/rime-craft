import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useConfigStore } from '@/stores/config-store'
import { getSchemaCapabilities } from '@/data/schema-registry'
import {
  MODULE_REGISTRY, MODULE_GROUPS, getModulesForSchema, groupModules,
  type ModuleDefinition,
} from '@/data/module-registry'

export function EditorSidebar() {
  const activeModule = useConfigStore((s) => s.activeModule)
  const setActiveModule = useConfigStore((s) => s.setActiveModule)
  const schemaList = useConfigStore((s) => s.project.defaultConfig.schemaList)
  const [showAll, setShowAll] = useState(false)

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
    <nav className="w-60 flex-shrink-0 overflow-y-auto border-r bg-gray-50">
      <div className="p-4">
        {MODULE_GROUPS.map((group) => {
          const modules = grouped.get(group.id)
          if (!modules || modules.length === 0) return null

          const applicableCount = modules.filter(isModuleApplicable).length

          return (
            <div key={group.id} className="mb-4">
              <div className="mb-1 flex items-center justify-between px-3">
                <h3 className="text-xs font-semibold uppercase text-gray-400">
                  {group.label}
                </h3>
                {showAll && (
                  <span className="text-xs text-gray-400">
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
                        onClick={() => setActiveModule(mod.id)}
                        disabled={!applicable && !showAll}
                        className={cn(
                          'w-full rounded-md px-3 py-2 text-left text-sm transition-colors',
                          activeModule === mod.id
                            ? 'bg-white font-medium text-gray-900 shadow-sm'
                            : applicable
                              ? 'text-gray-600 hover:bg-gray-100'
                              : 'cursor-default text-gray-400',
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
            className="w-full px-3 py-2 text-left text-sm text-gray-400 hover:text-gray-600"
          >
            {showAll ? '隐藏不适用的模块' : '📖 查看所有模块...'}
          </button>
        </div>
      </div>
    </nav>
  )
}
