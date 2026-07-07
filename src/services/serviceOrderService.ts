import { api } from '@/lib/api'
import type {
  ServiceOrderItemRequest,
  ServiceOrderItemResponse,
  ServiceOrderRequest,
  ServiceOrderResponse,
  ServiceStatus,
  UpdateItemRequest,
} from '@/types/serviceOrder'

export async function listServiceOrders(status?: ServiceStatus): Promise<ServiceOrderResponse[]> {
  const { data } = await api.get<ServiceOrderResponse[]>('/service-orders', {
    params: status ? { status } : undefined,
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

export async function deleteServiceOrder(id: string): Promise<void> {
  await api.delete(`/service-orders/${id}`)
}
