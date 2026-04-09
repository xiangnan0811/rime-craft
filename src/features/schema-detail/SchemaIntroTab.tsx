import { Badge } from '@/components/ui/badge'
import type { SchemaDetail } from '@/types/schema'

const PLATFORM_ICONS: Record<string, string> = {
  macOS: '🍎', Windows: '🪟', Linux: '🐧', Android: '🤖', iOS: '📱',
}

export function SchemaIntroTab({ schema }: { schema: SchemaDetail }) {
  const paragraphs = schema.introduction.split('\n\n')
  const { compare, community } = schema
  return (
    <div className="space-y-6 py-4">
      <div className="space-y-3">
        <h3 className="text-base font-semibold">简介</h3>
        {paragraphs.map((p, i) => (
          <p key={i} className="text-sm leading-relaxed text-gray-700">{p}</p>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="词库规模" value={compare.dictSize} />
        <StatCard label="智能程度" value={compare.smartLevel} />
        <StatCard label="上手难度" value={compare.difficulty} />
        <StatCard label="更新频率" value={community.updateFrequency} />
      </div>
      <div>
        <h3 className="mb-2 text-base font-semibold">功能特性</h3>
        <div className="flex flex-wrap gap-2">
          {compare.features.map((f) => (<Badge key={f} variant="secondary">{f}</Badge>))}
        </div>
      </div>
      <div>
        <h3 className="mb-2 text-base font-semibold">平台支持</h3>
        <div className="flex flex-wrap gap-2">
          {compare.platforms.map((p) => (
            <span key={p} className="rounded-md bg-gray-100 px-3 py-1.5 text-sm">{PLATFORM_ICONS[p] ?? ''} {p}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 p-4 text-center">
      <div className="text-lg font-bold text-gray-900">{value}</div>
      <div className="mt-1 text-xs text-gray-500">{label}</div>
    </div>
  )
}
