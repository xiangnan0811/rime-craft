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
          <p key={i} className="text-sm leading-relaxed text-foreground/90">{p}</p>
        ))}
      </div>
      <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-200">
        社区规模与更新频率为人工维护快照信息，仅作参考；具体以上游 README / GitHub 页面为准。
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="词库规模" value={compare.dictSize} />
        <StatCard label="智能程度" value={compare.smartLevel} />
        <StatCard label="上手难度" value={compare.difficulty} />
        <StatCard label="更新频率（人工维护）" value={community.updateFrequency} />
      </div>
      <div>
        <h3 className="mb-2 text-base font-semibold">功能特性</h3>
        <div className="flex flex-wrap gap-2">
          {compare.features.map((f) => (<Badge key={f} variant="secondary">{f}</Badge>))}
        </div>
      </div>
      <div>
        <h3 className="mb-2 text-base font-semibold">Rime 生态可用平台</h3>
        <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
          这里展示的是常见方案在 Rime 生态中的可用平台，用于帮助理解方案覆盖面；
          它不等同于 rime-craft 当前正式承诺的导入 / 导出支持范围。
        </p>
        <div className="flex flex-wrap gap-2">
          {compare.platforms.map((p) => (
            <span key={p} className="rounded-md bg-muted px-3 py-1.5 text-sm">{PLATFORM_ICONS[p] ?? ''} {p}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-4 text-center">
      <div className="text-lg font-bold text-foreground">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  )
}
