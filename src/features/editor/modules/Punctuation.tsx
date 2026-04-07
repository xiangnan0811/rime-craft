import { useConfigStore } from '@/stores/config-store'
import { DEFAULT_HALF_SHAPE } from '@/data/punctuation-defaults'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function valueToString(val: string | string[]): string {
  return Array.isArray(val) ? val.join(', ') : val
}

function stringToValue(str: string, original: string | string[]): string | string[] {
  if (Array.isArray(original)) {
    return str.split(',').map((s) => s.trim()).filter(Boolean)
  }
  return str
}

export function Punctuation() {
  const schemaList = useConfigStore((s) => s.project.defaultConfig.schemaList)
  const schemaConfigs = useConfigStore((s) => s.project.schemaConfigs)
  const setPunctuator = useConfigStore((s) => s.setPunctuator)

  const primarySchemaId = schemaList[0]?.schema ?? ''
  const halfShape: Record<string, string | string[]> =
    schemaConfigs[primarySchemaId]?.punctuator?.halfShape ?? DEFAULT_HALF_SHAPE

  function handleChange(key: string, rawValue: string) {
    const original = halfShape[key] ?? DEFAULT_HALF_SHAPE[key] ?? ''
    const updated = {
      ...halfShape,
      [key]: stringToValue(rawValue, original),
    }
    setPunctuator(primarySchemaId, { halfShape: updated })
  }

  function handleReset() {
    setPunctuator(primarySchemaId, { halfShape: { ...DEFAULT_HALF_SHAPE } })
  }

  if (!primarySchemaId) {
    return <div className="text-gray-500">请先在「输入方案管理」中添加至少一个方案。</div>
  }

  const entries = Object.entries(halfShape)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">标点符号映射</h3>
          <p className="mt-1 text-sm text-gray-500">
            编辑半角标点到中文标点的映射。多个候选项用英文逗号分隔。当前配置应用于方案：{primarySchemaId}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleReset}>
          重置为默认
        </Button>
      </div>
      <div className="overflow-auto rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="w-24 px-4 py-2 text-left font-medium text-gray-600">键（输入）</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">输出</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([key, val]) => (
              <tr key={key} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-2 font-mono text-gray-700">{key}</td>
                <td className="px-4 py-2">
                  <Input
                    value={valueToString(val)}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="h-7 text-sm"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
