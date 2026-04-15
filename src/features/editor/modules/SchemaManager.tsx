import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Code, Info } from 'lucide-react'
import { useConfigStore } from '@/stores/config-store'
import { ALL_SCHEMAS } from '@/data/schema-data'
import { SCHEMA_REGISTRY } from '@/data/schema-registry'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { LearnMoreLink } from '@/components/shared/LearnMoreLink'
import type { SchemaDetail } from '@/types/schema'

function getDetail(id: string): SchemaDetail | undefined {
  return ALL_SCHEMAS.find((s) => s.id === id)
}

export function SchemaManager() {
  const schemaList = useConfigStore((s) => s.project.defaultConfig.schemaList)
  const setSchemaList = useConfigStore((s) => s.setSchemaList)
  const [addingSchema, setAddingSchema] = useState('')

  const enabledIds = new Set(schemaList.map((s) => s.schema))
  const availableSchemas = SCHEMA_REGISTRY.filter((s) => !enabledIds.has(s.id))

  function handleAdd() {
    if (!addingSchema) return
    setSchemaList([...schemaList, { schema: addingSchema }])
    setAddingSchema('')
  }

  function handleRemove(schemaId: string) {
    setSchemaList(schemaList.filter((s) => s.schema !== schemaId))
  }

  function handleMoveUp(index: number) {
    if (index === 0) return
    const next = [...schemaList]
    ;[next[index - 1], next[index]] = [next[index]!, next[index - 1]!]
    setSchemaList(next)
  }

  function handleMoveDown(index: number) {
    if (index === schemaList.length - 1) return
    const next = [...schemaList]
    ;[next[index], next[index + 1]] = [next[index + 1]!, next[index]!]
    setSchemaList(next)
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">输入方案管理</h3>
          <LearnMoreLink module="schema-manager" />
        </div>
        <p className="mt-1 text-sm text-gray-500">
          管理已启用的输入方案及其优先顺序。列表中排在前面的方案为默认方案。这里写出的只是
          {' '}`schema_list` 与相关补丁；目标设备仍需先安装对应的 `.schema.yaml` / `.dict.yaml`
          {' '}方案文件，Rime 才能真正使用该方案。
        </p>
      </div>
      <div className="space-y-2">
        {schemaList.map((item, index) => {
          const detail = getDetail(item.schema)
          const info = SCHEMA_REGISTRY.find((s) => s.id === item.schema)
          return (
            <Card key={item.schema} className="flex items-center justify-between p-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{info?.name ?? item.schema}</p>
                  {detail && (
                    <Link to={`/schema/${item.schema}`} className="text-gray-400 hover:text-blue-600" title="查看详情">
                      <Info className="h-3.5 w-3.5" />
                    </Link>
                  )}
                  {detail?.links.repository && (
                    <a href={detail.links.repository} target="_blank" rel="noreferrer" className="text-gray-300 hover:text-gray-600" title="GitHub">
                      <Code className="h-3.5 w-3.5" />
                    </a>
                  )}
                  {detail?.links.official && (
                    <a href={detail.links.official} target="_blank" rel="noreferrer" className="text-gray-300 hover:text-gray-600" title="官网">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
                {info && <p className="text-sm text-gray-500">{info.description}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => handleMoveUp(index)} disabled={index === 0}>↑</Button>
                <Button variant="ghost" size="sm" onClick={() => handleMoveDown(index)} disabled={index === schemaList.length - 1}>↓</Button>
                <Button variant="ghost" size="sm" onClick={() => handleRemove(item.schema)}>删除</Button>
              </div>
            </Card>
          )
        })}
      </div>
      {availableSchemas.length > 0 && (
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium">添加方案</label>
            <Select value={addingSchema} onValueChange={setAddingSchema}>
              <SelectTrigger><SelectValue placeholder="选择方案..." /></SelectTrigger>
              <SelectContent>
                {availableSchemas.map((s) => {
                  const detail = getDetail(s.id)
                  return (
                    <SelectItem key={s.id} value={s.id}>
                      <div>
                        <span>{s.name}</span>
                        {detail && (
                          <span className="ml-2 text-xs text-gray-400">
                            {detail.compare.difficulty} · {detail.compare.recommendation}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAdd} disabled={!addingSchema}>添加</Button>
        </div>
      )}
      <div className="text-center">
        <Link to="/compare" className="text-sm text-blue-600 hover:underline">
          浏览所有方案 →
        </Link>
      </div>
    </div>
  )
}
