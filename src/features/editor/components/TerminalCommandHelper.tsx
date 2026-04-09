import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface TerminalCommandHelperProps {
  onSelect: (identifier: string) => void
}

const COMMAND = 'mdls -name kMDItemCFBundleIdentifier -raw /Applications/应用名.app'

export function TerminalCommandHelper({ onSelect }: TerminalCommandHelperProps) {
  const [pastedId, setPastedId] = useState('')
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(COMMAND)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleSubmit() {
    const trimmed = pastedId.trim()
    if (trimmed) {
      onSelect(trimmed)
      setPastedId('')
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        在终端中执行以下命令，将「应用名」替换为实际的应用名称：
      </p>
      <div className="flex items-center gap-2">
        <code className="flex-1 rounded bg-muted px-3 py-2 text-xs font-mono break-all">
          {COMMAND}
        </code>
        <Button variant="outline" size="sm" onClick={handleCopy}>
          {copied ? '已复制' : '复制'}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">将结果粘贴到下方：</p>
      <div className="flex items-center gap-2">
        <Input
          value={pastedId}
          onChange={(e) => setPastedId(e.target.value)}
          placeholder="com.example.app"
          className="flex-1 font-mono text-sm"
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
        <Button size="sm" onClick={handleSubmit} disabled={!pastedId.trim()}>
          添加
        </Button>
      </div>
    </div>
  )
}
