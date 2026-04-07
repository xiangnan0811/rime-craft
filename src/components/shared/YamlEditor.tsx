import CodeMirror from '@uiw/react-codemirror'
import { yaml } from '@codemirror/lang-yaml'

interface YamlEditorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const extensions = [yaml()]

export function YamlEditor({ value, onChange, error }: YamlEditorProps) {
  return (
    <div className="space-y-2">
      <CodeMirror
        value={value}
        extensions={extensions}
        onChange={onChange}
        height="300px"
        className="rounded-md border text-sm"
      />
      {error && (
        <p className="rounded-md bg-red-50 p-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
