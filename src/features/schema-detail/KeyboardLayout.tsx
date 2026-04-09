import { cn } from '@/lib/utils'
import type { KeyboardLayoutData, KeyMapping } from '@/types/schema'

interface KeyboardLayoutProps {
  data: KeyboardLayoutData
}

const ROW_OFFSETS = ['ml-0', 'ml-5', 'ml-10']

export function KeyboardLayout({ data }: KeyboardLayoutProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-center text-sm font-medium text-gray-500">
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
        'hover:border-blue-400 hover:bg-blue-50',
        isSpecial && 'border-purple-400 bg-purple-50',
        isDualRole && 'border-yellow-400 bg-yellow-50',
        !isSpecial && !isDualRole && 'border-gray-300 bg-white',
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
          isSpecial ? 'text-purple-700' : 'text-gray-900',
        )}
      >
        {key}
      </span>
      <span
        className={cn(
          'text-xs font-medium',
          isSpecial
            ? 'text-purple-600'
            : hasCustomInitial
              ? 'text-blue-600'
              : 'text-gray-400',
        )}
      >
        {final}
      </span>
    </div>
  )
}

function Legend() {
  return (
    <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-500">
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-4 rounded border border-gray-300 bg-white" />
        字母键
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-4 rounded border border-purple-400 bg-purple-50" />
        非字母键
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-4 rounded border border-yellow-400 bg-yellow-50" />
        双角色键
      </span>
    </div>
  )
}
