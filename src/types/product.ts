/** Espelha os DTOs de produto da API. */

export interface ProductRequest {
  name: string
  price: number
}

export interface ProductResponse {
  id: string
  name: string
  price: number
  createdAt: string
  updatedAt: string
}
