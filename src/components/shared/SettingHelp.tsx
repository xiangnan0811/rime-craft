import { useState } from 'react'
import { cn } from '@/lib/utils'

interface SettingHelpProps {
  children: React.ReactNode
  className?: string
}

export function SettingHelp({ children, className }: SettingHelpProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px] leading-none',
          open
            ? 'border-blue-400 bg-blue-100 text-blue-600'
            : 'border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-500',
        )}
        aria-expanded={open}
        aria-label="显示帮助信息"
      >
        ?
      </button>
      <div
        className={cn(
          'grid basis-full transition-[grid-template-rows] duration-150 ease-in-out',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <div
            className={cn(
              'mt-2 rounded-md border-l-2 border-blue-300 bg-blue-50 p-3 text-sm leading-relaxed text-gray-700 dark:border-blue-500 dark:bg-blue-950/30 dark:text-gray-300',
              '[&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:mb-0 [&>ul]:ml-4 [&>ul]:list-disc [&>ul]:space-y-0.5',
              className,
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </>
  )
}
