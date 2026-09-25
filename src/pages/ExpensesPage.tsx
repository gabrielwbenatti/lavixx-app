import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Receipt } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Field } from '@/components/ui/Field'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { getApiErrorMessage } from '@/lib/api'
import { formatCurrency } from '@/lib/format'
import { formatDateBR, toDateInput } from '@/lib/datetime'
import {
  expenseSchema,
  type ExpenseFormInput,
  type ExpenseFormOutput,
} from '@/lib/schemas/expenseSchema'
import {
  createExpense,
  deleteExpense,
  listExpenses,
  updateExpense,
} from '@/services/expenseService'
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS, type ExpenseResponse } from '@/types/expense'

/** Período padrão: mês corrente. */
function monthRange() {
  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth(), 1)
  return { from: toDateInput(start), to: toDateInput(today) }
}

export function ExpensesPage() {
  const queryClient = useQueryClient()
  const initial = monthRange()
  const [from, setFrom] = useState(initial.from)
  const [to, setTo] = useState(initial.to)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ExpenseResponse | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const invalidRange = from > to

  const {
    data: expenses,
    isLoading,
    isError,
    error,
    isFetching,
  } = useQuery({
    queryKey: ['expenses', from, to],
    queryFn: () => listExpenses(from, to),
    enabled: !invalidRange,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormInput, unknown, ExpenseFormOutput>({
    resolver: zodResolver(expenseSchema),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['expenses'] })

  const saveMutation = useMutation({
    mutationFn: (form: ExpenseFormOutput) =>
      editing ? updateExpense(editing.id, form) : createExpense(form),
    onSuccess: () => {
      invalidate()
      closeDialog()
    },
    onError: (err) => setFormError(getApiErrorMessage(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    onSuccess: invalidate,
  })

  const total = useMemo(
    () => (expenses ?? []).reduce((sum, e) => sum + e.amount, 0),
    [expenses],
  )

  const openCreate = () => {
    setEditing(null)
    setFormError(null)
    reset({ category: 'cleaning_supplies', amount: '', date: toDateInput(new Date()), description: '' })
    setDialogOpen(true)
  }

  const openEdit = (expense: ExpenseResponse) => {
    setEditing(expense)
    setFormError(null)
    reset({
      category: expense.category,
      amount: String(expense.amount),
      date: expense.date,
      description: expense.description ?? '',
    })
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditing(null)
  }

  const handleDelete = (expense: ExpenseResponse) => {
    if (window.confirm(`Excluir esta despesa de ${formatCurrency(expense.amount)}?`)) {
      deleteMutation.mutate(expense.id)
    }
  }

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
            <Receipt size={20} strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Despesas</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Gastos do estabelecimento — entram no cálculo do lucro.
            </p>
          </div>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus size={16} />
          Nova despesa
        </Button>
      </header>

      {/* Filtro de período + total */}
      <Card className="mb-6 p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor="from" className="mb-1 block text-xs font-medium text-slate-500">
              De
            </label>
            <Input
              id="from"
              type="date"
              value={from}
              max={to}
              onChange={(e) => setFrom(e.target.value)}
              className="w-44"
            />
          </div>
          <div>
            <label htmlFor="to" className="mb-1 block text-xs font-medium text-slate-500">
              Até
            </label>
            <Input
              id="to"
              type="date"
              value={to}
              min={from}
              onChange={(e) => setTo(e.target.value)}
              className="w-44"
            />
          </div>
          <div className="ml-auto text-right">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Total no período
            </div>
            <div className="mt-1 text-xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(total)}
            </div>
          </div>
        </div>
        {invalidRange && (
          <p className="mt-2 text-xs text-red-500">A data inicial não pode ser maior que a final.</p>
        )}
      </Card>

      {isLoading && <p className="text-sm text-slate-500">Carregando…</p>}
      {isError && <p className="text-sm text-red-500">{getApiErrorMessage(error)}</p>}

      {expenses && expenses.length === 0 && (
        <Card className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
          Nenhuma despesa no período. Clique em “Nova despesa”.
        </Card>
      )}

      {expenses && expenses.length > 0 && (
        <Card className={`overflow-hidden ${isFetching ? 'opacity-60 transition-opacity' : ''}`}>
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Descrição</th>
                <th className="px-4 py-3 text-right font-medium">Valor</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr
                  key={expense.id}
                  className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                    {formatDateBR(expense.date)}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">
                    {EXPENSE_CATEGORY_LABELS[expense.category]}
                    {expense.description && (
                      <div className="mt-0.5 text-xs font-normal text-slate-400 sm:hidden">
                        {expense.description}
                      </div>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 text-slate-600 dark:text-slate-300 sm:table-cell">
                    {expense.description ?? '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-slate-800 dark:text-slate-100">
                    {formatCurrency(expense.amount)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" className="h-9 px-3" onClick={() => openEdit(expense)}>
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        className="h-9 px-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={() => handleDelete(expense)}
                      >
                        Excluir
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        title={editing ? 'Editar despesa' : 'Nova despesa'}
      >
        {formError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {formError}
          </div>
        )}
        <form
          onSubmit={handleSubmit((form) => {
            setFormError(null)
            saveMutation.mutate(form)
          })}
          className="flex flex-col gap-4"
          noValidate
        >
          <Field label="Categoria" htmlFor="category" error={errors.category?.message}>
            <Select id="category" invalid={!!errors.category} {...register('category')}>
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {EXPENSE_CATEGORY_LABELS[cat]}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Valor (R$)" htmlFor="amount" error={errors.amount?.message}>
              <Input
                id="amount"
                inputMode="decimal"
                placeholder="0,00"
                invalid={!!errors.amount}
                {...register('amount')}
              />
            </Field>
            <Field label="Data" htmlFor="date" error={errors.date?.message}>
              <Input id="date" type="date" invalid={!!errors.date} {...register('date')} />
            </Field>
          </div>
          <Field label="Descrição (opcional)" htmlFor="description" error={errors.description?.message}>
            <Input
              id="description"
              placeholder="Ex.: Shampoo automotivo 5L"
              invalid={!!errors.description}
              {...register('description')}
            />
          </Field>
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || saveMutation.isPending}>
              {saveMutation.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
