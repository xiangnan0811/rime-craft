import { useConfigStore } from '@/stores/config-store'
import { ModuleWrapper } from './ModuleWrapper'
import { SchemaManager } from './modules/SchemaManager'
import { CandidateSettings } from './modules/CandidateSettings'
import { KeyBindings } from './modules/KeyBindings'
import { FuzzyPinyin } from './modules/FuzzyPinyin'
import { AsciiMode } from './modules/AsciiMode'
import { Punctuation } from './modules/Punctuation'
import { Dictionary } from './modules/Dictionary'
import { Switches } from './modules/Switches'
import type { EditorModule } from '@/types/config'

const MODULE_COMPONENTS: Record<EditorModule, React.ReactNode> = {
  'schema-manager': <ModuleWrapper module="schema-manager"><SchemaManager /></ModuleWrapper>,
  'candidate-settings': <ModuleWrapper module="candidate-settings"><CandidateSettings /></ModuleWrapper>,
  'key-bindings': <ModuleWrapper module="key-bindings"><KeyBindings /></ModuleWrapper>,
  'fuzzy-pinyin': <ModuleWrapper module="fuzzy-pinyin"><FuzzyPinyin /></ModuleWrapper>,
  'ascii-mode': <ModuleWrapper module="ascii-mode"><AsciiMode /></ModuleWrapper>,
  'punctuation': <ModuleWrapper module="punctuation"><Punctuation /></ModuleWrapper>,
  'dictionary': <ModuleWrapper module="dictionary"><Dictionary /></ModuleWrapper>,
  'switches': <ModuleWrapper module="switches"><Switches /></ModuleWrapper>,
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
