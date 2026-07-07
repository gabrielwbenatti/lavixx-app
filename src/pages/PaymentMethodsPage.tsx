import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Field } from '@/components/ui/Field'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { getApiErrorMessage } from '@/lib/api'
import { paymentMethodSchema, type PaymentMethodForm } from '@/lib/schemas/paymentMethodSchema'
import {
  createPaymentMethod,
  deletePaymentMethod,
  listPaymentMethods,
  updatePaymentMethod,
} from '@/services/paymentMethodService'
import type { PaymentMethodResponse } from '@/types/paymentMethod'

export function PaymentMethodsPage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<PaymentMethodResponse | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    data: methods,
    isLoading,
    isError,
    error,
  } = useQuery({ queryKey: ['payment-methods'], queryFn: listPaymentMethods })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PaymentMethodForm>({ resolver: zodResolver(paymentMethodSchema) })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['payment-methods'] })

  const saveMutation = useMutation({
    mutationFn: (form: PaymentMethodForm) =>
      editing
        ? updatePaymentMethod(editing.id, { name: form.name })
        : createPaymentMethod({ name: form.name }),
    onSuccess: () => {
      invalidate()
      closeDialog()
    },
    onError: (err) => setFormError(getApiErrorMessage(err)),
  })

  const toggleMutation = useMutation({
    mutationFn: (m: PaymentMethodResponse) =>
      updatePaymentMethod(m.id, { name: m.name, active: !m.active }),
    onSuccess: invalidate,
    onError: (err) => window.alert(getApiErrorMessage(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePaymentMethod(id),
    onSuccess: invalidate,
    onError: (err) => window.alert(getApiErrorMessage(err)),
  })

  const openCreate = () => {
    setEditing(null)
    setFormError(null)
    reset({ name: '' })
    setDialogOpen(true)
  }

  const openEdit = (m: PaymentMethodResponse) => {
    setEditing(m)
    setFormError(null)
    reset({ name: m.name })
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditing(null)
  }

  const handleDelete = (m: PaymentMethodResponse) => {
    if (window.confirm(`Excluir a forma "${m.name}"?`)) {
      deleteMutation.mutate(m.id)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Formas de pagamento</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Formas aceitas no seu estabelecimento. Desative as que não usa.
          </p>
        </div>
        <Button onClick={openCreate}>Nova forma</Button>
      </header>

      {isLoading && <p className="text-sm text-slate-500">Carregando…</p>}
      {isError && <p className="text-sm text-red-500">{getApiErrorMessage(error)}</p>}

      {methods && methods.length > 0 && (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-3 font-medium">Forma</th>
                <th className="px-4 py-3 font-medium">Situação</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {methods.map((m) => (
                <tr
                  key={m.id}
                  className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                >
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">
                    {m.name}
                  </td>
                  <td className="px-4 py-3">
                    {m.active ? (
                      <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-950 dark:text-green-300">
                        Ativa
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800">
                        Inativa
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        className="h-9 px-3"
                        disabled={toggleMutation.isPending}
                        onClick={() => toggleMutation.mutate(m)}
                      >
                        {m.active ? 'Desativar' : 'Ativar'}
                      </Button>
                      <Button variant="ghost" className="h-9 px-3" onClick={() => openEdit(m)}>
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        className="h-9 px-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={() => handleDelete(m)}
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
        title={editing ? 'Editar forma de pagamento' : 'Nova forma de pagamento'}
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
          <Field label="Nome" htmlFor="name" error={errors.name?.message}>
            <Input id="name" placeholder="Ex.: Vale / Convênio" invalid={!!errors.name} {...register('name')} />
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
