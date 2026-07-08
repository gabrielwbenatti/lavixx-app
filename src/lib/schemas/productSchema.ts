import { z } from 'zod'

/**
 * Produto: nome obrigatório + preço >= 0 (até 8 inteiros / 2 decimais).
 * O preço é digitado como texto (aceita vírgula ou ponto) e convertido para número.
 */
export const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Informe o nome do produto')
    .max(150, 'Máximo de 150 caracteres'),
  price: z
    .string()
    .trim()
    .min(1, 'Informe o preço')
    .refine((v) => /^\d{1,8}([.,]\d{1,2})?$/.test(v), {
      message: 'Preço inválido (use até 8 inteiros e 2 decimais)',
    })
    .transform((v) => Number(v.replace(',', '.'))),
})

export type ProductFormInput = z.input<typeof productSchema>
export type ProductFormOutput = z.output<typeof productSchema>
