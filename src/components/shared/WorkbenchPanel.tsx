import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface WorkbenchPanelProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}

export function WorkbenchPanel({
  title,
  subtitle,
  actions,
  children,
  className,
}: WorkbenchPanelProps) {
  return (
    <section className={cn('rounded-2xl border border-border bg-card/80 shadow-sm', className)}>
      <div className="flex items-start justify-between gap-3 border-b border-border/80 px-4 py-3">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {subtitle ? <p className="text-xs leading-5 text-muted-foreground">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}
