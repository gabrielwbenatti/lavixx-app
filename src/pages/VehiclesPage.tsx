import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Field } from '@/components/ui/Field'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { getApiErrorMessage } from '@/lib/api'
import { vehicleSchema, type VehicleForm } from '@/lib/schemas/vehicleSchema'
import {
  createVehicle,
  deleteVehicle,
  listVehicles,
  updateVehicle,
} from '@/services/vehicleService'
import { listCustomers } from '@/services/customerService'
import {
  VEHICLE_TYPES,
  VEHICLE_TYPE_LABELS,
  type VehicleRequest,
  type VehicleResponse,
} from '@/types/vehicle'
import { describeVehicle } from '@/lib/describe'

export function VehiclesPage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<VehicleResponse | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const vehiclesQuery = useQuery({ queryKey: ['vehicles'], queryFn: listVehicles })
  const customersQuery = useQuery({ queryKey: ['customers'], queryFn: listCustomers })

  const customerNameById = useMemo(() => {
    const map = new Map<string, string>()
    customersQuery.data?.forEach((c) => map.set(c.id, c.name))
    return map
  }, [customersQuery.data])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VehicleForm>({ resolver: zodResolver(vehicleSchema) })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['vehicles'] })

  const saveMutation = useMutation({
    mutationFn: (form: VehicleForm) => {
      const payload: VehicleRequest = {
        customerId: form.customerId,
        type: form.type,
        plate: form.plate || undefined,
        identifier: form.identifier || undefined,
        nickname: form.nickname || undefined,
        manufacturer: form.manufacturer || undefined,
        model: form.model || undefined,
        color: form.color || undefined,
        year: form.year ? Number(form.year) : undefined,
      }
      return editing ? updateVehicle(editing.id, payload) : createVehicle(payload)
    },
    onSuccess: () => {
      invalidate()
      closeDialog()
    },
    onError: (err) => setFormError(getApiErrorMessage(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteVehicle(id),
    onSuccess: invalidate,
    onError: (err) => window.alert(getApiErrorMessage(err)),
  })

  const hasCustomers = (customersQuery.data?.length ?? 0) > 0

  const openCreate = () => {
    setEditing(null)
    setFormError(null)
    reset({
      customerId: '',
      type: 'car',
      plate: '',
      identifier: '',
      nickname: '',
      manufacturer: '',
      model: '',
      color: '',
      year: '',
    })
    setDialogOpen(true)
  }

  const openEdit = (vehicle: VehicleResponse) => {
    setEditing(vehicle)
    setFormError(null)
    reset({
      customerId: vehicle.customerId,
      type: vehicle.type,
      plate: vehicle.plate ?? '',
      identifier: vehicle.identifier ?? '',
      nickname: vehicle.nickname ?? '',
      manufacturer: vehicle.manufacturer ?? '',
      model: vehicle.model ?? '',
      color: vehicle.color ?? '',
      year: vehicle.year ? String(vehicle.year) : '',
    })
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditing(null)
  }

  const handleDelete = (vehicle: VehicleResponse) => {
    if (window.confirm(`Excluir o veículo "${describeVehicle(vehicle)}"?`)) {
      deleteMutation.mutate(vehicle.id)
    }
  }

  const vehicles = vehiclesQuery.data

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Veículos</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Veículos vinculados aos clientes.
          </p>
        </div>
        <Button onClick={openCreate} disabled={!hasCustomers}>
          Novo veículo
        </Button>
      </header>

      {!hasCustomers && !customersQuery.isLoading && (
        <Card className="mb-4 border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          Cadastre um cliente antes de adicionar veículos.
        </Card>
      )}

      {vehiclesQuery.isLoading && <p className="text-sm text-slate-500">Carregando…</p>}
      {vehiclesQuery.isError && (
        <p className="text-sm text-red-500">{getApiErrorMessage(vehiclesQuery.error)}</p>
      )}

      {vehicles && vehicles.length === 0 && (
        <Card className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
          Nenhum veículo cadastrado ainda.
        </Card>
      )}

      {vehicles && vehicles.length > 0 && (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-3 font-medium">Veículo</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Placa</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle) => (
                <tr
                  key={vehicle.id}
                  className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                >
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">
                    {describeVehicle(vehicle)}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {VEHICLE_TYPE_LABELS[vehicle.type]}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {vehicle.plate || '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {customerNameById.get(vehicle.customerId) ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" className="h-9 px-3" onClick={() => openEdit(vehicle)}>
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        className="h-9 px-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={() => handleDelete(vehicle)}
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
        title={editing ? 'Editar veículo' : 'Novo veículo'}
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
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Cliente" htmlFor="customerId" error={errors.customerId?.message}>
              <Select id="customerId" invalid={!!errors.customerId} {...register('customerId')}>
                <option value="">Selecione…</option>
                {customersQuery.data?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Tipo" htmlFor="type" error={errors.type?.message}>
              <Select id="type" invalid={!!errors.type} {...register('type')}>
                {VEHICLE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {VEHICLE_TYPE_LABELS[t]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Apelido" htmlFor="nickname" error={errors.nickname?.message}>
              <Input id="nickname" placeholder="Ex.: Gol do João" {...register('nickname')} />
            </Field>
            <Field label="Placa" htmlFor="plate" error={errors.plate?.message}>
              <Input id="plate" placeholder="ABC1D23" {...register('plate')} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Fabricante" htmlFor="manufacturer" error={errors.manufacturer?.message}>
              <Input id="manufacturer" placeholder="Ex.: Volkswagen" {...register('manufacturer')} />
            </Field>
            <Field label="Modelo" htmlFor="model" error={errors.model?.message}>
              <Input id="model" placeholder="Ex.: Gol" {...register('model')} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Cor" htmlFor="color" error={errors.color?.message}>
              <Input id="color" placeholder="Ex.: Prata" {...register('color')} />
            </Field>
            <Field label="Ano" htmlFor="year" error={errors.year?.message}>
              <Input id="year" inputMode="numeric" placeholder="2020" {...register('year')} />
            </Field>
            <Field label="Identificador" htmlFor="identifier" error={errors.identifier?.message}>
              <Input id="identifier" placeholder="Chassi/nº" {...register('identifier')} />
            </Field>
          </div>

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
