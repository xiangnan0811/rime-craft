import { cn } from '@/lib/utils'

interface CandidatePreviewProps {
  candidates?: string[];
  labels?: string[];
  input?: string;
  horizontal?: boolean;
  className?: string;
}

export function CandidatePreview({
  candidates = ['你好', '你', '尼', '泥', '拟'],
  labels = ['1', '2', '3', '4', '5'],
  input = 'nihao',
  horizontal = true,
  className,
}: CandidatePreviewProps) {
  return (
    <div className={cn('inline-block rounded-lg border bg-white p-3 shadow-lg', className)}>
      <div className="mb-2 text-sm text-blue-600">{input}</div>
      <div className={cn('gap-3', horizontal ? 'flex' : 'flex flex-col')}>
        {candidates.map((text, i) => (
          <span key={i} className={cn(
            'whitespace-nowrap text-sm',
            i === 0 ? 'rounded bg-blue-100 px-1.5 py-0.5 font-medium text-blue-800' : 'text-gray-700',
          )}>
            <span className="mr-1 text-xs text-gray-400">{labels[i]}</span>
            {text}
          </span>
        ))}
      </div>
    </div>
  )
}
