/** Espelha os DTOs de cliente da API. */

export interface CustomerRequest {
  name: string
  document?: string
  phone?: string
}

/** Dados do cliente embutidos em outras respostas (ex.: ordem de serviço). */
export interface CustomerSummary {
  id: string
  name: string
  document: string | null
  phone: string | null
}

export interface CustomerResponse {
  id: string
  name: string
  document: string | null
  phone: string | null
  createdAt: string
  updatedAt: string
}
