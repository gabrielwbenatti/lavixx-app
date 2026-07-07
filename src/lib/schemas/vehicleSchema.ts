import { z } from 'zod'
import { VEHICLE_TYPES } from '@/types/vehicle'

/** Campo de texto opcional com tamanho máximo; string vazia é permitida. */
const optionalText = (max: number) =>
  z.string().trim().max(max, `Máximo de ${max} caracteres`).optional()

/**
 * Veículo: cliente + tipo obrigatórios; demais campos opcionais.
 * `year` é digitado como texto e convertido (1900..2100, ou vazio).
 */
export const vehicleSchema = z.object({
  customerId: z.string().min(1, 'Selecione o cliente'),
  type: z.enum(VEHICLE_TYPES, { message: 'Selecione o tipo' }),
  plate: optionalText(10),
  identifier: optionalText(60),
  nickname: optionalText(80),
  manufacturer: optionalText(60),
  model: optionalText(60),
  color: optionalText(30),
  year: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^\d{4}$/.test(v), { message: 'Ano deve ter 4 dígitos' })
    .refine((v) => !v || (Number(v) >= 1900 && Number(v) <= 2100), {
      message: 'Ano fora do intervalo (1900–2100)',
    }),
})

export type VehicleForm = z.infer<typeof vehicleSchema>
