import { z } from 'zod'

/** Forma de pagamento: nome obrigatório. */
export const paymentMethodSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Informe o nome da forma de pagamento')
    .max(80, 'Máximo de 80 caracteres'),
})

export type PaymentMethodForm = z.infer<typeof paymentMethodSchema>
