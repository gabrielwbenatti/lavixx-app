import { z } from 'zod'

/** Funcionário: nome obrigatório. */
export const employeeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Informe o nome do funcionário')
    .max(150, 'Máximo de 150 caracteres'),
})

export type EmployeeForm = z.infer<typeof employeeSchema>
