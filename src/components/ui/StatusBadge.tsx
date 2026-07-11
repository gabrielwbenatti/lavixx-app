import { cn } from '@/lib/cn'
import { SERVICE_STATUS_LABELS, type ServiceStatus } from '@/types/serviceOrder'

const styles: Record<ServiceStatus, string> = {
  scheduled: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300',
  waiting: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  done: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
  cancelled: 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
}

export function StatusBadge({ status }: { status: ServiceStatus }) {
  return (
    <span
      className={cn(
        'inline-block rounded-full px-2.5 py-0.5 text-xs font-medium',
        styles[status],
      )}
    >
      {SERVICE_STATUS_LABELS[status]}
    </span>
  )
}
