import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, FileText } from 'lucide-react'
import { searchDocs, type SearchDoc } from '@/lib/docs/search-index'
import { TUTORIAL_NAV } from '@/data/tutorial-nav'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function DocsSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchDoc[]>([])
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (open) {
      setQuery('')
      setResults([])
      setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    if (!query.trim()) {
      const all = TUTORIAL_NAV.flatMap((s) =>
        s.items.map((item) => ({
          id: item.slug,
          title: item.title,
          section: s.title,
          slug: item.slug,
        })),
      )
      setResults(all)
      setSelected(0)
      return
    }
    const found = searchDocs(query)
    setResults(found)
    setSelected(0)
  }, [query])

  const goTo = useCallback(
    (slug: string) => {
      navigate(`/docs/${slug}`)
      setOpen(false)
    },
    [navigate],
  )

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelected((s) => Math.min(s + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected((s) => Math.max(s - 1, 0))
    } else if (e.key === 'Enter' && results[selected]) {
      goTo(results[selected].slug)
    }
  }

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={() => setOpen(false)}
      />
      <div className="fixed inset-x-0 top-[15%] z-50 mx-auto w-full max-w-lg px-4">
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-background shadow-2xl">
          <div className="flex items-center border-b border-border px-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              placeholder="搜索教程..."
              aria-label="搜索教程"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent px-3 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            <kbd className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
              Esc
            </kbd>
          </div>
          <div className="max-h-80 overflow-y-auto p-2">
            {results.length === 0 && query.trim() !== '' && (
              <div className="rounded-xl border border-dashed border-border/80 bg-muted/30 px-4 py-6 text-sm text-muted-foreground">
                未找到相关教程。
              </div>
            )}
            {results.map((result, i) => (
              <button
                key={result.slug}
                onClick={() => goTo(result.slug)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors duration-200 transition-[background-color,box-shadow,color] ${
                  i === selected
                    ? 'bg-accent text-foreground shadow-sm'
                    : 'text-foreground/90 hover:bg-accent/70'
                }`}
              >
                <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div>
                  <div className="font-medium">{result.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {result.section}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

interface SearchTriggerProps {
  compact?: boolean
  className?: string
}

export function SearchTrigger({ compact = false, className }: SearchTriggerProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size={compact ? 'icon' : 'sm'}
      aria-label="搜索教程"
      onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
      className={cn(
        'border-border/80 bg-card/80 text-muted-foreground shadow-sm transition-colors duration-200 transition-[border-color,background-color,box-shadow,color]',
        compact
          ? 'h-9 w-9 rounded-full hover:shadow-sm'
          : 'gap-2 rounded-xl hover:shadow-md',
        className,
      )}
    >
      <Search className="h-4 w-4" />
      {!compact && <span>搜索教程</span>}
      {!compact && <kbd className="rounded bg-muted px-1 text-xs">&#8984;K</kbd>}
    </Button>
  )
}
