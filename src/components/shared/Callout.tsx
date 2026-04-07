import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/lib/utils'

const CALLOUT_CONFIG = {
  tip: {
    icon: '💡',
    label: 'Tip',
    styles: 'border-blue-400 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/50',
    textColor: 'text-blue-800 dark:text-blue-200',
    labelColor: 'text-blue-700 dark:text-blue-300',
  },
  warning: {
    icon: '⚠️',
    label: 'Warning',
    styles: 'border-yellow-400 bg-yellow-50 dark:border-yellow-500 dark:bg-yellow-950/50',
    textColor: 'text-yellow-800 dark:text-yellow-200',
    labelColor: 'text-yellow-700 dark:text-yellow-300',
  },
  note: {
    icon: '✅',
    label: 'Note',
    styles: 'border-green-400 bg-green-50 dark:border-green-500 dark:bg-green-950/50',
    textColor: 'text-green-800 dark:text-green-200',
    labelColor: 'text-green-700 dark:text-green-300',
  },
  caution: {
    icon: '🚨',
    label: 'Caution',
    styles: 'border-red-400 bg-red-50 dark:border-red-500 dark:bg-red-950/50',
    textColor: 'text-red-800 dark:text-red-200',
    labelColor: 'text-red-700 dark:text-red-300',
  },
} as const

type CalloutType = keyof typeof CALLOUT_CONFIG

export function Callout({ children, ...props }: ComponentPropsWithoutRef<'div'>) {
  const directive = (props as Record<string, unknown>)['data-directive'] as string | undefined
  const type: CalloutType = directive && directive in CALLOUT_CONFIG ? (directive as CalloutType) : 'note'
  const config = CALLOUT_CONFIG[type]

  return (
    <div className={cn('my-4 rounded-r-lg border-l-[3px] p-4', config.styles)}>
      <div className={cn('mb-1 text-sm font-semibold', config.labelColor)}>
        {config.icon} {config.label}
      </div>
      <div className={cn('text-sm leading-relaxed [&>p]:mb-0', config.textColor)}>
        {children}
      </div>
    </div>
  )
}
