import { Link, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Field } from '@/components/ui/Field'
import { Card } from '@/components/ui/Card'
import { LinkRow } from '@/components/ui/LinkRow'
import { Dialog } from '@/components/ui/Dialog'
import { Pagination } from '@/components/ui/Pagination'
import { CustomerPicker, type PickedCustomer } from '@/components/CustomerPicker'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { PaymentBadge } from '@/components/ui/PaymentBadge'
import { getApiErrorMessage } from '@/lib/api'
import { formatCurrency, formatPlate } from '@/lib/format'
import { describeVehicle } from '@/lib/describe'
import { vehicleSchema, type VehicleForm } from '@/lib/schemas/vehicleSchema'
import { getVehicle, updateVehicle } from '@/services/vehicleService'
import { useOrderFilters, type OrderFilters } from '@/lib/useOrderFilters'
import { usePageParam } from '@/lib/usePageParam'
import { getServiceOrderStats, listServiceOrders } from '@/services/serviceOrderService'
import { VEHICLE_TYPES, VEHICLE_TYPE_LABELS, type VehicleRequest } from '@/types/vehicle'

export function VehicleDetailPage() {
  const { id = '' } = useParams()
  const queryClient = useQueryClient()

  const [editOpen, setEditOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [owner, setOwner] = useState<PickedCustomer | null>(null)
  const [formKey, setFormKey] = useState(0)
  const { filters, setFilter: setFilterValue, clearFilters: clearFilterValues } = useOrderFilters()
  const [page, setPage] = usePageParam()

  // Mudar o período volta para a primeira página.
  const setFilter = <K extends keyof OrderFilters>(key: K, value: OrderFilters[K]) => {
    setFilterValue(key, value)
    setPage(0)
  }
  const clearFilters = () => {
    clearFilterValues()
    setPage(0)
  }

  const vehicleQuery = useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => getVehicle(id),
  })
  const period = {
    vehicleId: id,
    fromDate: filters.fromDate && `${filters.fromDate}T00:00:00Z`,
    toDate: filters.toDate && `${filters.toDate}T23:59:59Z`,
  }
  const ordersQuery = useQuery({
    queryKey: ['service-orders', 'by-vehicle', id, filters, page],
    queryFn: () => listServiceOrders({ ...period, page }),
    placeholderData: keepPreviousData,
  })
  const statsQuery = useQuery({
    queryKey: ['service-orders', 'stats', 'by-vehicle', id, filters],
    queryFn: () => getServiceOrderStats(period),
  })

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<VehicleForm>({
    resolver: zodResolver(vehicleSchema),
  })

  const pickOwner = (customer: PickedCustomer | null) => {
    setOwner(customer)
    setValue('customerId', customer?.id ?? '', { shouldValidate: true })
  }

  const editMutation = useMutation({
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
      return updateVehicle(id, payload)
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['vehicle', id], updated)
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      setEditOpen(false)
    },
    onError: (err) => setFormError(getApiErrorMessage(err)),
  })

  const openEdit = () => {
    const v = vehicleQuery.data
    if (!v) return
    setFormError(null)
    setOwner({ id: v.customerId, name: v.customerName })
    setFormKey((k) => k + 1)
    reset({
      customerId: v.customerId,
      type: v.type,
      plate: v.plate ?? '',
      identifier: v.identifier ?? '',
      nickname: v.nickname ?? '',
      manufacturer: v.manufacturer ?? '',
      model: v.model ?? '',
      color: v.color ?? '',
      year: v.year ? String(v.year) : '',
    })
    setEditOpen(true)
  }

  if (vehicleQuery.isLoading) {
    return <p className="text-sm text-slate-500">Carregando…</p>
  }
  if (vehicleQuery.isError || !vehicleQuery.data) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="text-sm text-red-500">{getApiErrorMessage(vehicleQuery.error)}</p>
        <Link to="/veiculos" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">
          ← Voltar para veículos
        </Link>
      </div>
    )
  }

  const vehicle = vehicleQuery.data
  const orders = ordersQuery.data?.content ?? []
  const stats = statsQuery.data

  return (
    <div className="mx-auto max-w-4xl">
      <Link to="/veiculos" className="mb-4 inline-block text-sm text-indigo-600 hover:underline">
        ← Voltar para veículos
      </Link>

      {/* Cabeçalho */}
      <Card className="mb-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {describeVehicle(vehicle)}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
              {vehicle.plate && <span>Placa: {formatPlate(vehicle.plate)}</span>}
              {vehicle.color && <span>{vehicle.color}</span>}
              {vehicle.year && <span>{vehicle.year}</span>}
              <Link
                to={`/clientes/${vehicle.customerId}`}
                className="text-indigo-600 hover:underline"
              >
                {vehicle.customerName}
              </Link>
            </div>
          </div>
          <Button variant="outline" onClick={openEdit}>
            Editar
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4 border-t border-slate-100 pt-4 dark:border-slate-800">
          <div>
            <div className="text-xs text-slate-400">Total de ordens</div>
            <div className="text-lg font-bold text-slate-800 dark:text-slate-100">{stats?.totalOrders ?? '—'}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Concluídas</div>
            <div className="text-lg font-bold text-green-700 dark:text-green-400">{stats?.completedOrders ?? '—'}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Total pago</div>
            <div className="text-lg font-bold text-indigo-700 dark:text-indigo-300">
              {stats ? formatCurrency(stats.paidTotal) : '—'}
            </div>
          </div>
        </div>
      </Card>

      {/* Histórico de ordens */}
      <div className="mb-4 flex items-center gap-2">
        <label htmlFor="fromDate" className="text-xs text-slate-500">
          Período:
        </label>
        <Input
          id="fromDate"
          type="date"
          value={filters.fromDate || ''}
          onChange={(e) => setFilter('fromDate', e.target.value || undefined)}
          className="h-9 w-32 text-xs"
          placeholder="De"
        />
        <span className="text-xs text-slate-400">até</span>
        <Input
          id="toDate"
          type="date"
          value={filters.toDate || ''}
          onChange={(e) => setFilter('toDate', e.target.value || undefined)}
          className="h-9 w-32 text-xs"
          placeholder="Até"
        />
        {(filters.fromDate || filters.toDate) && (
          <Button variant="ghost" className="h-9 text-xs" onClick={clearFilters}>
            Limpar
          </Button>
        )}
      </div>

      <Card className="overflow-hidden">
        <h2 className="border-b border-slate-200 px-4 py-3 font-semibold text-slate-800 dark:border-slate-800 dark:text-slate-100">
          Histórico de ordens
        </h2>

        {ordersQuery.isLoading && (
          <p className="px-4 py-6 text-sm text-slate-500">Carregando…</p>
        )}

        {orders.length === 0 && !ordersQuery.isLoading && (
          <p className="px-4 py-8 text-center text-sm text-slate-400">
            Nenhuma ordem de serviço encontrada.
          </p>
        )}

        {orders.length > 0 && (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-2 font-medium">Data</th>
                <th className="hidden px-4 py-2 font-medium md:table-cell">Serviços</th>
                <th className="px-4 py-2 font-medium">Total</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="hidden px-4 py-2 font-medium sm:table-cell">Pagamento</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const serviceNames = order.items.map((i) => i.name).join(', ')
                return (
                  <LinkRow key={order.id} to={`/ordens/${order.id}`}>
                    <td className="px-4 py-2 text-slate-600 dark:text-slate-300">
                      <Link to={`/ordens/${order.id}`} className="hover:text-indigo-600 hover:underline">
                        {new Date(order.issuedAt).toLocaleDateString('pt-BR')}
                      </Link>
                      <div className="mt-0.5 sm:hidden">
                        <PaymentBadge status={order.paymentStatus} />
                      </div>
                    </td>
                    <td className="hidden max-w-[220px] truncate px-4 py-2 text-slate-600 dark:text-slate-300 md:table-cell">
                      {serviceNames || '—'}
                    </td>
                    <td className="px-4 py-2 font-medium text-slate-800 dark:text-slate-100">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="px-4 py-2">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="hidden px-4 py-2 sm:table-cell">
                      <PaymentBadge status={order.paymentStatus} />
                    </td>
                  </LinkRow>
                )
              })}
            </tbody>
          </table>
        )}
      </Card>

      {ordersQuery.data && (
        <Pagination page={ordersQuery.data} onChange={setPage} label="ordens" />
      )}

      {/* Dialog de edição */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} title="Editar veículo">
        {formError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {formError}
          </div>
        )}
        <form
          onSubmit={handleSubmit((form) => {
            setFormError(null)
            editMutation.mutate(form)
          })}
          className="flex flex-col gap-4"
          noValidate
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Cliente" htmlFor="customerId" error={errors.customerId?.message}>
              <CustomerPicker
                key={formKey}
                id="customerId"
                value={owner}
                onChange={pickOwner}
                invalid={!!errors.customerId}
              />
            </Field>
            <Field label="Tipo" htmlFor="type" error={errors.type?.message}>
              <Select id="type" invalid={!!errors.type} {...register('type')}>
                {VEHICLE_TYPES.map((t) => (
                  <option key={t} value={t}>{VEHICLE_TYPE_LABELS[t]}</option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Apelido" htmlFor="nickname" error={errors.nickname?.message}>
              <Input id="nickname" {...register('nickname')} />
            </Field>
            <Field label="Placa" htmlFor="plate" error={errors.plate?.message}>
              <Input id="plate" className="uppercase" {...register('plate')} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Fabricante" htmlFor="manufacturer" error={errors.manufacturer?.message}>
              <Input id="manufacturer" {...register('manufacturer')} />
            </Field>
            <Field label="Modelo" htmlFor="model" error={errors.model?.message}>
              <Input id="model" {...register('model')} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Cor" htmlFor="color" error={errors.color?.message}>
              <Input id="color" {...register('color')} />
            </Field>
            <Field label="Ano" htmlFor="year" error={errors.year?.message}>
              <Input id="year" inputMode="numeric" {...register('year')} />
            </Field>
            <Field label="Identificador" htmlFor="identifier" error={errors.identifier?.message}>
              <Input id="identifier" {...register('identifier')} />
            </Field>
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={editMutation.isPending}>
              {editMutation.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
