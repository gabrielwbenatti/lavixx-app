import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Field } from '@/components/ui/Field'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { VehicleSearch } from '@/components/VehicleSearch'
import { getApiErrorMessage } from '@/lib/api'
import { formatCurrency } from '@/lib/format'
import { describeVehicle } from '@/lib/describe'
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
  const [statusFilter, setStatusFilter] = useState<ServiceStatus | ''>('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formKey, setFormKey] = useState(0)

  const ordersQuery = useQuery({
    queryKey: ['service-orders', statusFilter || 'all'],
    queryFn: () => listServiceOrders(statusFilter || undefined),
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
    setValue,
    formState: { errors },
  } = useForm<CreateOrderForm>({ resolver: zodResolver(createOrderSchema) })

  const createMutation = useMutation({
    mutationFn: (form: CreateOrderForm) => createServiceOrder({ vehicleId: form.vehicleId }),
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
    reset({ vehicleId: '' })
    setFormKey((k) => k + 1)
    setDialogOpen(true)
  }

  const orders = ordersQuery.data

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Ordens de serviço</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Acompanhe e gerencie as ordens do seu estabelecimento.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/atendimento">
            <Button variant="outline">Atendimento rápido</Button>
          </Link>
          <Button onClick={openCreate} disabled={!hasVehicles}>
            Nova ordem
          </Button>
        </div>
      </header>

      {!hasVehicles && !vehiclesQuery.isLoading && (
        <Card className="mb-4 border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          Cadastre um veículo antes de abrir ordens de serviço.
        </Card>
      )}

      <div className="mb-4 flex items-center gap-2">
        <label htmlFor="statusFilter" className="text-sm text-slate-500">
          Filtrar por status:
        </label>
        <Select
          id="statusFilter"
          className="h-9 w-48"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ServiceStatus | '')}
        >
          <option value="">Todas</option>
          {SERVICE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {SERVICE_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
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
                <th className="px-4 py-3 font-medium">Itens</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Aberta em</th>
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
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {order.items.length}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">
                    {formatCurrency(order.total)}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(order.createdAt).toLocaleDateString('pt-BR')}
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
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Criando…' : 'Criar e adicionar itens'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
