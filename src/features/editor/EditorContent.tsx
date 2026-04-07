import { useConfigStore } from '@/stores/config-store'
import { SchemaManager } from './modules/SchemaManager'
import { CandidateSettings } from './modules/CandidateSettings'
import { KeyBindings } from './modules/KeyBindings'
import { FuzzyPinyin } from './modules/FuzzyPinyin'
import { AsciiMode } from './modules/AsciiMode'
import type { EditorModule } from '@/types/config'

const MODULE_COMPONENTS: Record<EditorModule, React.ReactNode> = {
  'schema-manager': <SchemaManager />,
  'candidate-settings': <CandidateSettings />,
  'key-bindings': <KeyBindings />,
  'fuzzy-pinyin': <FuzzyPinyin />,
  'ascii-mode': <AsciiMode />,
}

export function EditorContent() {
  const activeModule = useConfigStore((s) => s.activeModule)

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mx-auto max-w-2xl">
        {MODULE_COMPONENTS[activeModule]}
      </div>
    </div>
  )
}
