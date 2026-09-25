/** Espelha os DTOs de ordem de serviço da API. */

import type { CustomerSummary } from '@/types/customer'
import type { PaymentResponse, PaymentStatus } from '@/types/payment'
import type { VehicleSummary } from '@/types/vehicle'

export const SERVICE_STATUSES = ['scheduled', 'waiting', 'in_progress', 'done', 'cancelled'] as const
export type ServiceStatus = (typeof SERVICE_STATUSES)[number]

export const SERVICE_STATUS_LABELS: Record<ServiceStatus, string> = {
  scheduled: 'Agendada',
  waiting: 'Aguardando',
  in_progress: 'Em andamento',
  done: 'Concluída',
  cancelled: 'Cancelada',
}

/** Transições de status permitidas (espelha VALID_TRANSITIONS da API). */
export const STATUS_TRANSITIONS: Record<ServiceStatus, ServiceStatus[]> = {
  scheduled: ['waiting', 'cancelled'],
  waiting: ['in_progress', 'cancelled'],
  in_progress: ['done', 'cancelled'],
  done: [],
  cancelled: [],
}

/** Status em que a ordem pode ser excluída (espelha DELETABLE_STATUSES da API). */
export const DELETABLE_STATUSES: ServiceStatus[] = ['scheduled', 'waiting']

/** Status em que a ordem aceita edição de itens. */
export const EDITABLE_STATUSES: ServiceStatus[] = ['waiting', 'in_progress']

export interface ServiceOrderItemRequest {
  /** Exatamente um: serviceId OU productId. */
  serviceId?: string
  productId?: string
  discount?: number
  quantity?: number
}

export interface ServiceOrderItemResponse {
  id: string
  serviceId: string | null
  productId: string | null
  name: string
  unitPrice: number
  discount: number
  quantity: number
  finalPrice: number
}

export interface ServiceOrderRequest {
  vehicleId: string
  items?: ServiceOrderItemRequest[]
  observations?: string
  /** Se informado, a OS nasce com status 'scheduled' em vez de 'waiting'. */
  scheduledAt?: string
}

export interface ServiceOrderResponse {
  id: string
  customerId: string
  vehicleId: string
  customer: CustomerSummary
  vehicle: VehicleSummary
  status: ServiceStatus
  items: ServiceOrderItemResponse[]
  /** Soma dos itens, sem descontos/taxa. */
  subtotal: number
  /** Desconto de fidelidade (%) aplicado a esta OS (0 = nenhum). */
  loyaltyRewardPercent: number
  /** Valor em R$ do desconto de fidelidade (subtotal × loyaltyRewardPercent / 100). */
  loyaltyDiscount: number
  /** Taxa de serviço (%) aplicada a esta OS (congelada na criação, ajustável). */
  serviceTax: number
  /** Valor em R$ da taxa de serviço (sobre o subtotal já com desconto). */
  taxAmount: number
  /** Total a cobrar ((subtotal − loyaltyDiscount) + taxAmount). */
  total: number
  payments: PaymentResponse[]
  paidTotal: number
  paymentStatus: PaymentStatus
  observations: string | null
  scheduledAt: string | null
  estimatedPickupAt: string | null
  /** Data de emissao da OS (editavel por admin) — usada nas telas/relatorios. */
  issuedAt: string
  createdAt: string
  updatedAt: string
  finishedAt: string | null
}

/** Resposta de GET /service-orders/stats. */
export interface ServiceOrderStats {
  totalOrders: number
  completedOrders: number
  /** Soma dos pagamentos das ordens concluídas. */
  paidTotal: number
}

export interface UpdateItemRequest {
  discount?: number
  quantity?: number
}
