import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ClipboardList, Plus } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Field } from '@/components/ui/Field'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { PaymentBadge } from '@/components/ui/PaymentBadge'
import { VehicleSearch } from '@/components/VehicleSearch'
import { getApiErrorMessage } from '@/lib/api'
import { formatCurrency } from '@/lib/format'
import { describeVehicle } from '@/lib/describe'
import { useOrderFilters } from '@/lib/useOrderFilters'
import { createOrderSchema, type CreateOrderForm } from '@/lib/schemas/serviceOrderSchemas'
import { createServiceOrder, listServiceOrders } from '@/services/serviceOrderService'
import { listVehicles } from '@/services/vehicleService'
import { listCustomers } from '@/services/customerService'
import {
  SERVICE_STATUSES,
  SERVICE_STATUS_LABELS,
  type ServiceStatus,
} from '@/types/serviceOrder'

export function OrdersPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formKey, setFormKey] = useState(0)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  const { filters, setFilter, clearFilters } = useOrderFilters()

  const ordersQuery = useQuery({
    queryKey: ['service-orders', JSON.stringify(filters)],
    queryFn: () => {
      const queryParams = {
        ...(filters.status && { status: filters.status }),
        ...(filters.fromDate && { fromDate: `${filters.fromDate}T00:00:00Z` }),
        ...(filters.toDate && { toDate: `${filters.toDate}T23:59:59Z` }),
        ...(filters.minAmount && { minAmount: filters.minAmount }),
        ...(filters.maxAmount && { maxAmount: filters.maxAmount }),
      }
      return listServiceOrders(Object.keys(queryParams).length > 0 ? queryParams : undefined)
    },
  })
  const vehiclesQuery = useQuery({ queryKey: ['vehicles'], queryFn: listVehicles })
  const customersQuery = useQuery({ queryKey: ['customers'], queryFn: listCustomers })

  const customerNameById = useMemo(() => {
    const map = new Map<string, string>()
    customersQuery.data?.forEach((c) => map.set(c.id, c.name))
    return map
  }, [customersQuery.data])

  const vehicleLabelById = useMemo(() => {
    const map = new Map<string, string>()
    vehiclesQuery.data?.forEach((v) => map.set(v.id, describeVehicle(v)))
    return map
  }, [vehiclesQuery.data])

  const {
    handleSubmit,
    reset,
    register,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateOrderForm>({ resolver: zodResolver(createOrderSchema) })

  const isScheduled = watch('scheduled')

  const createMutation = useMutation({
    mutationFn: (form: CreateOrderForm) =>
      createServiceOrder({
        vehicleId: form.vehicleId,
        ...(form.scheduled && form.scheduledAt
          ? { scheduledAt: new Date(form.scheduledAt).toISOString() }
          : {}),
      }),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['service-orders'] })
      setDialogOpen(false)
      navigate(`/ordens/${order.id}`)
    },
    onError: (err) => setFormError(getApiErrorMessage(err)),
  })

  const hasVehicles = (vehiclesQuery.data?.length ?? 0) > 0

  const openCreate = () => {
    setFormError(null)
    reset({ vehicleId: '', scheduled: false, scheduledAt: '' })
    setFormKey((k) => k + 1)
    setDialogOpen(true)
  }

  const orders = ordersQuery.data

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
            <ClipboardList size={20} strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Ordens de serviço</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Acompanhe e gerencie as ordens do seu estabelecimento.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to="/atendimento" className="hidden sm:block">
            <Button variant="outline">Atendimento rápido</Button>
          </Link>
          <Button onClick={openCreate} disabled={!hasVehicles} className="gap-2">
            <Plus size={16} />
            Nova ordem
          </Button>
        </div>
      </header>

      {!hasVehicles && !vehiclesQuery.isLoading && (
        <Card className="mb-4 border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          Cadastre um veículo antes de abrir ordens de serviço.
        </Card>
      )}

      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="statusFilter" className="text-sm text-slate-500">
            Filtrar por status:
          </label>
          <Select
            id="statusFilter"
            className="h-9 w-48"
            value={filters.status || ''}
            onChange={(e) => setFilter('status', (e.target.value || undefined) as ServiceStatus | undefined)}
          >
            <option value="">Todas</option>
            {SERVICE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {SERVICE_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
          <Button
            variant="outline"
            className="h-9 text-xs"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            {showAdvancedFilters ? 'Ocultar' : 'Filtros avançados'}
          </Button>
          {Object.values(filters).some((v) => v) && (
            <Button
              variant="ghost"
              className="h-9 text-xs"
              onClick={clearFilters}
            >
              Limpar
            </Button>
          )}
        </div>

        {showAdvancedFilters && (
          <Card className="p-4">
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
              <div>
                <label htmlFor="fromDate" className="mb-1 block text-xs text-slate-600 dark:text-slate-400">
                  De
                </label>
                <Input
                  id="fromDate"
                  type="date"
                  value={filters.fromDate || ''}
                  onChange={(e) => setFilter('fromDate', e.target.value || undefined)}
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <label htmlFor="toDate" className="mb-1 block text-xs text-slate-600 dark:text-slate-400">
                  Até
                </label>
                <Input
                  id="toDate"
                  type="date"
                  value={filters.toDate || ''}
                  onChange={(e) => setFilter('toDate', e.target.value || undefined)}
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <label htmlFor="minAmount" className="mb-1 block text-xs text-slate-600 dark:text-slate-400">
                  Valor mínimo (R$)
                </label>
                <Input
                  id="minAmount"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={filters.minAmount || ''}
                  onChange={(e) => setFilter('minAmount', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <label htmlFor="maxAmount" className="mb-1 block text-xs text-slate-600 dark:text-slate-400">
                  Valor máximo (R$)
                </label>
                <Input
                  id="maxAmount"
                  inputMode="decimal"
                  placeholder="999999.99"
                  value={filters.maxAmount || ''}
                  onChange={(e) => setFilter('maxAmount', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="h-9 text-sm"
                />
              </div>
            </div>
          </Card>
        )}
      </div>

      {ordersQuery.isLoading && <p className="text-sm text-slate-500">Carregando…</p>}
      {ordersQuery.isError && (
        <p className="text-sm text-red-500">{getApiErrorMessage(ordersQuery.error)}</p>
      )}

      {orders && orders.length === 0 && (
        <Card className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
          Nenhuma ordem encontrada.
        </Card>
      )}

      {orders && orders.length > 0 && (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-3 font-medium">Cliente / Veículo</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Pagamento</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Itens</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Aberta em</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800 dark:text-slate-100">
                      {customerNameById.get(order.customerId) ?? 'Cliente'}
                    </div>
                    <div className="text-xs text-slate-400">
                      {vehicleLabelById.get(order.vehicleId) ?? '—'}
                    </div>
                    <div className="mt-1 sm:hidden">
                      <PaymentBadge status={order.paymentStatus} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <PaymentBadge status={order.paymentStatus} />
                  </td>
                  <td className="hidden px-4 py-3 text-slate-600 dark:text-slate-300 md:table-cell">
                    {order.items.length}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">
                    {formatCurrency(order.total)}
                  </td>
                  <td className="hidden px-4 py-3 text-slate-500 md:table-cell">
                    {new Date(order.issuedAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/ordens/${order.id}`}>
                      <Button variant="ghost" className="h-9 px-3">
                        Abrir
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Nova ordem de serviço"
        description="Busque o veículo pela placa (ou apelido/cliente). O cliente é vinculado automaticamente."
      >
        {formError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {formError}
          </div>
        )}
        <form
          onSubmit={handleSubmit((form) => {
            setFormError(null)
            createMutation.mutate(form)
          })}
          className="flex flex-col gap-4"
          noValidate
        >
          <Field label="Buscar veículo" htmlFor="vehicleSearch" error={errors.vehicleId?.message}>
            <VehicleSearch
              key={formKey}
              vehicles={vehiclesQuery.data ?? []}
              customerNameById={customerNameById}
              invalid={!!errors.vehicleId}
              autoFocus
              onSelect={(vehicleId) =>
                setValue('vehicleId', vehicleId, { shouldValidate: true })
              }
            />
          </Field>

          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input type="checkbox" className="h-4 w-4 rounded" {...register('scheduled')} />
            Agendar para depois (cliente ainda não chegou)
          </label>

          {isScheduled && (
            <Field
              label="Data e hora do agendamento"
              htmlFor="scheduledAt"
              error={errors.scheduledAt?.message}
            >
              <Input
                id="scheduledAt"
                type="datetime-local"
                invalid={!!errors.scheduledAt}
                {...register('scheduledAt')}
              />
            </Field>
          )}

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending
                ? 'Salvando…'
                : isScheduled
                  ? 'Agendar'
                  : 'Criar e adicionar itens'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
