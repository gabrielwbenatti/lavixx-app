import { z } from 'zod'
import { onlyDigits } from './tenantRegistrationSchema'

/** Cliente: nome obrigatório, documento opcional (vazio ou CPF/CNPJ). */
export const customerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Informe o nome do cliente')
    .max(150, 'Máximo de 150 caracteres'),
  document: z
    .string()
    .transform(onlyDigits)
    .refine((v) => v === '' || v.length === 11 || v.length === 14, {
      message: 'Documento deve ter 11 (CPF) ou 14 (CNPJ) dígitos, ou ficar vazio',
    }),
})

export type CustomerForm = z.infer<typeof customerSchema>
