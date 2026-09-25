import { api } from '@/lib/api'
import type {
  ServiceOrderItemRequest,
  ServiceOrderItemResponse,
  ServiceOrderRequest,
  ServiceOrderResponse,
  ServiceOrderStats,
  ServiceStatus,
  UpdateItemRequest,
} from '@/types/serviceOrder'
import type { Page, PageParams } from '@/types/page'
import type { PaymentRequest } from '@/types/payment'

/** GET /service-orders — paginado, mais recentes primeiro (por data de emissão). */
export async function listServiceOrders(
  filters?: PageParams & {
    status?: ServiceStatus
    customerId?: string
    vehicleId?: string
    fromDate?: string
    toDate?: string
    /** Início/fim do intervalo de conclusão (finishedAt), em ISO. */
    finishedFrom?: string
    finishedTo?: string
    minAmount?: number
    maxAmount?: number
  },
): Promise<Page<ServiceOrderResponse>> {
  const { data } = await api.get<Page<ServiceOrderResponse>>('/service-orders', {
    params: filters,
  })
  return data
}

/** GET /service-orders/stats — totais das ordens que atendem aos filtros. */
export async function getServiceOrderStats(filters: {
  customerId?: string
  vehicleId?: string
  fromDate?: string
  toDate?: string
}): Promise<ServiceOrderStats> {
  const { data } = await api.get<ServiceOrderStats>('/service-orders/stats', { params: filters })
  return data
}

export async function listScheduledServiceOrders(
  fromDate: string,
  toDate: string,
): Promise<ServiceOrderResponse[]> {
  const { data } = await api.get<ServiceOrderResponse[]>('/service-orders/schedule', {
    params: { fromDate, toDate },
  })
  return data
}

export async function listPickupEstimates(
  fromDate: string,
  toDate: string,
): Promise<ServiceOrderResponse[]> {
  const { data } = await api.get<ServiceOrderResponse[]>('/service-orders/pickup-estimates', {
    params: { fromDate, toDate },
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

export async function updateServiceOrderPickupEstimate(
  id: string,
  estimatedPickupAt: string | null,
): Promise<ServiceOrderResponse> {
  const { data } = await api.patch<ServiceOrderResponse>(`/service-orders/${id}/pickup-estimate`, {
    estimatedPickupAt,
  })
  return data
}

/** Reagenda uma OS ainda nao chegada (cliente pediu para mudar o horario, ou lancamento errado). */
export async function updateServiceOrderScheduledAt(
  id: string,
  scheduledAt: string,
): Promise<ServiceOrderResponse> {
  const { data } = await api.patch<ServiceOrderResponse>(`/service-orders/${id}/scheduled-at`, {
    scheduledAt,
  })
  return data
}

/** Uso administrativo: corrige a data de emissao (lancamento retroativo). */
export async function updateServiceOrderIssuedAt(
  id: string,
  issuedAt: string,
): Promise<ServiceOrderResponse> {
  const { data } = await api.patch<ServiceOrderResponse>(`/service-orders/${id}/issued-at`, {
    issuedAt,
  })
  return data
}

/** Uso administrativo: corrige a data de finalizacao (a OS ja precisa estar concluida/cancelada). */
export async function updateServiceOrderFinishedAt(
  id: string,
  finishedAt: string,
): Promise<ServiceOrderResponse> {
  const { data } = await api.patch<ServiceOrderResponse>(`/service-orders/${id}/finished-at`, {
    finishedAt,
  })
  return data
}

/** Uso administrativo: corrige a data de um pagamento ja registrado. */
export async function updateServiceOrderPaymentDate(
  orderId: string,
  paymentId: string,
  paidAt: string,
): Promise<ServiceOrderResponse> {
  const { data } = await api.patch<ServiceOrderResponse>(
    `/service-orders/${orderId}/payments/${paymentId}/date`,
    { paidAt },
  )
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
