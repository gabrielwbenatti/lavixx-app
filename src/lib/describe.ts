import type { VehicleResponse } from '@/types/vehicle'

/** Rótulo curto para um veículo (apelido > fabricante+modelo > placa > identificador). */
export function describeVehicle(v: VehicleResponse): string {
  if (v.nickname) return v.nickname
  const parts = [v.manufacturer, v.model].filter(Boolean).join(' ')
  return parts || v.plate || v.identifier || 'Veículo'
}
