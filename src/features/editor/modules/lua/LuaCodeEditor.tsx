import { lazy, Suspense, useEffect, useMemo, useState } from 'react'

interface LuaCodeEditorProps {
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
  height?: string
}

export function LuaCodeEditor({ value, onChange, readOnly = false, height = '400px' }: LuaCodeEditorProps) {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'))

  useEffect(() => {
    const root = document.documentElement
    const observer = new MutationObserver(() => {
      setIsDark(root.classList.contains('dark'))
    })

    observer.observe(root, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [])

  const LazyEditor = useMemo(
    () =>
      lazy(async () => {
        const [{ default: CM }, { StreamLanguage }, { lua }] = await Promise.all([
          import('@uiw/react-codemirror'),
          import('@codemirror/language'),
          import('@codemirror/legacy-modes/mode/lua'),
        ])
        const luaSupport = StreamLanguage.define(lua)
        return {
          default: (innerProps: {
            value: string
            onChange: (v: string) => void
            readOnly?: boolean
            height?: string
            isDark: boolean
          }) => (
            <CM
              value={innerProps.value}
              height={innerProps.height}
              extensions={[luaSupport]}
              theme={innerProps.isDark ? 'dark' : 'light'}
              editable={!innerProps.readOnly}
              onChange={(v) => innerProps.onChange(v)}
            />
          ),
        }
      }),
    [],
  )

  return (
    <Suspense fallback={<EditorFallback height={height} />}>
      <LazyEditor value={value} onChange={onChange} readOnly={readOnly} height={height} isDark={isDark} />
    </Suspense>
  )
}

function EditorFallback({ height }: { height: string }) {
  return (
    <div
      className="flex items-center justify-center rounded-xl border border-border bg-card/80 text-sm text-muted-foreground shadow-sm"
      style={{ height }}
    >
      加载代码编辑器...
    </div>
  )
}
