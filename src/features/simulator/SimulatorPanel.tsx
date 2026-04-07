import { useState } from 'react'
import { useConfigStore } from '@/stores/config-store'
import { useSimulator } from './useSimulator'
import { CandidatePreview } from '@/components/shared/CandidatePreview'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function SimulatorPanel() {
  const [input, setInput] = useState('')
  const pageSize = useConfigStore((s) => s.project.defaultConfig.pageSize)
  const theme = useConfigStore((s) => s.project.platformConfig.style)

  const { candidates, pinyinDisplay } = useSimulator(input, pageSize)

  const labels = Array.from({ length: pageSize }, (_, i) => String(i + 1))

  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-1 block text-sm font-medium">输入模拟器</Label>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入拼音试试... 如 nihao"
          className="font-mono"
          autoFocus
        />
        <p className="mt-1 text-xs text-gray-400">
          实际候选词由 Rime 引擎决定，此处仅为演示
        </p>
      </div>

      {candidates.length > 0 && (
        <CandidatePreview
          candidates={candidates}
          labels={labels}
          input={pinyinDisplay}
          theme={theme}
          className="w-full"
        />
      )}

      {input && candidates.length === 0 && (
        <p className="text-sm text-gray-400">无匹配候选词</p>
      )}
    </div>
  )
}
