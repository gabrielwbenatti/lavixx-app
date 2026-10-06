import { api } from '@/lib/api'
import type { EmployeeRequest, EmployeeResponse } from '@/types/employee'

export async function listEmployees(): Promise<EmployeeResponse[]> {
  const { data } = await api.get<EmployeeResponse[]>('/employees')
  return data
}

export async function createEmployee(payload: EmployeeRequest): Promise<EmployeeResponse> {
  const { data } = await api.post<EmployeeResponse>('/employees', payload)
  return data
}

export async function updateEmployee(
  id: string,
  payload: EmployeeRequest,
): Promise<EmployeeResponse> {
  const { data } = await api.put<EmployeeResponse>(`/employees/${id}`, payload)
  return data
}

export async function deleteEmployee(id: string): Promise<void> {
  await api.delete(`/employees/${id}`)
}
