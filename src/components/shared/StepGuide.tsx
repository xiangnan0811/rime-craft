import { Children, isValidElement, type ReactNode } from 'react'

interface StepGuideProps {
  children: ReactNode
}

export function StepGuide({ children }: StepGuideProps) {
  const steps = Children.toArray(children).filter(isValidElement)

  return (
    <ol className="my-6 space-y-5 pl-0 [counter-reset:step] list-none">
      {steps.map((child, idx) => (
        <li key={idx} className="relative flex gap-3 rounded-2xl border border-border/70 bg-card/60 p-4 shadow-sm">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
            {idx + 1}
          </div>
          <div className="flex-1">{child}</div>
          {idx < steps.length - 1 && (
            <div
              aria-hidden
              className="absolute left-8 top-[calc(100%+0.25rem)] h-4 w-px bg-border"
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
      <div className="mb-2 text-[15px] font-semibold text-foreground">
        {title}
      </div>
      <div className="text-[15px] leading-[1.7] text-muted-foreground [&>*:last-child]:mb-0">
        {children}
      </div>
    </div>
  )
}
