import { useState, useRef, type ComponentPropsWithoutRef } from 'react'
import { Copy, Check } from 'lucide-react'

export function Pre({ children, ...props }: ComponentPropsWithoutRef<'pre'>) {
  const [copied, setCopied] = useState(false)
  const preRef = useRef<HTMLPreElement>(null)

  const rawTitle =
    (props as Record<string, unknown>)['data-title'] ??
    (props as Record<string, unknown>)['data-language']
  const title = typeof rawTitle === 'string' ? rawTitle : undefined

  function handleCopy() {
    const text = preRef.current?.textContent ?? ''
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="group relative my-4 overflow-hidden rounded-lg border border-border bg-card">
      {title && (
        <div className="flex items-center justify-between border-b border-border bg-muted px-4 py-2">
          <span className="text-xs text-muted-foreground">{title}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Copy code"
          >
            {copied ? (
              <><Check className="h-3.5 w-3.5" /><span>Copied!</span></>
            ) : (
              <><Copy className="h-3.5 w-3.5" /><span>Copy</span></>
            )}
          </button>
        </div>
      )}
      {!title && (
        <button
          onClick={handleCopy}
          className="absolute right-3 top-3 flex items-center gap-1 rounded bg-background/70 px-2 py-1 text-xs text-muted-foreground opacity-0 backdrop-blur transition-opacity hover:text-foreground group-hover:opacity-100"
          aria-label="Copy code"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      )}
      <pre ref={preRef} className="overflow-x-auto p-4 text-sm leading-relaxed" {...props}>
        {children}
      </pre>
    </div>
  )
}

export function InlineCode(props: ComponentPropsWithoutRef<'code'>) {
  if ((props as Record<string, unknown>)['data-language']) {
    return <code {...props} />
  }
  return (
    <code
      className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px] text-foreground"
      {...props}
    />
  )
}
