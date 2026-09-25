import { api } from '@/lib/api'
import type { Page, PageParams } from '@/types/page'
import type { VehicleRequest, VehicleResponse } from '@/types/vehicle'

/**
 * GET /vehicles — paginado; `search` busca por placa, apelido, modelo ou nome do cliente;
 * `customerId` restringe aos veículos de um cliente.
 */
export async function listVehicles(
  params?: PageParams & { search?: string; customerId?: string },
): Promise<Page<VehicleResponse>> {
  const { data } = await api.get<Page<VehicleResponse>>('/vehicles', { params })
  return data
}

export async function getVehicle(id: string): Promise<VehicleResponse> {
  const { data } = await api.get<VehicleResponse>(`/vehicles/${id}`)
  return data
}

export async function createVehicle(payload: VehicleRequest): Promise<VehicleResponse> {
  const { data } = await api.post<VehicleResponse>('/vehicles', payload)
  return data
}

export async function updateVehicle(
  id: string,
  payload: VehicleRequest,
): Promise<VehicleResponse> {
  const { data } = await api.put<VehicleResponse>(`/vehicles/${id}`, payload)
  return data
}

export async function deleteVehicle(id: string): Promise<void> {
  await api.delete(`/vehicles/${id}`)
}
