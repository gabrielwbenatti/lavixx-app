/** Espelha os DTOs de despesa da API. */

export const EXPENSE_CATEGORIES = [
  'cleaning_supplies',
  'water',
  'electricity',
  'rent',
  'salaries',
  'maintenance',
  'taxes',
  'other',
] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

/** Rótulos em português para exibição. */
export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  cleaning_supplies: 'Produtos de limpeza',
  water: 'Água',
  electricity: 'Luz',
  rent: 'Aluguel',
  salaries: 'Salários',
  maintenance: 'Manutenção/Equipamentos',
  taxes: 'Impostos/Taxas',
  other: 'Outros',
}

export interface ExpenseRequest {
  category: ExpenseCategory
  amount: number
  date: string // yyyy-MM-dd
  description?: string
}

export interface ExpenseResponse {
  id: string
  category: ExpenseCategory
  amount: number
  date: string // yyyy-MM-dd
  description: string | null
  createdAt: string
  updatedAt: string
}
