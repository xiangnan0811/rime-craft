import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

const LEVEL_CONFIG = {
  intermediate: {
    label: '扩展',
    badgeClass: 'bg-accent text-accent-foreground',
  },
  advanced: {
    label: '进阶',
    badgeClass: 'bg-secondary text-secondary-foreground',
  },
  default: {
    label: '',
    badgeClass: '',
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
      className="my-4 rounded-2xl border border-border/80 bg-card/70 px-4 py-3 shadow-sm transition-colors"
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden">
        <span className="mr-1 inline-block text-xs text-muted-foreground">▶</span>
        <span>{title}</span>
        {level && (
          <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-semibold', cfg.badgeClass)}>
            {cfg.label}
          </span>
        )}
      </summary>
      <div className="mt-3 border-t border-border/70 pt-3 text-[15px] leading-[1.7] text-muted-foreground">
        {children}
      </div>
    </details>
  )
}
