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

/** Porte do veículo: define o preço de tabela dos serviços (opcional). */
export const VEHICLE_SIZES = ['small', 'medium', 'large'] as const
export type VehicleSize = (typeof VEHICLE_SIZES)[number]

export const VEHICLE_SIZE_LABELS: Record<VehicleSize, string> = {
  small: 'Pequeno',
  medium: 'Médio',
  large: 'Grande',
}

/** Exemplos de veículos de cada porte. */
export const VEHICLE_SIZE_EXAMPLES: Record<VehicleSize, string> = {
  small: 'hatch, moto',
  medium: 'sedan',
  large: 'SUV, picape',
}

/** Rótulos com exemplos, para os seletores. */
export const VEHICLE_SIZE_OPTION_LABELS: Record<VehicleSize, string> = {
  small: `${VEHICLE_SIZE_LABELS.small} (${VEHICLE_SIZE_EXAMPLES.small})`,
  medium: `${VEHICLE_SIZE_LABELS.medium} (${VEHICLE_SIZE_EXAMPLES.medium})`,
  large: `${VEHICLE_SIZE_LABELS.large} (${VEHICLE_SIZE_EXAMPLES.large})`,
}

export interface VehicleRequest {
  customerId: string
  type: VehicleType
  /** Omitido = sem porte (usa o preço padrão dos serviços). */
  size?: VehicleSize
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
  size: VehicleSize | null
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
