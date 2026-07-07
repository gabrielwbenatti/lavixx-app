import { api } from '@/lib/api'
import type { PaymentMethodRequest, PaymentMethodResponse } from '@/types/paymentMethod'

export async function listPaymentMethods(): Promise<PaymentMethodResponse[]> {
  const { data } = await api.get<PaymentMethodResponse[]>('/payment-methods')
  return data
}

export async function createPaymentMethod(
  payload: PaymentMethodRequest,
): Promise<PaymentMethodResponse> {
  const { data } = await api.post<PaymentMethodResponse>('/payment-methods', payload)
  return data
}

export async function updatePaymentMethod(
  id: string,
  payload: PaymentMethodRequest,
): Promise<PaymentMethodResponse> {
  const { data } = await api.put<PaymentMethodResponse>(`/payment-methods/${id}`, payload)
  return data
}

export async function deletePaymentMethod(id: string): Promise<void> {
  await api.delete(`/payment-methods/${id}`)
}
