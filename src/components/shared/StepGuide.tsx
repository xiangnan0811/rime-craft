import { Children, isValidElement, type ReactNode } from 'react'

interface StepGuideProps {
  children: ReactNode
}

export function StepGuide({ children }: StepGuideProps) {
  const steps = Children.toArray(children).filter(isValidElement)

  return (
    <ol className="my-6 space-y-5 pl-0 [counter-reset:step] list-none">
      {steps.map((child, idx) => (
        <li key={idx} className="relative flex gap-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
            {idx + 1}
          </div>
          <div className="flex-1">{child}</div>
          {idx < steps.length - 1 && (
            <div
              aria-hidden
              className="absolute left-4 top-10 h-[calc(100%+1rem)] w-px bg-gray-200 dark:bg-slate-700"
            />
          )}
        </li>
      ))}
    </ol>
  )
}

interface StepProps {
  title: string
  children: ReactNode
}

export function Step({ title, children }: StepProps) {
  return (
    <div>
      <div className="mb-2 text-[15px] font-semibold text-gray-900 dark:text-slate-100">
        {title}
      </div>
      <div className="text-[15px] leading-[1.7] text-gray-700 dark:text-slate-300 [&>*:last-child]:mb-0">
        {children}
      </div>
    </div>
  )
}
