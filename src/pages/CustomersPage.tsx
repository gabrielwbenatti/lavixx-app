import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { UserPlus, Users } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Field } from '@/components/ui/Field'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { getApiErrorMessage } from '@/lib/api'
import { formatDocument, formatPhone } from '@/lib/format'
import { customerSchema, type CustomerForm } from '@/lib/schemas/customerSchema'
import {
  createCustomer,
  deleteCustomer,
  listCustomers,
  updateCustomer,
} from '@/services/customerService'
import type { CustomerResponse } from '@/types/customer'

export function CustomersPage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<CustomerResponse | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    data: customers,
    isLoading,
    isError,
    error,
  } = useQuery({ queryKey: ['customers'], queryFn: listCustomers })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CustomerForm>({ resolver: zodResolver(customerSchema) })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['customers'] })

  const saveMutation = useMutation({
    mutationFn: (form: CustomerForm) => {
      const payload = {
        name: form.name,
        document: form.document || undefined,
        phone: form.phone || undefined,
      }
      return editing ? updateCustomer(editing.id, payload) : createCustomer(payload)
    },
    onSuccess: () => {
      invalidate()
      closeDialog()
    },
    onError: (err) => setFormError(getApiErrorMessage(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCustomer(id),
    onSuccess: invalidate,
    onError: (err) => window.alert(getApiErrorMessage(err)),
  })

  const openCreate = () => {
    setEditing(null)
    setFormError(null)
    reset({ name: '', document: '', phone: '' })
    setDialogOpen(true)
  }

  const openEdit = (customer: CustomerResponse) => {
    setEditing(customer)
    setFormError(null)
    reset({
      name: customer.name,
      document: customer.document ?? '',
      phone: customer.phone ?? '',
    })
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditing(null)
  }

  const handleDelete = (customer: CustomerResponse) => {
    if (window.confirm(`Excluir o cliente "${customer.name}"?`)) {
      deleteMutation.mutate(customer.id)
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
            <Users size={20} strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Clientes</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Clientes do seu estabelecimento.
            </p>
          </div>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <UserPlus size={16} />
          Novo cliente
        </Button>
      </header>

      {isLoading && <p className="text-sm text-slate-500">Carregando…</p>}
      {isError && <p className="text-sm text-red-500">{getApiErrorMessage(error)}</p>}

      {customers && customers.length === 0 && (
        <Card className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
          Nenhum cliente cadastrado ainda. Clique em “Novo cliente”.
        </Card>
      )}

      {customers && customers.length > 0 && (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Telefone</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">CPF/CNPJ</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr
                  key={customer.id}
                  className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                >
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">
                    <Link
                      to={`/clientes/${customer.id}`}
                      className="hover:text-indigo-600 hover:underline"
                    >
                      {customer.name}
                    </Link>
                    <div className="mt-0.5 text-xs text-slate-400 sm:hidden">
                      {formatPhone(customer.phone)}
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-slate-600 dark:text-slate-300 sm:table-cell">
                    {formatPhone(customer.phone)}
                  </td>
                  <td className="hidden px-4 py-3 text-slate-600 dark:text-slate-300 sm:table-cell">
                    {formatDocument(customer.document)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" className="h-9 px-3" onClick={() => openEdit(customer)}>
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        className="h-9 px-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={() => handleDelete(customer)}
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
        title={editing ? 'Editar cliente' : 'Novo cliente'}
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
            <Input id="name" placeholder="Nome do cliente" invalid={!!errors.name} {...register('name')} />
          </Field>
          <Field
            label="Telefone / celular (opcional)"
            htmlFor="phone"
            error={errors.phone?.message}
            hint="Com DDD. Ex.: 11912345678"
          >
            <Input
              id="phone"
              inputMode="tel"
              placeholder="(11) 91234-5678"
              invalid={!!errors.phone}
              {...register('phone')}
            />
          </Field>
          <Field
            label="CPF/CNPJ (opcional)"
            htmlFor="document"
            error={errors.document?.message}
            hint="Somente números (11 ou 14 dígitos)."
          >
            <Input
              id="document"
              inputMode="numeric"
              placeholder="00000000000"
              invalid={!!errors.document}
              {...register('document')}
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
