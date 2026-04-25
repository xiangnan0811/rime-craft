import type { ComponentPropsWithoutRef } from 'react'
import { BadgeCheck, Lightbulb, Siren, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

const CALLOUT_CONFIG = {
  tip: {
    icon: Lightbulb,
    label: 'Tip',
    iconClassName: 'text-primary',
  },
  warning: {
    icon: TriangleAlert,
    label: 'Warning',
    iconClassName: 'text-amber-500',
  },
  note: {
    icon: BadgeCheck,
    label: 'Note',
    iconClassName: 'text-emerald-500',
  },
  caution: {
    icon: Siren,
    label: 'Caution',
    iconClassName: 'text-destructive',
  },
} as const

type CalloutType = keyof typeof CALLOUT_CONFIG

interface CalloutProps extends ComponentPropsWithoutRef<'div'> {
  /** Explicit callout type (when used as a named MDX component like <tip>) */
  calloutType?: CalloutType;
}

export function Callout({ children, calloutType, ...props }: CalloutProps) {
  const directive = calloutType
    ?? (props as Record<string, unknown>)['data-directive'] as string | undefined
  const type: CalloutType = directive && directive in CALLOUT_CONFIG ? (directive as CalloutType) : 'note'
  const config = CALLOUT_CONFIG[type]
  const Icon = config.icon

  return (
    <div className="my-4 rounded-2xl border border-border/80 bg-card/80 p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
        <Icon aria-hidden className={cn('h-4 w-4', config.iconClassName)} />
        <span>{config.label}</span>
      </div>
      <div className="text-sm leading-6 text-muted-foreground [&>p]:mb-0">
        {children}
      </div>
    </div>
  )
}
