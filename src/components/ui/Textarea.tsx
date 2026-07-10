import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 transition-colors',
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
Textarea.displayName = 'Textarea'
