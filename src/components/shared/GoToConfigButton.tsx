import { useNavigate } from 'react-router-dom'
import { useConfigStore } from '@/stores/config-store'
import { ArrowRight, Wrench } from 'lucide-react'
import type { EditorModule } from '@/types/config'

interface GoToConfigButtonProps {
  module: EditorModule
  label?: string
}

export function GoToConfigButton({ module, label }: GoToConfigButtonProps) {
  const navigate = useNavigate()
  const setActiveModule = useConfigStore((s) => s.setActiveModule)

  function handleClick() {
    setActiveModule(module)
    navigate('/editor')
  }

  return (
    <button
      onClick={handleClick}
      className="my-6 flex w-full items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-left transition-colors hover:border-blue-300 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/30 dark:hover:border-blue-700 dark:hover:bg-blue-950/50"
    >
      <Wrench className="h-5 w-5 flex-shrink-0 text-blue-500" />
      <div className="flex-1">
        <div className="text-sm font-medium text-blue-900 dark:text-blue-200">
          {label ?? '在编辑器中配置'}
        </div>
        <div className="text-xs text-blue-600 dark:text-blue-400">
          Open in visual editor
        </div>
      </div>
      <ArrowRight className="h-4 w-4 text-blue-400" />
    </button>
  )
}
