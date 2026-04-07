import { useState } from 'react'
import { useConfigStore } from '@/stores/config-store'
import { parseCustomPhrases } from '@/lib/config/custom-phrase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CustomPhrase } from '@/types/config'

export function Dictionary() {
  const customPhrases = useConfigStore((s) => s.project.customPhrases)
  const addCustomPhrase = useConfigStore((s) => s.addCustomPhrase)
  const removeCustomPhrase = useConfigStore((s) => s.removeCustomPhrase)
  const updateCustomPhrase = useConfigStore((s) => s.updateCustomPhrase)
  const setCustomPhrases = useConfigStore((s) => s.setCustomPhrases)

  const [filter, setFilter] = useState('')
  const [importText, setImportText] = useState('')

  function handleAdd() {
    const newPhrase: CustomPhrase = { text: '', code: '', weight: 0 }
    addCustomPhrase(newPhrase)
  }

  function handleImport() {
    const parsed = parseCustomPhrases(importText)
    if (parsed.length === 0) return
    setCustomPhrases([...customPhrases, ...parsed])
    setImportText('')
  }

  const lowerFilter = filter.toLowerCase()
  const filtered = customPhrases
    .map((p, i) => ({ phrase: p, index: i }))
    .filter(
      ({ phrase }) =>
        !lowerFilter ||
        phrase.text.toLowerCase().includes(lowerFilter) ||
        phrase.code.toLowerCase().includes(lowerFilter),
    )

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">词典管理</h3>
        <p className="mt-1 text-sm text-gray-500">
          管理自定义词组（custom_phrase.txt）。每个词条包含文字、编码和权重。
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="搜索词条或编码…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-xs"
        />
        <Button onClick={handleAdd} size="sm">
          添加词条
        </Button>
      </div>

      <div className="overflow-auto rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-4 py-2 text-left font-medium text-gray-600">词条</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">编码</th>
              <th className="w-24 px-4 py-2 text-left font-medium text-gray-600">权重</th>
              <th className="w-16 px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                  {filter ? '没有匹配的词条' : '暂无词条，点击「添加词条」开始'}
                </td>
              </tr>
            ) : (
              filtered.map(({ phrase, index }) => (
                <tr key={index} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <Input
                      value={phrase.text}
                      onChange={(e) =>
                        updateCustomPhrase(index, { ...phrase, text: e.target.value })
                      }
                      className="h-7 text-sm"
                      placeholder="词条文字"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      value={phrase.code}
                      onChange={(e) =>
                        updateCustomPhrase(index, { ...phrase, code: e.target.value })
                      }
                      className="h-7 text-sm"
                      placeholder="拼音编码"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      type="number"
                      value={phrase.weight}
                      onChange={(e) =>
                        updateCustomPhrase(index, { ...phrase, weight: Number(e.target.value) })
                      }
                      className="h-7 text-sm"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCustomPhrase(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      删除
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-2 rounded-md border p-4">
        <Label className="text-sm font-medium">批量导入</Label>
        <p className="text-xs text-gray-500">
          粘贴 TSV 格式内容（词条\t编码\t权重），每行一条，# 开头为注释。
        </p>
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          rows={5}
          placeholder={'# 示例\n你好\tni hao\t1\n再见\tzai jian\t1'}
          className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
        />
        <Button
          size="sm"
          onClick={handleImport}
          disabled={!importText.trim()}
        >
          导入
        </Button>
      </div>
    </div>
  )
}
