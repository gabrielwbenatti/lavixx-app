import { z } from 'zod'
import { EXPENSE_CATEGORIES } from '@/types/expense'

/**
 * Despesa: categoria (lista fixa) + valor > 0 (até 8 inteiros / 2 decimais) +
 * data + descrição opcional. Valor é digitado como texto (vírgula ou ponto).
 */
export const expenseSchema = z.object({
  category: z.enum(EXPENSE_CATEGORIES, { message: 'Selecione uma categoria' }),
  amount: z
    .string()
    .trim()
    .min(1, 'Informe o valor')
    .refine((v) => /^\d{1,8}([.,]\d{1,2})?$/.test(v), {
      message: 'Valor inválido (use até 8 inteiros e 2 decimais)',
    })
    .refine((v) => Number(v.replace(',', '.')) > 0, { message: 'Valor deve ser maior que zero' })
    .transform((v) => Number(v.replace(',', '.'))),
  date: z.string().trim().min(1, 'Informe a data'),
  description: z
    .string()
    .trim()
    .max(255, 'Máximo de 255 caracteres')
    .optional()
    .transform((v) => (v ? v : undefined)),
})

export type ExpenseFormInput = z.input<typeof expenseSchema>
export type ExpenseFormOutput = z.output<typeof expenseSchema>
