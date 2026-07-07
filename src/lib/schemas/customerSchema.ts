import { z } from 'zod'
import { normalizeDocument, isValidDocument } from '@/lib/document'

/** Cliente: nome obrigatório, documento opcional (vazio ou CPF/CNPJ). */
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
})

export type CustomerForm = z.infer<typeof customerSchema>
