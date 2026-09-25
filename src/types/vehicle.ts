/** Espelha os DTOs de veículo da API. */

export const VEHICLE_TYPES = ['car', 'motorcycle', 'boat', 'bicycle', 'other'] as const
export type VehicleType = (typeof VEHICLE_TYPES)[number]

/** Rótulos em português para exibição. */
export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  car: 'Carro',
  motorcycle: 'Moto',
  boat: 'Barco',
  bicycle: 'Bicicleta',
  other: 'Outro',
}

export interface VehicleRequest {
  customerId: string
  type: VehicleType
  plate?: string
  identifier?: string
  nickname?: string
  manufacturer?: string
  model?: string
  color?: string
  year?: number
}

/** Dados do veículo embutidos em outras respostas (ex.: ordem de serviço). */
export interface VehicleSummary {
  id: string
  type: VehicleType
  plate: string | null
  identifier: string | null
  nickname: string | null
  manufacturer: string | null
  model: string | null
  color: string | null
  year: number | null
}

export interface VehicleResponse extends VehicleSummary {
  customerId: string
  customerName: string
  createdAt: string
  updatedAt: string
}
