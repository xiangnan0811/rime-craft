import type { ComponentPropsWithoutRef } from 'react'
import { GoToConfigButton } from './GoToConfigButton'
import { ConfigSlot } from './ConfigSlot'
import { Pre, InlineCode } from './CodeBlock'
import { Callout } from './Callout'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const mdxComponents = {
  GoToConfigButton,
  ConfigSlot,

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

  a: (props: ComponentPropsWithoutRef<'a'>) => (
    <a className="text-blue-600 underline decoration-blue-300 underline-offset-2 hover:text-blue-800 dark:text-blue-400 dark:decoration-blue-700 dark:hover:text-blue-300" {...props} />
  ),

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
