import { cn } from '@/lib/utils'

interface ModifiedBadgeProps {
  show: boolean;
  className?: string;
}

/**
 * A small blue dot indicating a field has been modified from its default value.
 */
export function ModifiedBadge({ show, className }: ModifiedBadgeProps) {
  if (!show) return null

  return (
    <span
      className={cn(
        'inline-block h-2 w-2 rounded-full bg-blue-500',
        className,
      )}
      title="已修改（与默认值不同）"
    />
  )
}
