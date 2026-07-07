import { api } from '@/lib/api'
import type { VehicleRequest, VehicleResponse } from '@/types/vehicle'

export async function listVehicles(): Promise<VehicleResponse[]> {
  const { data } = await api.get<VehicleResponse[]>('/vehicles')
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
