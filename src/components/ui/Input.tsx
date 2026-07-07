import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'h-11 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 transition-colors',
          'placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
          'dark:bg-slate-900 dark:text-slate-100',
          invalid
            ? 'border-red-400 focus-visible:ring-red-400'
            : 'border-slate-300 focus-visible:ring-indigo-500 dark:border-slate-600',
          className,
        )}
        {...props}
      />
    )
  },
)
Input.displayName = 'Input'
