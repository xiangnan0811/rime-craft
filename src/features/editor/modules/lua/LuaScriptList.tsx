import { useState } from 'react'
import { useConfigStore } from '@/stores/config-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'
import { LuaCodeEditor } from './LuaCodeEditor'
import { LuaScriptYamlPreview } from './LuaScriptYamlPreview'
import { renderLuaTemplate } from '@/data/lua-script-templates'
import type { LuaScript } from '@/types/config'

interface LuaScriptListProps {
  schemaId: string
}

export function LuaScriptList({ schemaId }: LuaScriptListProps) {
  const scripts = useConfigStore((s) => s.project.schemaConfigs[schemaId]?.luaScripts ?? [])
  const addLuaScript = useConfigStore((s) => s.addLuaScript)
  const updateLuaScript = useConfigStore((s) => s.updateLuaScript)
  const deleteLuaScript = useConfigStore((s) => s.deleteLuaScript)

  const [selectedId, setSelectedId] = useState<string | null>(scripts[0]?.id ?? null)
  const selected = scripts.find((s) => s.id === selectedId) ?? null

  function handleCreate(type: LuaScript['scriptType']) {
    const identifier = `my_${type}`
    addLuaScript(schemaId, {
      fileName: `${identifier}.lua`,
      scriptType: type,
      description: '',
      code: renderLuaTemplate(type, identifier),
    })
    setTimeout(() => {
      const updated = useConfigStore.getState().project.schemaConfigs[schemaId]?.luaScripts ?? []
      const last = updated[updated.length - 1]
      if (last) setSelectedId(last.id)
    }, 0)
  }

  function handleDelete(id: string) {
    if (window.confirm('确定删除此脚本吗？关联的自定义触发器将失效。')) {
      deleteLuaScript(schemaId, id)
      if (selectedId === id) setSelectedId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">新建脚本：</span>
        <Button variant="outline" size="sm" onClick={() => handleCreate('translator')}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          Translator
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleCreate('filter')}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          Filter
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleCreate('processor')}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          Processor
        </Button>
      </div>

      {scripts.length === 0 ? (
        <p className="text-sm text-gray-500">
          尚未创建任何 Lua 脚本。点击上方按钮以某个类型的模板开始。
        </p>
      ) : (
        <>
          <div className="space-y-1">
            {scripts.map((script) => (
              <div
                key={script.id}
                className={`flex cursor-pointer items-center gap-3 rounded border p-2 ${
                  selectedId === script.id
                    ? 'border-blue-400 bg-blue-50 dark:border-blue-600 dark:bg-blue-950/30'
                    : 'border-gray-200 dark:border-slate-700'
                }`}
                onClick={() => setSelectedId(script.id)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{script.fileName}</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {script.scriptType}
                    </Badge>
                  </div>
                  {script.description && (
                    <div className="mt-0.5 text-xs text-gray-500">{script.description}</div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(script.id)
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                </Button>
              </div>
            ))}
          </div>

          {selected && (
            <div className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="ls-filename">文件名</Label>
                  <Input
                    id="ls-filename"
                    value={selected.fileName}
                    onChange={(e) => {
                      const v = e.target.value
                      if (!/^[a-zA-Z0-9_-]*\.?l?u?a?$/.test(v)) return
                      updateLuaScript(schemaId, selected.id, { fileName: v })
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="ls-type">类型</Label>
                  <Select
                    value={selected.scriptType}
                    onValueChange={(v) =>
                      updateLuaScript(schemaId, selected.id, {
                        scriptType: v as LuaScript['scriptType'],
                      })
                    }
                  >
                    <SelectTrigger id="ls-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="translator">Translator</SelectItem>
                      <SelectItem value="filter">Filter</SelectItem>
                      <SelectItem value="processor">Processor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="ls-desc">描述</Label>
                <Input
                  id="ls-desc"
                  value={selected.description}
                  onChange={(e) =>
                    updateLuaScript(schemaId, selected.id, { description: e.target.value })
                  }
                  placeholder="这个脚本的用途"
                />
              </div>
              <div>
                <Label>代码</Label>
                <div className="mt-1">
                  <LuaCodeEditor
                    value={selected.code}
                    onChange={(code) => updateLuaScript(schemaId, selected.id, { code })}
                    height="400px"
                  />
                </div>
              </div>
              <LuaScriptYamlPreview script={selected} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
