import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

const LEVEL_CONFIG = {
  intermediate: {
    label: '扩展',
    badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    borderClass: 'border-l-blue-300 dark:border-l-blue-700',
    bgClass: 'bg-blue-50/40 dark:bg-blue-950/20',
  },
  advanced: {
    label: '进阶',
    badgeClass: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    borderClass: 'border-l-purple-300 dark:border-l-purple-700',
    bgClass: 'bg-purple-50/40 dark:bg-purple-950/20',
  },
  default: {
    label: '',
    badgeClass: '',
    borderClass: 'border-l-gray-300 dark:border-l-gray-600',
    bgClass: 'bg-gray-50/40 dark:bg-slate-900/30',
  },
} as const

interface DetailsProps {
  title: string
  level?: 'intermediate' | 'advanced'
  defaultOpen?: boolean
  children: ReactNode
}

export function Details({ title, level, defaultOpen = false, children }: DetailsProps) {
  const cfg = LEVEL_CONFIG[level ?? 'default']
  return (
    <details
      open={defaultOpen}
      className={cn(
        'my-4 rounded-r-md border-l-[3px] py-2 pl-4 pr-3 transition-colors',
        cfg.borderClass,
        cfg.bgClass,
      )}
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-gray-800 dark:text-slate-200 [&::-webkit-details-marker]:hidden">
        <span className="mr-1 inline-block text-xs text-gray-400">▶</span>
        <span>{title}</span>
        {level && (
          <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-semibold', cfg.badgeClass)}>
            {cfg.label}
          </span>
        )}
      </summary>
      <div className="mt-3 text-[15px] leading-[1.7] text-gray-700 dark:text-slate-300">
        {children}
      </div>
    </details>
  )
}
