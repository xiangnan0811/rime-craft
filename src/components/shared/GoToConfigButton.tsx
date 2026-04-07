import { useNavigate } from 'react-router-dom'
import { useConfigStore } from '@/stores/config-store'
import { Button } from '@/components/ui/button'
import type { EditorModule } from '@/types/config'

interface GoToConfigButtonProps {
  module: EditorModule;
  label?: string;
}

export function GoToConfigButton({ module, label }: GoToConfigButtonProps) {
  const navigate = useNavigate()
  const setActiveModule = useConfigStore((s) => s.setActiveModule)

  function handleClick() {
    setActiveModule(module)
    navigate('/editor')
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} className="my-2">
      🔧 {label ?? '去配置'}
    </Button>
  )
}
