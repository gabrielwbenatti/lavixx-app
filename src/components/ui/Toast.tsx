import { useEffect } from 'react'
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react'
import { cn } from '@/lib/cn'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastProps {
  id: string
  message: string
  type: ToastType
  duration?: number
  onClose: (id: string) => void
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={20} />,
  error: <XCircle size={20} />,
  warning: <AlertCircle size={20} />,
  info: <Info size={20} />,
}

const styles: Record<ToastType, string> = {
  success: 'bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-200 border-green-200 dark:border-green-800',
  error: 'bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-200 border-red-200 dark:border-red-800',
  warning: 'bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border-amber-200 dark:border-amber-800',
  info: 'bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-200 border-blue-200 dark:border-blue-800',
}

const iconStyles: Record<ToastType, string> = {
  success: 'text-green-600 dark:text-green-400',
  error: 'text-red-600 dark:text-red-400',
  warning: 'text-amber-600 dark:text-amber-400',
  info: 'text-blue-600 dark:text-blue-400',
}

export function Toast({ id, message, type, duration = 4000, onClose }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => onClose(id), duration)
      return () => clearTimeout(timer)
    }
  }, [id, duration, onClose])

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg',
        styles[type],
      )}
      role="alert"
    >
      <div className={cn('shrink-0', iconStyles[type])}>{icons[type]}</div>
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={() => onClose(id)}
        className="shrink-0 text-lg opacity-60 hover:opacity-100"
        aria-label="Fechar notificação"
      >
        ✕
      </button>
    </div>
  )
}

export function Toaster({ toasts, onClose }: { toasts: ToastProps[]; onClose: (id: string) => void }) {
  return (
    <div className="pointer-events-none fixed bottom-0 right-0 z-40 flex flex-col gap-2 p-4 sm:bottom-4 sm:right-4">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto animate-in slide-in-from-right-full">
          <Toast {...toast} onClose={onClose} />
        </div>
      ))}
    </div>
  )
}
