/** Espelha os DTOs de cliente da API. */

export interface CustomerRequest {
  name: string
  document?: string
  phone?: string
}

export interface CustomerResponse {
  id: string
  name: string
  document: string | null
  phone: string | null
  createdAt: string
  updatedAt: string
}
