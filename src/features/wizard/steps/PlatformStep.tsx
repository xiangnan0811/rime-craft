import type { Platform } from '@/types/config'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const PLATFORMS: { id: Platform; name: string; description: string }[] = [
  { id: 'macos', name: 'macOS', description: '鼠须管 (Squirrel)' },
  { id: 'windows', name: 'Windows', description: '小狼毫 (Weasel)' },
  { id: 'linux', name: 'Linux', description: 'ibus-rime / fcitx-rime' },
  { id: 'android', name: 'Android', description: '同文输入法 (Trime)' },
  { id: 'ios', name: 'iOS', description: '仓输入法 (Hamster)' },
]

interface PlatformStepProps {
  value: Platform
  onChange: (platform: Platform) => void
}

export function PlatformStep({ value, onChange }: PlatformStepProps) {
  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold">选择你的平台</h2>
      <p className="mb-4 text-sm text-gray-500">
        选择你使用 Rime 的操作系统，我们会生成对应的配置文件。
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {PLATFORMS.map((p) => (
          <Card
            key={p.id}
            onClick={() => onChange(p.id)}
            className={cn(
              'cursor-pointer p-4 transition-colors',
              value === p.id
                ? 'border-blue-500 bg-blue-50'
                : 'hover:border-gray-300',
            )}
          >
            <p className="font-semibold">{p.name}</p>
            <p className="mt-1 text-sm text-gray-500">{p.description}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
