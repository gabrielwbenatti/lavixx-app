import { api } from '@/lib/api'
import type { ServiceRequest, ServiceResponse } from '@/types/service'

export async function listServices(): Promise<ServiceResponse[]> {
  const { data } = await api.get<ServiceResponse[]>('/services')
  return data
}

export async function createService(payload: ServiceRequest): Promise<ServiceResponse> {
  const { data } = await api.post<ServiceResponse>('/services', payload)
  return data
}

export async function updateService(
  id: string,
  payload: ServiceRequest,
): Promise<ServiceResponse> {
  const { data } = await api.put<ServiceResponse>(`/services/${id}`, payload)
  return data
}

export async function deleteService(id: string): Promise<void> {
  await api.delete(`/services/${id}`)
}
