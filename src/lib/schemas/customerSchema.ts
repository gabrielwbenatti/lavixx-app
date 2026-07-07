import { z } from 'zod'
import { normalizeDocument, isValidDocument } from '@/lib/document'

/** Só dígitos. */
const onlyDigits = (v: string) => v.replace(/\D/g, '')

/** Cliente: nome obrigatório; documento e telefone opcionais. */
export const customerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Informe o nome do cliente')
    .max(150, 'Máximo de 150 caracteres'),
  document: z
    .string()
    .transform(normalizeDocument)
    .refine((v) => v === '' || isValidDocument(v), {
      message: 'Documento deve ser um CPF (11 dígitos) ou CNPJ (14 caracteres), ou ficar vazio',
    }),
  phone: z
    .string()
    .transform(onlyDigits)
    .refine((v) => v === '' || v.length === 10 || v.length === 11, {
      message: 'Telefone deve ter 10 ou 11 dígitos (com DDD), ou ficar vazio',
    }),
})

export type CustomerForm = z.infer<typeof customerSchema>
