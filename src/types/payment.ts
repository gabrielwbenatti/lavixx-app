/** Espelha os DTOs de pagamento da API. */

export interface PaymentRequest {
  paymentMethodId: string
  amount: number
}

export interface PaymentResponse {
  id: string
  paymentMethodId: string | null
  methodName: string
  amount: number
  paidAt: string
}

export const PAYMENT_STATUSES = ['pending', 'partial', 'paid'] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Pendente',
  partial: 'Parcial',
  paid: 'Pago',
}
