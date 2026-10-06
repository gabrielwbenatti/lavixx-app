import { z } from 'zod'

/** Aceita "1234", "1234.5", "1234,56" — até 8 dígitos inteiros e 2 decimais. */
const PRICE_PATTERN = /^\d{1,8}([.,]\d{1,2})?$/

/** Preço por porte: opcional; em branco vira null (= usa o preço padrão). */
const optionalPrice = z
  .string()
  .trim()
  .optional()
  .refine((v) => !v || PRICE_PATTERN.test(v), {
    message: 'Preço inválido (use até 8 inteiros e 2 decimais)',
  })
  .transform((v) => (v ? Number(v.replace(',', '.')) : null))

/**
 * Serviço: nome obrigatório + preço padrão >= 0 (até 8 inteiros / 2 decimais) e, opcionalmente,
 * um preço de tabela para cada porte de veículo. Os preços são digitados como texto (aceita
 * vírgula ou ponto) e convertidos para número.
 */
export const serviceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Informe o nome do serviço')
    .max(150, 'Máximo de 150 caracteres'),
  price: z
    .string()
    .trim()
    .min(1, 'Informe o preço')
    .refine((v) => PRICE_PATTERN.test(v), {
      message: 'Preço inválido (use até 8 inteiros e 2 decimais)',
    })
    .transform((v) => Number(v.replace(',', '.'))),
  priceSmall: optionalPrice,
  priceMedium: optionalPrice,
  priceLarge: optionalPrice,
})

/** Tipos de entrada (form: preços como string) e saída (submit: preços como number). */
export type ServiceFormInput = z.input<typeof serviceSchema>
export type ServiceFormOutput = z.output<typeof serviceSchema>
