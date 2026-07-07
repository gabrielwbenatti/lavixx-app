/** Espelha os DTOs de relatório da API. */

export interface PaymentMethodTotal {
  methodName: string
  count: number
  total: number
}

export interface ServiceTotal {
  name: string
  quantity: number
  total: number
}

export interface ReportSummaryResponse {
  from: string // yyyy-MM-dd
  to: string // yyyy-MM-dd
  completedOrders: number
  revenue: number // faturado (OS concluídas no período)
  received: number // recebido (pagamentos no período)
  receivable: number // a receber
  averageTicket: number
  byPaymentMethod: PaymentMethodTotal[]
  byService: ServiceTotal[]
}
