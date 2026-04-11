import { Card } from '@/components/ui/card'
import {
  FORMAL_EDITOR_PLATFORM_SPECS,
  type FormalEditorPlatform,
} from '@/lib/product/support-contract'
import { cn } from '@/lib/utils'

interface PlatformStepProps {
  value: FormalEditorPlatform
  onChange: (platform: FormalEditorPlatform) => void
}

export function PlatformStep({ value, onChange }: PlatformStepProps) {
  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold">选择你的平台</h2>
      <p className="mb-4 text-sm text-gray-500">
        选择你使用 Rime 的操作系统，我们会生成对应的配置文件。
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {FORMAL_EDITOR_PLATFORM_SPECS.map((platform) => (
          <Card
            key={platform.id}
            onClick={() => onChange(platform.id)}
            className={cn(
              'cursor-pointer p-4 transition-colors',
              value === platform.id
                ? 'border-blue-500 bg-blue-50'
                : 'hover:border-gray-300',
            )}
          >
            <p className="font-semibold">{platform.name}</p>
            <p className="mt-1 text-sm text-gray-500">{platform.description}</p>
          </Card>
        ))}
      </div>
      <p className="mt-4 text-sm text-gray-500">
        当前向导的正式导出目标为 macOS 和 Windows。其他 Rime 平台仍可参考教程内容，但不作为本向导的正式配置输出目标。
      </p>
    </div>
  )
}
