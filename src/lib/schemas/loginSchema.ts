import { z } from 'zod'

/** Login: e-mail e senha obrigatórios. */
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, 'Informe o e-mail').email('E-mail inválido'),
  password: z.string().min(1, 'Informe a senha'),
})

export type LoginForm = z.infer<typeof loginSchema>
