import { cn } from '@/lib/utils'
import { type SelectHTMLAttributes, forwardRef } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          'flex h-9 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900',
          'transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-red-400 focus:ring-red-400',
          className
        )}
        {...props}
      />
    )
  }
)
Select.displayName = 'Select'

export { Select }
