/** Espelha os DTOs de funcionário da API. */

export interface EmployeeRequest {
  name: string
  active?: boolean
}

/** Funcionário resumido, embutido nos itens da OS. */
export interface EmployeeSummary {
  id: string
  name: string
}

export interface EmployeeResponse {
  id: string
  name: string
  active: boolean
  createdAt: string
  updatedAt: string
}
