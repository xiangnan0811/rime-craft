import type { ComponentPropsWithoutRef } from 'react'
import { GoToConfigButton } from './GoToConfigButton'

/** Custom components to use in MDX rendering */
export const mdxComponents = {
  GoToConfigButton,
  h1: (props: ComponentPropsWithoutRef<'h1'>) => (
    <h1 className="mb-4 text-3xl font-bold" {...props} />
  ),
  h2: (props: ComponentPropsWithoutRef<'h2'>) => (
    <h2 className="mb-3 mt-8 text-2xl font-semibold" {...props} />
  ),
  h3: (props: ComponentPropsWithoutRef<'h3'>) => (
    <h3 className="mb-2 mt-6 text-xl font-semibold" {...props} />
  ),
  p: (props: ComponentPropsWithoutRef<'p'>) => (
    <p className="mb-4 leading-relaxed text-gray-700" {...props} />
  ),
  ul: (props: ComponentPropsWithoutRef<'ul'>) => (
    <ul className="mb-4 list-disc space-y-1 pl-6 text-gray-700" {...props} />
  ),
  ol: (props: ComponentPropsWithoutRef<'ol'>) => (
    <ol className="mb-4 list-decimal space-y-1 pl-6 text-gray-700" {...props} />
  ),
  li: (props: ComponentPropsWithoutRef<'li'>) => (
    <li className="leading-relaxed" {...props} />
  ),
  code: (props: ComponentPropsWithoutRef<'code'>) => (
    <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-sm text-gray-800" {...props} />
  ),
  pre: (props: ComponentPropsWithoutRef<'pre'>) => (
    <pre className="mb-4 overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100" {...props} />
  ),
  blockquote: (props: ComponentPropsWithoutRef<'blockquote'>) => (
    <blockquote className="mb-4 border-l-4 border-blue-300 bg-blue-50 p-4 text-gray-700" {...props} />
  ),
  table: (props: ComponentPropsWithoutRef<'table'>) => (
    <div className="mb-4 overflow-x-auto">
      <table className="w-full border-collapse text-sm" {...props} />
    </div>
  ),
  th: (props: ComponentPropsWithoutRef<'th'>) => (
    <th className="border-b bg-gray-50 px-4 py-2 text-left font-medium" {...props} />
  ),
  td: (props: ComponentPropsWithoutRef<'td'>) => (
    <td className="border-b px-4 py-2" {...props} />
  ),
}
