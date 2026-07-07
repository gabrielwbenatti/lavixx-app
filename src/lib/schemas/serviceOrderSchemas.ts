import { z } from 'zod'

/** Criação de OS: apenas o veículo (itens são adicionados na tela de detalhe). */
export const createOrderSchema = z.object({
  vehicleId: z.string().min(1, 'Selecione o veículo'),
})
export type CreateOrderForm = z.infer<typeof createOrderSchema>

/**
 * Adição/edição de item da OS.
 * quantidade e desconto (por unidade) são digitados como texto e convertidos.
 */
export const orderItemSchema = z.object({
  serviceId: z.string().min(1, 'Selecione o serviço'),
  quantity: z
    .string()
    .trim()
    .min(1, 'Informe a quantidade')
    .refine((v) => /^\d{1,3}$/.test(v) && Number(v) >= 1, {
      message: 'Quantidade deve ser um número inteiro >= 1',
    })
    .transform(Number),
  discount: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^\d{1,8}([.,]\d{1,2})?$/.test(v), {
      message: 'Desconto inválido (use até 2 decimais)',
    })
    .transform((v) => (v ? Number(v.replace(',', '.')) : 0)),
})
export type OrderItemFormInput = z.input<typeof orderItemSchema>
export type OrderItemFormOutput = z.output<typeof orderItemSchema>

/** Edição de item existente: apenas quantidade e desconto (o serviço não muda). */
export const editItemSchema = orderItemSchema.omit({ serviceId: true })
export type EditItemFormInput = z.input<typeof editItemSchema>
export type EditItemFormOutput = z.output<typeof editItemSchema>
