/** Espelha os DTOs de forma de pagamento da API. */

export interface PaymentMethodRequest {
  name: string
  active?: boolean
}

export interface PaymentMethodResponse {
  id: string
  name: string
  active: boolean
  createdAt: string
  updatedAt: string
}
