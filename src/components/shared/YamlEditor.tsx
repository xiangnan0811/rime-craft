import { useEffect, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { yaml } from '@codemirror/lang-yaml'

interface YamlEditorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const extensions = [yaml()]

export function YamlEditor({ value, onChange, error }: YamlEditorProps) {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains('dark'),
  )

  useEffect(() => {
    const root = document.documentElement
    const updateTheme = () => setIsDark(root.classList.contains('dark'))

    updateTheme()

    const observer = new MutationObserver(updateTheme)
    observer.observe(root, { attributes: true, attributeFilter: ['class'] })

    return () => observer.disconnect()
  }, [])

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-card/80 p-2 shadow-sm">
        <CodeMirror
          value={value}
          extensions={extensions}
          onChange={onChange}
          height="300px"
          theme={isDark ? 'dark' : 'light'}
          className="rounded-lg text-sm"
        />
      </div>
      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}
    </div>
  )
}
