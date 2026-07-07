/** Espelha os DTOs de ordem de serviço da API. */

import type { PaymentResponse, PaymentStatus } from '@/types/payment'

export const SERVICE_STATUSES = ['waiting', 'in_progress', 'done', 'cancelled'] as const
export type ServiceStatus = (typeof SERVICE_STATUSES)[number]

export const SERVICE_STATUS_LABELS: Record<ServiceStatus, string> = {
  waiting: 'Aguardando',
  in_progress: 'Em andamento',
  done: 'Concluída',
  cancelled: 'Cancelada',
}

/** Transições de status permitidas (espelha VALID_TRANSITIONS da API). */
export const STATUS_TRANSITIONS: Record<ServiceStatus, ServiceStatus[]> = {
  waiting: ['in_progress', 'cancelled'],
  in_progress: ['done', 'cancelled'],
  done: [],
  cancelled: [],
}

/** Status em que a ordem aceita edição de itens. */
export const EDITABLE_STATUSES: ServiceStatus[] = ['waiting', 'in_progress']

export interface ServiceOrderItemRequest {
  serviceId: string
  discount?: number
  quantity?: number
}

export interface ServiceOrderItemResponse {
  id: string
  serviceId: string | null
  name: string
  unitPrice: number
  discount: number
  quantity: number
  finalPrice: number
}

export interface ServiceOrderRequest {
  vehicleId: string
  items?: ServiceOrderItemRequest[]
}

export interface ServiceOrderResponse {
  id: string
  customerId: string
  vehicleId: string
  status: ServiceStatus
  items: ServiceOrderItemResponse[]
  total: number
  payments: PaymentResponse[]
  paidTotal: number
  paymentStatus: PaymentStatus
  createdAt: string
  updatedAt: string
  finishedAt: string | null
}

export interface UpdateItemRequest {
  discount?: number
  quantity?: number
}
