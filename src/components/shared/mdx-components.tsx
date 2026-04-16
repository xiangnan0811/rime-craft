import type { ComponentPropsWithoutRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useConfigStore } from '@/stores/config-store'
import { MODULE_REGISTRY } from '@/data/module-registry'
import type { EditorModule } from '@/types/config'
import { GoToConfigButton } from './GoToConfigButton'
import { ConfigSlot } from './ConfigSlot'
import { Pre, InlineCode } from './CodeBlock'
import { Callout } from './Callout'
import { Details } from './Details'
import { StepGuide, Step } from './StepGuide'
import { YamlPreview } from './YamlPreview'

/** Map tutorial slug (used in MDX links) → editor module ID */
function findModuleByTutorialSlug(slug: string): EditorModule | undefined {
  return MODULE_REGISTRY.find((m) => (m.tutorialSlug ?? m.id) === slug)?.id
}

export const mdxComponents = {
  GoToConfigButton,
  ConfigSlot,
  Details,
  StepGuide,
  Step,
  YamlPreview,

  tip: (props: Record<string, unknown>) => <Callout calloutType="tip" {...props} />,
  warning: (props: Record<string, unknown>) => <Callout calloutType="warning" {...props} />,
  note: (props: Record<string, unknown>) => <Callout calloutType="note" {...props} />,
  caution: (props: Record<string, unknown>) => <Callout calloutType="caution" {...props} />,

  // Business-logic shells: retained because they do more than style.

  a: function MdxLink({ href, ...rest }: ComponentPropsWithoutRef<'a'>) {
    const location = useLocation()
    const setActiveModule = useConfigStore((s) => s.setActiveModule)
    const className = 'text-blue-600 underline decoration-blue-300 underline-offset-2 hover:text-blue-800 dark:text-blue-400 dark:decoration-blue-700 dark:hover:text-blue-300'

    // Relative tutorial links (./slug)
    if (href?.startsWith('./')) {
      const slug = href.slice(2)

      // In editor: switch to corresponding module if it exists
      if (location.pathname === '/editor') {
        const moduleId = findModuleByTutorialSlug(slug)
        if (moduleId) {
          return (
            <a
              className={className}
              role="button"
              onClick={(e) => { e.preventDefault(); setActiveModule(moduleId) }}
              {...rest}
            />
          )
        }
      }

      // Otherwise (docs page, or slug has no editor module): navigate to docs
      return <Link to={`/docs/${slug}`} className={className} {...rest} />
    }

    // Absolute internal links → use React Router
    if (href?.startsWith('/')) {
      return <Link to={href} className={className} {...rest} />
    }

    // External links, anchors, etc. → plain <a>
    return <a className={className} href={href} {...rest} />
  },

  // Wrap tables in a horizontal-scroll container. Prose styles the inner
  // <thead>/<th>/<td> via --tw-prose-* variables defined in index.css.
  table: (props: ComponentPropsWithoutRef<'table'>) => (
    <div className="my-4 overflow-x-auto">
      <table className="w-full border-collapse text-sm" {...props} />
    </div>
  ),

  // Directive dispatcher: remark-directive-rehype emits <div
  // data-directive="tip"> etc., which this turns into <Callout>.
  div: (props: ComponentPropsWithoutRef<'div'>) => {
    const directive = (props as Record<string, unknown>)['data-directive'] as string | undefined
    if (directive && ['tip', 'warning', 'note', 'caution'].includes(directive)) {
      return <Callout {...props} />
    }
    return <div {...props} />
  },

  pre: Pre,
  code: InlineCode,
}
