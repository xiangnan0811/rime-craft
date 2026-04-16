import { cn } from '@/lib/utils'
import type { ThemeStyle } from '@/types/config'

interface CandidatePreviewProps {
  candidates?: string[];
  labels?: string[];
  comments?: string[];
  input?: string;
  theme?: ThemeStyle;
  darkMode?: boolean;
  className?: string;
}

export function CandidatePreview({
  candidates = ['你好', '你', '尼', '泥', '拟'],
  labels = ['1', '2', '3', '4', '5'],
  comments = [],
  input = 'nihao',
  theme,
  darkMode = false,
  className,
}: CandidatePreviewProps) {
  // When no theme, use Tailwind classes (backward compatible for HomePage)
  if (!theme) {
    return (
      <div className={cn('inline-block rounded-lg border bg-card p-3 text-card-foreground shadow-lg', className)}>
        <div className="mb-2 text-sm text-blue-600 dark:text-blue-400">{input}</div>
        <div className="flex gap-3">
          {candidates.map((text, i) => (
            <span key={i} className={cn(
              'whitespace-nowrap text-sm',
              i === 0
                ? 'rounded bg-blue-100 px-1.5 py-0.5 font-medium text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
                : 'text-foreground/90',
            )}>
              <span className="mr-1 text-xs text-muted-foreground">{labels[i]}</span>
              {text}
            </span>
          ))}
        </div>
      </div>
    )
  }

  // Theme-aware rendering with inline styles
  const { colors } = theme
  const outerBg = darkMode ? '#1a1a2e' : '#f0f0f0'

  return (
    <div className={cn('inline-flex items-center justify-center rounded-xl p-8', className)} style={{ backgroundColor: outerBg }}>
      <div
        style={{
          backgroundColor: colors.backgroundColor,
          border: `${theme.borderWidth}px solid ${colors.borderColor}`,
          borderRadius: `${theme.cornerRadius}px`,
          padding: '8px 12px',
          fontFamily: theme.fontFace,
          fontSize: `${theme.fontSize}px`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          minWidth: '200px',
        }}
      >
        {/* Composing area (pinyin input) */}
        <div style={{
          color: colors.hilitedTextColor,
          backgroundColor: colors.hilitedBackColor,
          padding: '2px 6px',
          borderRadius: '3px',
          marginBottom: `${theme.lineSpacing}px`,
          fontSize: `${theme.fontSize}px`,
        }}>
          {input}
        </div>

        {/* Candidates */}
        <div style={{
          display: 'flex',
          flexDirection: theme.horizontal ? 'row' : 'column',
          gap: `${theme.spacing}px`,
        }}>
          {candidates.map((text, i) => {
            const isSelected = i === 0
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '4px',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  backgroundColor: isSelected ? colors.hilitedCandidateBackColor : 'transparent',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{
                  color: colors.labelColor,
                  fontSize: `${theme.labelFontSize}px`,
                }}>
                  {labels[i]}
                </span>
                <span style={{
                  color: isSelected ? colors.hilitedCandidateTextColor : colors.candidateTextColor,
                  fontWeight: isSelected ? 500 : 400,
                }}>
                  {text}
                </span>
                {comments[i] && (
                  <span style={{
                    color: colors.commentTextColor,
                    fontSize: `${theme.labelFontSize}px`,
                    marginLeft: '4px',
                  }}>
                    {comments[i]}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
