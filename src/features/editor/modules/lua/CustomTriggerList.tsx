import { useState } from 'react'
import { useConfigStore } from '@/stores/config-store'
import { Button } from '@/components/ui/button'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { CustomTriggerForm } from './CustomTriggerForm'
import type { CustomTrigger } from '@/types/config'

interface CustomTriggerListProps {
  schemaId: string
}

export function CustomTriggerList({ schemaId }: CustomTriggerListProps) {
  const schemaConfigs = useConfigStore((s) => s.project.schemaConfigs)
  const addCustomTrigger = useConfigStore((s) => s.addCustomTrigger)
  const updateCustomTrigger = useConfigStore((s) => s.updateCustomTrigger)
  const deleteCustomTrigger = useConfigStore((s) => s.deleteCustomTrigger)

  const triggers = schemaConfigs[schemaId]?.specialInput?.customTriggers ?? []
  const scripts = schemaConfigs[schemaId]?.luaScripts ?? []

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<CustomTrigger | undefined>(undefined)

  function handleAdd() {
    setEditing(undefined)
    setFormOpen(true)
  }

  function handleEdit(trigger: CustomTrigger) {
    setEditing(trigger)
    setFormOpen(true)
  }

  function handleSubmit(data: Omit<CustomTrigger, 'id'>) {
    if (editing) {
      updateCustomTrigger(schemaId, editing.id, data)
    } else {
      addCustomTrigger(schemaId, data)
    }
  }

  function handleDelete(id: string) {
    if (window.confirm('确定删除此自定义触发器吗？')) {
      deleteCustomTrigger(schemaId, id)
    }
  }

  return (
    <div className="space-y-2">
      {triggers.length === 0 ? (
        <p className="text-xs text-muted-foreground">尚未添加自定义触发器。</p>
      ) : (
        <div className="space-y-1">
          {triggers.map((trigger) => {
            const script = scripts.find((s) => s.id === trigger.scriptId)
            return (
              <div
                key={trigger.id}
                className="flex items-center gap-3 rounded border border-gray-200 p-2 dark:border-slate-700"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{trigger.name}</span>
                    <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-700 dark:bg-slate-800 dark:text-slate-200">
                      {trigger.triggerCode}
                    </code>
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {script ? `→ ${script.fileName}` : '⚠ 未关联脚本'}
                    {trigger.description && ` · ${trigger.description}`}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(trigger)}>
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(trigger.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                </Button>
              </div>
            )
          })}
        </div>
      )}
      <Button variant="outline" size="sm" onClick={handleAdd}>
        <Plus className="mr-1 h-3.5 w-3.5" />
        添加自定义触发器
      </Button>
      <CustomTriggerForm
        open={formOpen}
        onOpenChange={setFormOpen}
        scripts={scripts}
        initial={editing}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
