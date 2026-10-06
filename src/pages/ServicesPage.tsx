import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Wrench } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Field } from '@/components/ui/Field'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { getApiErrorMessage } from '@/lib/api'
import { formatCurrency } from '@/lib/format'
import {
  serviceSchema,
  type ServiceFormInput,
  type ServiceFormOutput,
} from '@/lib/schemas/serviceSchema'
import {
  createService,
  deleteService,
  listServices,
  updateService,
} from '@/services/serviceService'
import type { ServiceResponse } from '@/types/service'
import {
  VEHICLE_SIZES,
  VEHICLE_SIZE_EXAMPLES,
  VEHICLE_SIZE_LABELS,
  type VehicleSize,
} from '@/types/vehicle'

/** Campo do formulário de cada porte. */
const SIZE_FIELD = {
  small: 'priceSmall',
  medium: 'priceMedium',
  large: 'priceLarge',
} as const satisfies Record<VehicleSize, 'priceSmall' | 'priceMedium' | 'priceLarge'>

function sizePrice(service: ServiceResponse, size: VehicleSize): number | null {
  return service[SIZE_FIELD[size]]
}

export function ServicesPage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ServiceResponse | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    data: services,
    isLoading,
    isError,
    error,
  } = useQuery({ queryKey: ['services'], queryFn: listServices })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ServiceFormInput, unknown, ServiceFormOutput>({
    resolver: zodResolver(serviceSchema),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['services'] })

  const saveMutation = useMutation({
    mutationFn: (form: ServiceFormOutput) =>
      editing ? updateService(editing.id, form) : createService(form),
    onSuccess: () => {
      invalidate()
      closeDialog()
    },
    onError: (err) => setFormError(getApiErrorMessage(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteService(id),
    onSuccess: invalidate,
  })

  const openCreate = () => {
    setEditing(null)
    setFormError(null)
    reset({ name: '', price: '', priceSmall: '', priceMedium: '', priceLarge: '' })
    setDialogOpen(true)
  }

  const openEdit = (service: ServiceResponse) => {
    setEditing(service)
    setFormError(null)
    reset({
      name: service.name,
      price: String(service.price),
      priceSmall: service.priceSmall != null ? String(service.priceSmall) : '',
      priceMedium: service.priceMedium != null ? String(service.priceMedium) : '',
      priceLarge: service.priceLarge != null ? String(service.priceLarge) : '',
    })
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditing(null)
  }

  const handleDelete = (service: ServiceResponse) => {
    if (window.confirm(`Excluir o serviço "${service.name}"?`)) {
      deleteMutation.mutate(service.id)
    }
  }

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
            <Wrench size={20} strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Serviços</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Catálogo de serviços oferecidos e seus preços.
            </p>
          </div>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus size={16} />
          Novo serviço
        </Button>
      </header>

      {isLoading && <p className="text-sm text-slate-500">Carregando…</p>}
      {isError && (
        <p className="text-sm text-red-500">{getApiErrorMessage(error)}</p>
      )}

      {services && services.length === 0 && (
        <Card className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
          Nenhum serviço cadastrado ainda. Clique em “Novo serviço”.
        </Card>
      )}

      {services && services.length > 0 && (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-3 font-medium">Serviço</th>
                <th className="px-4 py-3 font-medium">Preço</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr
                  key={service.id}
                  className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                >
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">
                    {service.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {formatCurrency(service.price)}
                    {(service.priceSmall != null ||
                      service.priceMedium != null ||
                      service.priceLarge != null) && (
                      <div className="mt-0.5 text-xs text-slate-400">
                        {VEHICLE_SIZES.map((s) => [s, sizePrice(service, s)] as const)
                          .filter(([, p]) => p != null)
                          .map(([s, p]) => `${VEHICLE_SIZE_LABELS[s]} ${formatCurrency(p as number)}`)
                          .join(' · ')}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" className="h-9 px-3" onClick={() => openEdit(service)}>
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        className="h-9 px-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={() => handleDelete(service)}
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
        title={editing ? 'Editar serviço' : 'Novo serviço'}
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
          <Field label="Nome do serviço" htmlFor="name" error={errors.name?.message}>
            <Input id="name" placeholder="Ex.: Lavagem completa" invalid={!!errors.name} {...register('name')} />
          </Field>
          <Field
            label="Preço padrão (R$)"
            htmlFor="price"
            error={errors.price?.message}
            hint="Vale para veículos sem porte informado ou sem preço específico abaixo."
          >
            <Input
              id="price"
              inputMode="decimal"
              placeholder="0,00"
              invalid={!!errors.price}
              {...register('price')}
            />
          </Field>

          <fieldset className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
            <legend className="px-1 text-sm font-medium text-slate-700 dark:text-slate-200">
              Preço por porte do veículo (opcional)
            </legend>
            <p className="mb-3 text-xs text-slate-400">
              Deixe em branco para usar o preço padrão naquele porte.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {VEHICLE_SIZES.map((s) => {
                const name = SIZE_FIELD[s]
                return (
                  <Field
                    key={s}
                    label={VEHICLE_SIZE_LABELS[s]}
                    htmlFor={name}
                    error={errors[name]?.message}
                    hint={VEHICLE_SIZE_EXAMPLES[s]}
                  >
                    <Input
                      id={name}
                      inputMode="decimal"
                      placeholder="0,00"
                      invalid={!!errors[name]}
                      {...register(name)}
                    />
                  </Field>
                )
              })}
            </div>
          </fieldset>
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
