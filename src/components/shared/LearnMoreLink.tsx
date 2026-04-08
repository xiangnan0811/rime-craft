import { Link } from 'react-router-dom'
import { MODULE_REGISTRY } from '@/data/module-registry'

interface LearnMoreLinkProps {
  module: string;
}

export function LearnMoreLink({ module }: LearnMoreLinkProps) {
  const moduleDef = MODULE_REGISTRY.find((m) => m.id === module)
  const slug = moduleDef?.tutorialSlug ?? module

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
