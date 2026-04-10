import { lazy, Suspense, useMemo } from 'react'

interface LuaCodeEditorProps {
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
  height?: string
}

export function LuaCodeEditor({ value, onChange, readOnly = false, height = '400px' }: LuaCodeEditorProps) {
  const LazyEditor = useMemo(
    () =>
      lazy(async () => {
        const [{ default: CM }, { StreamLanguage }, { lua }, { oneDark }] = await Promise.all([
          import('@uiw/react-codemirror'),
          import('@codemirror/language'),
          import('@codemirror/legacy-modes/mode/lua'),
          import('@codemirror/theme-one-dark'),
        ])
        const luaSupport = StreamLanguage.define(lua)
        return {
          default: (innerProps: {
            value: string
            onChange: (v: string) => void
            readOnly?: boolean
            height?: string
          }) => (
            <CM
              value={innerProps.value}
              height={innerProps.height}
              extensions={[luaSupport]}
              theme={oneDark}
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
      <LazyEditor value={value} onChange={onChange} readOnly={readOnly} height={height} />
    </Suspense>
  )
}

function EditorFallback({ height }: { height: string }) {
  return (
    <div
      className="flex items-center justify-center rounded border border-slate-700 bg-slate-900 text-sm text-slate-400"
      style={{ height }}
    >
      加载代码编辑器...
    </div>
  )
}
