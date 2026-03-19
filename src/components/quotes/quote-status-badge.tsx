import { type QuoteStatus, QUOTE_STATUS_LABELS, QUOTE_STATUS_COLORS } from '@/types'
import { cn } from '@/lib/utils'

export function QuoteStatusBadge({
  status,
  className,
}: {
  status: QuoteStatus
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        QUOTE_STATUS_COLORS[status],
        className
      )}
    >
      {QUOTE_STATUS_LABELS[status]}
    </span>
  )
}
