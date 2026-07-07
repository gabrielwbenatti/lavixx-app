import { api } from '@/lib/api'
import type { CustomerRequest, CustomerResponse } from '@/types/customer'

export async function listCustomers(): Promise<CustomerResponse[]> {
  const { data } = await api.get<CustomerResponse[]>('/customers')
  return data
}

export async function createCustomer(payload: CustomerRequest): Promise<CustomerResponse> {
  const { data } = await api.post<CustomerResponse>('/customers', payload)
  return data
}

export async function updateCustomer(
  id: string,
  payload: CustomerRequest,
): Promise<CustomerResponse> {
  const { data } = await api.put<CustomerResponse>(`/customers/${id}`, payload)
  return data
}

export async function deleteCustomer(id: string): Promise<void> {
  await api.delete(`/customers/${id}`)
}
