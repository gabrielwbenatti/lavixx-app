import type { VehicleSummary } from '@/types/vehicle'
import { formatPlate } from '@/lib/format'

/** Rótulo curto para um veículo (apelido > fabricante+modelo > placa > identificador). */
export function describeVehicle(v: VehicleSummary): string {
  if (v.nickname) return v.nickname
  const parts = [v.manufacturer, v.model].filter(Boolean).join(' ')
  if (parts) return parts
  if (v.plate) return formatPlate(v.plate)
  return v.identifier || 'Veículo'
}
