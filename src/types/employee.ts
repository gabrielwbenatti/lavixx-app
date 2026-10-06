/** Espelha os DTOs de funcionário da API. */

export interface EmployeeRequest {
  name: string
  active?: boolean
}

export interface EmployeeResponse {
  id: string
  name: string
  active: boolean
  createdAt: string
  updatedAt: string
}
