import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface YamlPreviewProps {
  title?: string
  highlight?: number[]
  caption?: string
  diff?: boolean
  children: ReactNode
}

export function YamlPreview({
  title,
  highlight,
  caption,
  diff = false,
  children,
}: YamlPreviewProps) {
  return (
    <figure className="my-4">
      <div
        className={cn(
          'overflow-hidden rounded-lg border border-slate-700 bg-slate-900',
          diff && 'yaml-preview-diff',
        )}
        data-highlight-lines={highlight ? highlight.join(',') : undefined}
      >
        {title && (
          <div className="border-b border-slate-700 bg-slate-950 px-4 py-2 text-xs text-slate-400">
            {title}
          </div>
        )}
        <div
          className={cn(
            '[&_pre]:my-0 [&_pre]:overflow-x-auto [&_pre]:bg-transparent [&_pre]:p-4',
            '[&_pre]:text-sm [&_pre]:leading-relaxed [&_pre]:border-0',
            diff && '[&_code_span[data-line-diff="add"]]:bg-green-500/10',
            diff && '[&_code_span[data-line-diff="del"]]:bg-red-500/10',
          )}
        >
          {children}
        </div>
      </div>
      {caption && (
        <figcaption className="mt-2 text-xs italic text-gray-500 dark:text-slate-400">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
