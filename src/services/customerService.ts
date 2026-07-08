import { api } from '@/lib/api'
import type { CustomerRequest, CustomerResponse } from '@/types/customer'
import type { LoyaltyStatus } from '@/types/loyalty'

export async function listCustomers(): Promise<CustomerResponse[]> {
  const { data } = await api.get<CustomerResponse[]>('/customers')
  return data
}

export async function getCustomer(id: string): Promise<CustomerResponse> {
  const { data } = await api.get<CustomerResponse>(`/customers/${id}`)
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

export async function getCustomerLoyalty(id: string): Promise<LoyaltyStatus> {
  const { data } = await api.get<LoyaltyStatus>(`/customers/${id}/loyalty`)
  return data
}
