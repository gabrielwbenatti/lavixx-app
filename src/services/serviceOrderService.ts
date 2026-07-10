import { api } from '@/lib/api'
import type {
  ServiceOrderItemRequest,
  ServiceOrderItemResponse,
  ServiceOrderRequest,
  ServiceOrderResponse,
  ServiceStatus,
  UpdateItemRequest,
} from '@/types/serviceOrder'
import type { PaymentRequest } from '@/types/payment'

export async function listServiceOrders(filters?: {
  status?: ServiceStatus
  customerId?: string
  vehicleId?: string
  fromDate?: string
  toDate?: string
  minAmount?: number
  maxAmount?: number
}): Promise<ServiceOrderResponse[]> {
  const { data } = await api.get<ServiceOrderResponse[]>('/service-orders', {
    params: filters ?? undefined,
  })
  return data
}

export async function getServiceOrder(id: string): Promise<ServiceOrderResponse> {
  const { data } = await api.get<ServiceOrderResponse>(`/service-orders/${id}`)
  return data
}

export async function createServiceOrder(
  payload: ServiceOrderRequest,
): Promise<ServiceOrderResponse> {
  const { data } = await api.post<ServiceOrderResponse>('/service-orders', payload)
  return data
}

export async function updateServiceOrderStatus(
  id: string,
  status: ServiceStatus,
): Promise<ServiceOrderResponse> {
  const { data } = await api.patch<ServiceOrderResponse>(`/service-orders/${id}/status`, { status })
  return data
}

export async function updateServiceOrderTax(
  id: string,
  serviceTax: number,
): Promise<ServiceOrderResponse> {
  const { data } = await api.patch<ServiceOrderResponse>(`/service-orders/${id}/tax`, {
    serviceTax,
  })
  return data
}

export async function updateServiceOrderObservations(
  id: string,
  observations: string,
): Promise<ServiceOrderResponse> {
  const { data } = await api.patch<ServiceOrderResponse>(`/service-orders/${id}/observations`, {
    observations,
  })
  return data
}

export async function redeemServiceOrderLoyalty(id: string): Promise<ServiceOrderResponse> {
  const { data } = await api.post<ServiceOrderResponse>(`/service-orders/${id}/loyalty-redeem`)
  return data
}

export async function removeServiceOrderLoyalty(id: string): Promise<ServiceOrderResponse> {
  const { data } = await api.delete<ServiceOrderResponse>(`/service-orders/${id}/loyalty-redeem`)
  return data
}

export async function addServiceOrderItem(
  orderId: string,
  payload: ServiceOrderItemRequest,
): Promise<ServiceOrderResponse> {
  const { data } = await api.post<ServiceOrderResponse>(
    `/service-orders/${orderId}/items`,
    payload,
  )
  return data
}

export async function updateServiceOrderItem(
  orderId: string,
  itemId: string,
  payload: UpdateItemRequest,
): Promise<ServiceOrderItemResponse> {
  const { data } = await api.put<ServiceOrderItemResponse>(
    `/service-orders/${orderId}/items/${itemId}`,
    payload,
  )
  return data
}

export async function removeServiceOrderItem(orderId: string, itemId: string): Promise<void> {
  await api.delete(`/service-orders/${orderId}/items/${itemId}`)
}

export async function addServiceOrderPayment(
  orderId: string,
  payload: PaymentRequest,
): Promise<ServiceOrderResponse> {
  const { data } = await api.post<ServiceOrderResponse>(
    `/service-orders/${orderId}/payments`,
    payload,
  )
  return data
}

export async function removeServiceOrderPayment(
  orderId: string,
  paymentId: string,
): Promise<ServiceOrderResponse> {
  const { data } = await api.delete<ServiceOrderResponse>(
    `/service-orders/${orderId}/payments/${paymentId}`,
  )
  return data
}

export async function deleteServiceOrder(id: string): Promise<void> {
  await api.delete(`/service-orders/${id}`)
}
