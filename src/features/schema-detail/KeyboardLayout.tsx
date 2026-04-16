import { cn } from '@/lib/utils'
import type { KeyboardLayoutData, KeyMapping } from '@/types/schema'

interface KeyboardLayoutProps {
  data: KeyboardLayoutData
}

const ROW_OFFSETS = ['ml-0', 'ml-5', 'ml-10']

export function KeyboardLayout({ data }: KeyboardLayoutProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-center text-sm font-medium text-muted-foreground">
        {data.name}
      </h3>
      <div className="flex flex-col items-center gap-1.5">
        {data.rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className={cn('flex gap-1', ROW_OFFSETS[rowIndex])}
          >
            {row.map((mapping) => (
              <Key key={mapping.key} mapping={mapping} />
            ))}
          </div>
        ))}
      </div>
      <Legend />
    </div>
  )
}

function Key({ mapping }: { mapping: KeyMapping }) {
  const { key, initial, final, isSpecial, isDualRole } = mapping
  const hasCustomInitial = initial !== null

  return (
    <div
      data-key={key}
      data-special={isSpecial ? 'true' : undefined}
      data-dual-role={isDualRole ? 'true' : undefined}
      className={cn(
        'flex h-14 w-16 flex-col items-center justify-center rounded-md border transition-colors',
        'hover:border-blue-400 hover:bg-blue-50 dark:hover:border-blue-500 dark:hover:bg-blue-950/40',
        isSpecial && 'border-purple-400 bg-purple-50 dark:border-purple-500 dark:bg-purple-950/40',
        isDualRole && 'border-yellow-400 bg-yellow-50 dark:border-yellow-500 dark:bg-yellow-950/40',
        !isSpecial && !isDualRole && 'border-border bg-card',
      )}
      title={
        hasCustomInitial
          ? `声母: ${initial}　韵母: ${final}`
          : `韵母: ${final}`
      }
    >
      <span
        className={cn(
          'text-sm font-semibold',
          isSpecial ? 'text-purple-700 dark:text-purple-300' : 'text-foreground',
        )}
      >
        {key}
      </span>
      <span
        className={cn(
          'text-xs font-medium',
          isSpecial
            ? 'text-purple-600 dark:text-purple-400'
            : hasCustomInitial
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-muted-foreground',
        )}
      >
        {final}
      </span>
    </div>
  )
}

function Legend() {
  return (
    <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-4 rounded border border-border bg-card" />
        字母键
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-4 rounded border border-purple-400 bg-purple-50 dark:border-purple-500 dark:bg-purple-950/40" />
        非字母键
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-4 rounded border border-yellow-400 bg-yellow-50 dark:border-yellow-500 dark:bg-yellow-950/40" />
        双角色键
      </span>
    </div>
  )
}
