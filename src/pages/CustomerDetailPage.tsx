import { Link, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Field } from '@/components/ui/Field'
import { Card } from '@/components/ui/Card'
import { LinkRow } from '@/components/ui/LinkRow'
import { Dialog } from '@/components/ui/Dialog'
import { Pagination } from '@/components/ui/Pagination'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { PaymentBadge } from '@/components/ui/PaymentBadge'
import { getApiErrorMessage } from '@/lib/api'
import { formatCurrency, formatDocument, formatPhone, formatPlate } from '@/lib/format'
import { maskDocument, maskPhone, withMask } from '@/lib/mask'
import { describeVehicle } from '@/lib/describe'
import { useOrderFilters, type OrderFilters } from '@/lib/useOrderFilters'
import { usePageParam } from '@/lib/usePageParam'
import { customerSchema, type CustomerForm } from '@/lib/schemas/customerSchema'
import { getCustomer, getCustomerLoyalty, updateCustomer } from '@/services/customerService'
import { listVehicles } from '@/services/vehicleService'
import { getServiceOrderStats, listServiceOrders } from '@/services/serviceOrderService'
import type { LoyaltyStatus } from '@/types/loyalty'

export function CustomerDetailPage() {
  const { id = '' } = useParams()
  const queryClient = useQueryClient()

  const [editOpen, setEditOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
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

  const customerQuery = useQuery({
    queryKey: ['customer', id],
    queryFn: () => getCustomer(id),
  })
  const loyaltyQuery = useQuery({
    queryKey: ['customer-loyalty', id],
    queryFn: () => getCustomerLoyalty(id),
  })
  const vehiclesQuery = useQuery({
    queryKey: ['vehicles', { customerId: id }],
    queryFn: () => listVehicles({ customerId: id, size: 100 }),
  })
  const period = {
    customerId: id,
    fromDate: filters.fromDate && `${filters.fromDate}T00:00:00Z`,
    toDate: filters.toDate && `${filters.toDate}T23:59:59Z`,
  }
  const ordersQuery = useQuery({
    queryKey: ['service-orders', 'by-customer', id, filters, page],
    queryFn: () => listServiceOrders({ ...period, page }),
    placeholderData: keepPreviousData,
  })
  const statsQuery = useQuery({
    queryKey: ['service-orders', 'stats', 'by-customer', id, filters],
    queryFn: () => getServiceOrderStats(period),
  })

  const customerVehicles = vehiclesQuery.data?.content ?? []

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CustomerForm>({
    resolver: zodResolver(customerSchema),
  })

  const editMutation = useMutation({
    mutationFn: (form: CustomerForm) =>
      updateCustomer(id, {
        name: form.name,
        document: form.document || undefined,
        phone: form.phone || undefined,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['customer', id], updated)
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      setEditOpen(false)
    },
    onError: (err) => setFormError(getApiErrorMessage(err)),
  })

  const openEdit = () => {
    const c = customerQuery.data
    if (!c) return
    setFormError(null)
    reset({ name: c.name, document: maskDocument(c.document ?? ''), phone: maskPhone(c.phone ?? '') })
    setEditOpen(true)
  }

  if (customerQuery.isLoading) {
    return <p className="text-sm text-slate-500">Carregando…</p>
  }
  if (customerQuery.isError || !customerQuery.data) {
    return (
      <div>
        <p className="text-sm text-red-500">{getApiErrorMessage(customerQuery.error)}</p>
        <Link to="/clientes" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">
          ← Voltar para clientes
        </Link>
      </div>
    )
  }

  const customer = customerQuery.data
  const orders = ordersQuery.data?.content ?? []
  const stats = statsQuery.data

  return (
    <div>
      <Link to="/clientes" className="mb-4 inline-block text-sm text-indigo-600 hover:underline">
        ← Voltar para clientes
      </Link>

      {/* Cabeçalho */}
      <Card className="mb-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{customer.name}</h1>
            <div className="mt-1 flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400">
              {customer.phone && <span>{formatPhone(customer.phone)}</span>}
              {customer.document && <span>{formatDocument(customer.document)}</span>}
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

      {/* Cartão-fidelidade */}
      {loyaltyQuery.data?.enabled && (
        <LoyaltyCard loyalty={loyaltyQuery.data} />
      )}

      {/* Veículos */}
      {customerVehicles.length > 0 && (
        <Card className="mb-4 overflow-hidden">
          <h2 className="border-b border-slate-200 px-4 py-3 font-semibold text-slate-800 dark:border-slate-800 dark:text-slate-100">
            Veículos
          </h2>
          <ul>
            {customerVehicles.map((v) => (
              <li
                key={v.id}
                className="border-b border-slate-100 last:border-0 dark:border-slate-800"
              >
                <Link
                  to={`/veiculos/${v.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <span className="font-medium text-slate-800 dark:text-slate-100">
                    {describeVehicle(v)}
                  </span>
                  <span className="text-sm text-slate-400">{formatPlate(v.plate)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

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
                <th className="hidden px-4 py-2 font-medium sm:table-cell">Veículo</th>
                <th className="hidden px-4 py-2 font-medium md:table-cell">Serviços</th>
                <th className="px-4 py-2 font-medium">Total</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="hidden px-4 py-2 font-medium sm:table-cell">Pagamento</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const vehicle = order.vehicle
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
                    <td className="hidden px-4 py-2 text-slate-600 dark:text-slate-300 sm:table-cell">
                      <Link
                        to={`/veiculos/${vehicle.id}`}
                        className="text-indigo-600 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {formatPlate(vehicle.plate) !== '—'
                          ? formatPlate(vehicle.plate)
                          : describeVehicle(vehicle)}
                      </Link>
                    </td>
                    <td className="hidden max-w-[200px] truncate px-4 py-2 text-slate-600 dark:text-slate-300 md:table-cell">
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
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} title="Editar cliente">
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
          <Field label="Nome" htmlFor="name" error={errors.name?.message}>
            <Input id="name" invalid={!!errors.name} {...register('name')} />
          </Field>
          <Field label="Telefone / celular (opcional)" htmlFor="phone" error={errors.phone?.message} hint="Com DDD. Ex.: 11912345678">
            <Input id="phone" inputMode="tel" invalid={!!errors.phone} {...withMask(register('phone'), maskPhone)} />
          </Field>
          <Field label="CPF/CNPJ (opcional)" htmlFor="document" error={errors.document?.message} hint="Somente números (11 ou 14 dígitos).">
            <Input id="document" inputMode="numeric" invalid={!!errors.document} {...withMask(register('document'), maskDocument)} />
          </Field>
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

/* ===================== Cartão-fidelidade ===================== */
function LoyaltyCard({ loyalty }: { loyalty: LoyaltyStatus }) {
  const { target, stampsInCurrentCard, washesUntilNextReward, rewardsAvailable, rewardPercent } =
    loyalty
  const rewardLabel = rewardPercent >= 100 ? 'lavagem grátis' : `${rewardPercent}% de desconto`
  const dots = Array.from({ length: target })

  return (
    <Card className="mb-4 p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-800 dark:text-slate-100">Cartão-fidelidade</h2>
        {rewardsAvailable > 0 && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            🎉 {rewardsAvailable} prêmio{rewardsAvailable > 1 ? 's' : ''} disponível
            {rewardsAvailable > 1 ? 'is' : ''}
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {dots.map((_, i) => (
          <span
            key={i}
            className={
              i < stampsInCurrentCard
                ? 'flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white'
                : 'flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed border-slate-300 text-xs text-slate-400 dark:border-slate-600'
            }
          >
            {i < stampsInCurrentCard ? '✓' : i + 1}
          </span>
        ))}
      </div>

      <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
        {rewardsAvailable > 0
          ? `Prêmio: ${rewardLabel}. Aplique na próxima ordem de serviço.`
          : `Faltam ${washesUntilNextReward} lavagem${washesUntilNextReward > 1 ? 's' : ''} para ${rewardLabel}.`}
      </p>
    </Card>
  )
}
