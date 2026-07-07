/** Espelha os DTOs de cliente da API. */

export interface CustomerRequest {
  name: string
  document?: string
}

export interface CustomerResponse {
  id: string
  name: string
  document: string | null
  createdAt: string
  updatedAt: string
}
