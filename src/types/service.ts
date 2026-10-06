/** Espelha os DTOs de serviço da API. */

export interface ServiceRequest {
  name: string
  /** Preço padrão: vale quando não há preço específico para o porte do veículo. */
  price: number
  /** Preços por porte (opcionais). null/omitido = usa o preço padrão. */
  priceSmall?: number | null
  priceMedium?: number | null
  priceLarge?: number | null
}

export interface ServiceResponse {
  id: string
  name: string
  price: number
  priceSmall: number | null
  priceMedium: number | null
  priceLarge: number | null
  createdAt: string
  updatedAt: string
}
