import { cn } from '@/lib/utils'
import { useConfigStore } from '@/stores/config-store'
import type { EditorModule } from '@/types/config'

const MODULES: { id: EditorModule; label: string }[] = [
  { id: 'schema-manager', label: '输入方案管理' },
  { id: 'candidate-settings', label: '候选词设置' },
  { id: 'key-bindings', label: '按键绑定' },
  { id: 'fuzzy-pinyin', label: '模糊音规则' },
  { id: 'ascii-mode', label: '中英文切换' },
]

export function EditorSidebar() {
  const activeModule = useConfigStore((s) => s.activeModule)
  const setActiveModule = useConfigStore((s) => s.setActiveModule)

  return (
    <nav className="w-60 border-r bg-gray-50">
      <div className="p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-500">配置模块</h2>
        <ul className="space-y-1">
          {MODULES.map((mod) => (
            <li key={mod.id}>
              <button
                onClick={() => setActiveModule(mod.id)}
                className={cn(
                  'w-full rounded-md px-3 py-2 text-left text-sm transition-colors',
                  activeModule === mod.id
                    ? 'bg-white font-medium text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100',
                )}
              >
                {mod.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
