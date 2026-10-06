import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { HardHat, Plus } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Field } from '@/components/ui/Field'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { getApiErrorMessage } from '@/lib/api'
import { employeeSchema, type EmployeeForm } from '@/lib/schemas/employeeSchema'
import {
  createEmployee,
  deleteEmployee,
  listEmployees,
  updateEmployee,
} from '@/services/employeeService'
import type { EmployeeResponse } from '@/types/employee'

export function EmployeesPage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<EmployeeResponse | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    data: employees,
    isLoading,
    isError,
    error,
  } = useQuery({ queryKey: ['employees'], queryFn: listEmployees })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeForm>({ resolver: zodResolver(employeeSchema) })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['employees'] })

  const saveMutation = useMutation({
    mutationFn: (form: EmployeeForm) =>
      editing
        ? updateEmployee(editing.id, { name: form.name })
        : createEmployee({ name: form.name }),
    onSuccess: () => {
      invalidate()
      closeDialog()
    },
    onError: (err) => setFormError(getApiErrorMessage(err)),
  })

  const toggleMutation = useMutation({
    mutationFn: (e: EmployeeResponse) => updateEmployee(e.id, { name: e.name, active: !e.active }),
    onSuccess: invalidate,
    onError: (err) => window.alert(getApiErrorMessage(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEmployee(id),
    onSuccess: invalidate,
    onError: (err) => window.alert(getApiErrorMessage(err)),
  })

  const openCreate = () => {
    setEditing(null)
    setFormError(null)
    reset({ name: '' })
    setDialogOpen(true)
  }

  const openEdit = (e: EmployeeResponse) => {
    setEditing(e)
    setFormError(null)
    reset({ name: e.name })
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditing(null)
  }

  const handleDelete = (e: EmployeeResponse) => {
    if (window.confirm(`Excluir o funcionário "${e.name}"?`)) {
      deleteMutation.mutate(e.id)
    }
  }

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
            <HardHat size={20} strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Funcionários</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Quem executa os serviços. Desative quem saiu para manter o histórico.
            </p>
          </div>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus size={16} />
          Novo funcionário
        </Button>
      </header>

      {isLoading && <p className="text-sm text-slate-500">Carregando…</p>}
      {isError && <p className="text-sm text-red-500">{getApiErrorMessage(error)}</p>}

      {employees && employees.length === 0 && (
        <p className="text-sm text-slate-500">Nenhum funcionário cadastrado ainda.</p>
      )}

      {employees && employees.length > 0 && (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Situação</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                >
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">
                    {e.name}
                  </td>
                  <td className="px-4 py-3">
                    {e.active ? (
                      <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-950 dark:text-green-300">
                        Ativo
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800">
                        Inativo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        className="h-9 px-3"
                        disabled={toggleMutation.isPending}
                        onClick={() => toggleMutation.mutate(e)}
                      >
                        {e.active ? 'Desativar' : 'Ativar'}
                      </Button>
                      <Button variant="ghost" className="h-9 px-3" onClick={() => openEdit(e)}>
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        className="h-9 px-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={() => handleDelete(e)}
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
        title={editing ? 'Editar funcionário' : 'Novo funcionário'}
      >
        {formError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {formError}
          </div>
        )}
        <form
          autoComplete="off"
          onSubmit={handleSubmit((form) => {
            setFormError(null)
            saveMutation.mutate(form)
          })}
          className="flex flex-col gap-4"
          noValidate
        >
          <Field label="Nome" htmlFor="name" error={errors.name?.message}>
            <Input id="name" placeholder="Ex.: João Silva" invalid={!!errors.name} {...register('name')} />
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
