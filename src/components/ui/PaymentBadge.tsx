import { cn } from '@/lib/cn'
import { PAYMENT_STATUS_LABELS, type PaymentStatus } from '@/types/payment'

const styles: Record<PaymentStatus, string> = {
  pending: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  partial: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  paid: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return (
    <span
      className={cn(
        'inline-block rounded-full px-2.5 py-0.5 text-xs font-medium',
        styles[status],
      )}
    >
      {PAYMENT_STATUS_LABELS[status]}
    </span>
  )
}
