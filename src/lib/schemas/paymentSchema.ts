import { z } from 'zod'

/** Registro de pagamento: forma obrigatória + valor > 0 (texto → número). */
export const paymentSchema = z.object({
  paymentMethodId: z.string().min(1, 'Selecione a forma de pagamento'),
  amount: z
    .string()
    .trim()
    .min(1, 'Informe o valor')
    .refine((v) => /^\d{1,8}([.,]\d{1,2})?$/.test(v), {
      message: 'Valor inválido (use até 8 inteiros e 2 decimais)',
    })
    .transform((v) => Number(v.replace(',', '.')))
    .refine((n) => n > 0, { message: 'Valor deve ser maior que zero' }),
})

export type PaymentFormInput = z.input<typeof paymentSchema>
export type PaymentFormOutput = z.output<typeof paymentSchema>
