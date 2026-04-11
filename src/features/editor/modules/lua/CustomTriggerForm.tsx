import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { CustomTrigger, LuaScript } from '@/types/config'

interface CustomTriggerFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  scripts: LuaScript[]
  initial?: CustomTrigger
  onSubmit: (data: Omit<CustomTrigger, 'id'>) => void
}

export function CustomTriggerForm({
  open,
  onOpenChange,
  scripts,
  initial,
  onSubmit,
}: CustomTriggerFormProps) {
  const [name, setName] = useState('')
  const [triggerCode, setTriggerCode] = useState('')
  const [description, setDescription] = useState('')
  const [scriptId, setScriptId] = useState('')

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? '')
      setTriggerCode(initial?.triggerCode ?? '')
      setDescription(initial?.description ?? '')
      setScriptId(initial?.scriptId ?? '')
    }
  }, [open, initial])

  const canSubmit = name.trim().length > 0 && triggerCode.trim().length > 0 && scriptId.length > 0

  function handleSubmit() {
    if (!canSubmit) return
    onSubmit({
      name: name.trim(),
      triggerCode: triggerCode.trim(),
      description: description.trim(),
      scriptId,
    })
    onOpenChange(false)
  }

  const translatorScripts = scripts.filter((s) => s.scriptType === 'translator')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? '编辑自定义触发器' : '添加自定义触发器'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="ct-name">名称</Label>
            <Input
              id="ct-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如：IP 地址查询"
            />
          </div>
          <div>
            <Label htmlFor="ct-code">触发码</Label>
            <Input
              id="ct-code"
              value={triggerCode}
              onChange={(e) => setTriggerCode(e.target.value)}
              placeholder="如：/ip"
            />
            <p className="mt-1 text-xs text-gray-500">用户输入此编码时将调用关联的 Lua 脚本。</p>
          </div>
          <div>
            <Label htmlFor="ct-desc">描述（可选）</Label>
            <Input
              id="ct-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="这个触发器的用途"
            />
          </div>
          <div>
            <Label>关联 Lua 脚本</Label>
            {translatorScripts.length === 0 ? (
              <p className="mt-1 text-xs text-orange-600 dark:text-orange-400">
                尚未创建 Translator 类型的 Lua 脚本。请先在「自定义脚本」Tab 创建一个。
              </p>
            ) : (
              <Select value={scriptId} onValueChange={setScriptId}>
                <SelectTrigger>
                  <SelectValue placeholder="选择一个脚本" />
                </SelectTrigger>
                <SelectContent>
                  {translatorScripts.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.fileName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button disabled={!canSubmit} onClick={handleSubmit}>
            {initial ? '保存' : '添加'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
