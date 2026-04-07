import { Link } from 'react-router-dom'
import type { EditorModule } from '@/types/config'

/** Map editor modules to tutorial slugs */
const MODULE_TO_SLUG: Record<EditorModule, string> = {
  'schema-manager': 'schema-manager',
  'candidate-settings': 'candidate-settings',
  'key-bindings': 'key-bindings',
  'fuzzy-pinyin': 'fuzzy-pinyin',
  'ascii-mode': 'ascii-mode',
  'punctuation': 'punctuation',
  'dictionary': 'dictionary',
  'switches': 'switches',
}

interface LearnMoreLinkProps {
  module: EditorModule;
}

export function LearnMoreLink({ module }: LearnMoreLinkProps) {
  const slug = MODULE_TO_SLUG[module]

  return (
    <Link
      to={`/docs/${slug}`}
      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
      target="_blank"
    >
      📖 了解更多
    </Link>
  )
}
