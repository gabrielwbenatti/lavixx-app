import { z } from 'zod'
import { USER_ROLES } from '@/types/user'

/** Convite de usuário: nome, e-mail e papel. */
export const inviteUserSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome').max(150, 'Máximo de 150 caracteres'),
  email: z
    .string()
    .trim()
    .min(1, 'Informe o e-mail')
    .email('E-mail inválido')
    .max(150, 'Máximo de 150 caracteres'),
  role: z.enum(USER_ROLES, { message: 'Selecione um papel' }),
})

export type InviteUserForm = z.infer<typeof inviteUserSchema>

/** Definição de senha no aceite do convite (com confirmação). */
export const acceptInviteSchema = z
  .object({
    password: z
      .string()
      .min(8, 'A senha deve ter ao menos 8 caracteres')
      .max(100, 'Máximo de 100 caracteres'),
    confirm: z.string().min(1, 'Confirme a senha'),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'As senhas não conferem',
    path: ['confirm'],
  })

export type AcceptInviteForm = z.infer<typeof acceptInviteSchema>
