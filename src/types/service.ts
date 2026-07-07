/** Espelha os DTOs de serviço da API. */

export interface ServiceRequest {
  name: string
  price: number
}

export interface ServiceResponse {
  id: string
  name: string
  price: number
  createdAt: string
  updatedAt: string
}
