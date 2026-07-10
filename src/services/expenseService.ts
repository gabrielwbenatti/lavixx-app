import { api } from '@/lib/api'
import type { ExpenseRequest, ExpenseResponse } from '@/types/expense'

/** GET /expenses — lista despesas; filtra por período se `from`/`to` forem passados (yyyy-MM-dd). */
export async function listExpenses(from?: string, to?: string): Promise<ExpenseResponse[]> {
  const { data } = await api.get<ExpenseResponse[]>('/expenses', {
    params: from && to ? { from, to } : undefined,
  })
  return data
}

export async function createExpense(payload: ExpenseRequest): Promise<ExpenseResponse> {
  const { data } = await api.post<ExpenseResponse>('/expenses', payload)
  return data
}

export async function updateExpense(
  id: string,
  payload: ExpenseRequest,
): Promise<ExpenseResponse> {
  const { data } = await api.put<ExpenseResponse>(`/expenses/${id}`, payload)
  return data
}

export async function deleteExpense(id: string): Promise<void> {
  await api.delete(`/expenses/${id}`)
}
