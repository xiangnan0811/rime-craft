import { useConfigStore } from '@/stores/config-store'

function Placeholder({ name }: { name: string }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-400">
      {name} — 待实现
    </div>
  )
}

export function EditorContent() {
  const activeModule = useConfigStore((s) => s.activeModule)

  const content: Record<string, React.ReactNode> = {
    'schema-manager': <Placeholder name="输入方案管理" />,
    'candidate-settings': <Placeholder name="候选词设置" />,
    'key-bindings': <Placeholder name="按键绑定" />,
    'fuzzy-pinyin': <Placeholder name="模糊音规则" />,
    'ascii-mode': <Placeholder name="中英文切换" />,
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mx-auto max-w-2xl">
        {content[activeModule]}
      </div>
    </div>
  )
}
