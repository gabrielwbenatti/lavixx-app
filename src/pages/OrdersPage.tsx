import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { ClipboardList, Plus } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card } from '@/components/ui/Card'
import { LinkRow } from '@/components/ui/LinkRow'
import { Pagination } from '@/components/ui/Pagination'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { PaymentBadge } from '@/components/ui/PaymentBadge'
import { NewOrderDialog } from '@/components/NewOrderDialog'
import { getApiErrorMessage } from '@/lib/api'
import { formatCurrency } from '@/lib/format'
import { describeVehicle } from '@/lib/describe'
import { useOrderFilters, type OrderFilters } from '@/lib/useOrderFilters'
import { usePageParam } from '@/lib/usePageParam'
import { listServiceOrders } from '@/services/serviceOrderService'
import {
  SERVICE_STATUSES,
  SERVICE_STATUS_LABELS,
  type ServiceStatus,
} from '@/types/serviceOrder'

export function OrdersPage() {
  const navigate = useNavigate()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  const { filters, setFilter: setFilterValue, clearFilters: clearFilterValues } = useOrderFilters()
  const [page, setPage] = usePageParam()

  // Mudar filtro volta para a primeira página.
  const setFilter = <K extends keyof OrderFilters>(key: K, value: OrderFilters[K]) => {
    setFilterValue(key, value)
    setPage(0)
  }
  const clearFilters = () => {
    clearFilterValues()
    setPage(0)
  }

  const ordersQuery = useQuery({
    queryKey: ['service-orders', filters, page],
    queryFn: () =>
      listServiceOrders({
        page,
        status: filters.status,
        fromDate: filters.fromDate && `${filters.fromDate}T00:00:00Z`,
        toDate: filters.toDate && `${filters.toDate}T23:59:59Z`,
        minAmount: filters.minAmount,
        maxAmount: filters.maxAmount,
      }),
    placeholderData: keepPreviousData,
  })


  const openCreate = () => setDialogOpen(true)

  const orders = ordersQuery.data?.content

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
          <Button onClick={openCreate} className="gap-2">
            <Plus size={16} />
            Nova ordem
          </Button>
        </div>
      </header>

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
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <LinkRow key={order.id} to={`/ordens/${order.id}`}>
                  <td className="px-4 py-3">
                    <Link
                      to={`/ordens/${order.id}`}
                      className="font-medium text-slate-800 hover:text-indigo-600 hover:underline dark:text-slate-100"
                    >
                      {order.customer.name}
                    </Link>
                    <div className="text-xs text-slate-400">
                      {describeVehicle(order.vehicle)}
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
                </LinkRow>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {ordersQuery.data && (
        <Pagination page={ordersQuery.data} onChange={setPage} label="ordens" />
      )}

      <NewOrderDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={(order) => {
          setDialogOpen(false)
          navigate(`/ordens/${order.id}`)
        }}
      />
    </div>
  )
}
