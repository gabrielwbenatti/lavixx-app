import { z } from 'zod'
import { normalizeDocument, isValidDocument } from '@/lib/document'

/**
 * Validacao do formulario de cadastro de tenant.
 * Espelha as regras da API (TenantRegistrationRequest) + confirmacao de senha (so no front).
 */
export const tenantRegistrationSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Informe o nome do estabelecimento')
      .max(150, 'Maximo de 150 caracteres'),
    document: z
      .string()
      .transform(normalizeDocument)
      .refine(isValidDocument, {
        message: 'Informe um CPF (11 dígitos) ou CNPJ (14 caracteres) válido',
      }),
    adminName: z
      .string()
      .trim()
      .min(1, 'Informe o nome do administrador')
      .max(150, 'Maximo de 150 caracteres'),
    adminEmail: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, 'Informe o e-mail')
      .email('E-mail invalido')
      .max(150, 'Maximo de 150 caracteres'),
    adminPassword: z
      .string()
      .min(8, 'A senha deve ter no minimo 8 caracteres')
      .max(100, 'Maximo de 100 caracteres'),
    confirmPassword: z.string().min(1, 'Confirme a senha'),
  })
  .refine((data) => data.adminPassword === data.confirmPassword, {
    message: 'As senhas nao conferem',
    path: ['confirmPassword'],
  })

export type TenantRegistrationForm = z.infer<typeof tenantRegistrationSchema>
