import { z } from 'zod'

/**
 * Serviço: nome obrigatório + preço >= 0 (até 8 inteiros / 2 decimais).
 * O preço é digitado como texto (aceita vírgula ou ponto) e convertido para número.
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
    // Aceita "1234", "1234.5", "1234,56" — até 8 dígitos inteiros e 2 decimais.
    .refine((v) => /^\d{1,8}([.,]\d{1,2})?$/.test(v), {
      message: 'Preço inválido (use até 8 inteiros e 2 decimais)',
    })
    .transform((v) => Number(v.replace(',', '.'))),
})

/** Tipos de entrada (form: price como string) e saída (submit: price como number). */
export type ServiceFormInput = z.input<typeof serviceSchema>
export type ServiceFormOutput = z.output<typeof serviceSchema>
