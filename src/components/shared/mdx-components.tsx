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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '')
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

  h1: (props: ComponentPropsWithoutRef<'h1'>) => {
    const id = typeof props.children === 'string' ? slugify(props.children) : undefined
    return <h1 id={id} className="mb-2 text-2xl font-bold text-gray-900 dark:text-slate-100" {...props} />
  },
  h2: (props: ComponentPropsWithoutRef<'h2'>) => {
    const id = typeof props.children === 'string' ? slugify(props.children) : undefined
    return <h2 id={id} className="mb-3 mt-8 scroll-mt-20 text-xl font-semibold text-gray-900 dark:text-slate-100" {...props} />
  },
  h3: (props: ComponentPropsWithoutRef<'h3'>) => {
    const id = typeof props.children === 'string' ? slugify(props.children) : undefined
    return <h3 id={id} className="mb-2 mt-6 scroll-mt-20 text-lg font-semibold text-gray-900 dark:text-slate-100" {...props} />
  },

  p: (props: ComponentPropsWithoutRef<'p'>) => (
    <p className="mb-4 text-[15px] leading-[1.7] text-gray-700 dark:text-slate-300" {...props} />
  ),

  ul: (props: ComponentPropsWithoutRef<'ul'>) => (
    <ul className="mb-4 list-disc space-y-1.5 pl-6 text-[15px] text-gray-700 dark:text-slate-300" {...props} />
  ),
  ol: (props: ComponentPropsWithoutRef<'ol'>) => (
    <ol className="mb-4 list-decimal space-y-1.5 pl-6 text-[15px] text-gray-700 dark:text-slate-300" {...props} />
  ),
  li: (props: ComponentPropsWithoutRef<'li'>) => (
    <li className="leading-[1.7]" {...props} />
  ),

  a: function MdxLink({ href, ...rest }: ComponentPropsWithoutRef<'a'>) {
    const location = useLocation()
    const setActiveModule = useConfigStore((s) => s.setActiveModule)
    const className = "text-blue-600 underline decoration-blue-300 underline-offset-2 hover:text-blue-800 dark:text-blue-400 dark:decoration-blue-700 dark:hover:text-blue-300"

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

  pre: Pre,
  code: InlineCode,

  blockquote: (props: ComponentPropsWithoutRef<'blockquote'>) => (
    <blockquote className="my-4 border-l-[3px] border-gray-300 pl-4 text-gray-600 dark:border-slate-600 dark:text-slate-400" {...props} />
  ),

  table: (props: ComponentPropsWithoutRef<'table'>) => (
    <div className="my-4 overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-700">
      <table className="w-full border-collapse text-sm" {...props} />
    </div>
  ),
  thead: (props: ComponentPropsWithoutRef<'thead'>) => (
    <thead className="bg-gray-50 dark:bg-slate-800" {...props} />
  ),
  th: (props: ComponentPropsWithoutRef<'th'>) => (
    <th className="border-b border-gray-200 px-4 py-2.5 text-left text-sm font-medium text-gray-700 dark:border-slate-700 dark:text-slate-300" {...props} />
  ),
  td: (props: ComponentPropsWithoutRef<'td'>) => (
    <td className="border-b border-gray-100 px-4 py-2.5 text-gray-700 dark:border-slate-800 dark:text-slate-300" {...props} />
  ),

  hr: (props: ComponentPropsWithoutRef<'hr'>) => (
    <hr className="my-8 border-gray-200 dark:border-slate-700" {...props} />
  ),

  strong: (props: ComponentPropsWithoutRef<'strong'>) => (
    <strong className="font-semibold text-gray-900 dark:text-slate-100" {...props} />
  ),

  div: (props: ComponentPropsWithoutRef<'div'>) => {
    const directive = (props as Record<string, unknown>)['data-directive'] as string | undefined
    if (directive && ['tip', 'warning', 'note', 'caution'].includes(directive)) {
      return <Callout {...props} />
    }
    return <div {...props} />
  },
}
