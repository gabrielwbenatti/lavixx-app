import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, invalid, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          'h-11 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
          'dark:bg-slate-900 dark:text-slate-100',
          invalid
            ? 'border-red-400 focus-visible:ring-red-400'
            : 'border-slate-300 focus-visible:ring-indigo-500 dark:border-slate-600',
          className,
        )}
        {...props}
      >
        {children}
      </select>
    )
  },
)
Select.displayName = 'Select'
