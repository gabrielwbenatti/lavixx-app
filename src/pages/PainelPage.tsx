import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PaymentBadge } from '@/components/ui/PaymentBadge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { getApiErrorMessage } from '@/lib/api'
import { formatCurrency, formatPlate } from '@/lib/format'
import { describeVehicle } from '@/lib/describe'
import { formatTime, timeAgo, toDateInput } from '@/lib/datetime'
import { buildCarReadyWhatsAppLink } from '@/lib/whatsapp'
import {
  listPickupEstimates,
  listScheduledServiceOrders,
  listServiceOrders,
  updateServiceOrderStatus,
} from '@/services/serviceOrderService'
import { getCurrentTenant } from '@/services/tenantService'
import type { ServiceOrderResponse, ServiceStatus } from '@/types/serviceOrder'
import type { VehicleSummary } from '@/types/vehicle'

/** Ação principal (próximo passo) de cada status, mostrada no cartão. */
const NEXT_ACTION: Partial<Record<ServiceStatus, { label: string; target: ServiceStatus }>> = {
  waiting: { label: 'Iniciar', target: 'in_progress' },
  in_progress: { label: 'Concluir', target: 'done' },
}

/** Limite de ordens por coluna do quadro (máximo aceito pela API). */
const BOARD_SIZE = 100
/** O quadro se atualiza sozinho a cada 20s. */
const REFRESH_MS = 20000

/** Início e fim do dia local, em ISO, para filtrar por data de conclusão. */
function todayRange() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  end.setMilliseconds(-1)
  return { finishedFrom: start.toISOString(), finishedTo: end.toISOString() }
}

const byCreatedAt = (a: ServiceOrderResponse, b: ServiceOrderResponse) =>
  a.createdAt.localeCompare(b.createdAt)

export function PainelPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const today = toDateInput(new Date())

  const waitingQuery = useQuery({
    queryKey: ['service-orders', 'board', 'waiting'],
    queryFn: () => listServiceOrders({ status: 'waiting', size: BOARD_SIZE }),
    refetchInterval: REFRESH_MS,
  })
  const inProgressQuery = useQuery({
    queryKey: ['service-orders', 'board', 'in_progress'],
    queryFn: () => listServiceOrders({ status: 'in_progress', size: BOARD_SIZE }),
    refetchInterval: REFRESH_MS,
  })
  const doneTodayQuery = useQuery({
    queryKey: ['service-orders', 'board', 'done', today],
    queryFn: () => listServiceOrders({ status: 'done', size: BOARD_SIZE, ...todayRange() }),
    refetchInterval: REFRESH_MS,
  })
  const boardError = waitingQuery.error ?? inProgressQuery.error ?? doneTodayQuery.error
  const scheduledTodayQuery = useQuery({
    queryKey: ['service-orders-schedule', today],
    queryFn: () => listScheduledServiceOrders(today, today),
    refetchInterval: REFRESH_MS,
  })
  const pickupTodayQuery = useQuery({
    queryKey: ['service-orders-pickup', today],
    queryFn: () => listPickupEstimates(today, today),
    refetchInterval: REFRESH_MS,
  })
  const tenantQuery = useQuery({ queryKey: ['tenant-me'], queryFn: getCurrentTenant })

  // Fila e andamento: mais antigas primeiro. Concluídas: mais recentes primeiro.
  const waiting = [...(waitingQuery.data?.content ?? [])].sort(byCreatedAt)
  const inProgress = [...(inProgressQuery.data?.content ?? [])].sort(byCreatedAt)
  const doneToday = [...(doneTodayQuery.data?.content ?? [])].sort((a, b) =>
    (b.finishedAt ?? '').localeCompare(a.finishedAt ?? ''),
  )
  const waitingCount = waitingQuery.data?.totalElements ?? 0
  const inProgressCount = inProgressQuery.data?.totalElements ?? 0
  const doneTodayCount = doneTodayQuery.data?.totalElements ?? 0

  const revenueToday = doneToday.reduce((sum, o) => sum + o.total, 0)
  const receivableToday = doneToday.reduce(
    (sum, o) => sum + Math.max(o.total - o.paidTotal, 0),
    0,
  )

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ServiceStatus }) =>
      updateServiceOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-orders'] })
      queryClient.invalidateQueries({ queryKey: ['service-orders-schedule'] })
    },
    onError: (err) => window.alert(getApiErrorMessage(err)),
  })

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Painel do dia</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Acompanhe a operação em tempo real. Atualiza automaticamente.
        </p>
      </header>

      {/* Indicadores do dia */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <StatTile label="Na fila" value={String(waitingCount)} tone="amber" />
        <StatTile label="Em andamento" value={String(inProgressCount)} tone="blue" />
        <StatTile label="Concluídas hoje" value={String(doneTodayCount)} tone="green" />
        <StatTile label="Faturamento hoje" value={formatCurrency(revenueToday)} tone="indigo" />
        <StatTile label="A receber hoje" value={formatCurrency(receivableToday)} tone="red" />
      </div>

      {boardError && (
        <p className="mb-4 text-sm text-red-500">{getApiErrorMessage(boardError)}</p>
      )}

      {/* Destaques do dia: agendados que ainda não chegaram e retiradas previstas */}
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-2 text-sm font-semibold text-violet-700 dark:text-violet-300">
            Agendados para hoje
          </h2>
          {(scheduledTodayQuery.data ?? []).length === 0 ? (
            <EmptyHint text="Nenhum agendamento para hoje." />
          ) : (
            <ul className="flex flex-col gap-2">
              {scheduledTodayQuery.data!.map((o) => {
                return (
                  <li
                    key={o.id}
                    className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/50"
                  >
                    <button
                      type="button"
                      className="text-left"
                      onClick={() => navigate(`/ordens/${o.id}`)}
                    >
                      <span className="font-medium text-slate-800 dark:text-slate-100">
                        {o.scheduledAt ? formatTime(o.scheduledAt) : '—'}
                      </span>{' '}
                      <span className="text-slate-500 dark:text-slate-400">
                        {o.customer.name} · {describeVehicle(o.vehicle)}
                      </span>
                    </button>
                    <Button
                      className="h-8 px-2 text-xs"
                      disabled={statusMutation.isPending}
                      onClick={() => statusMutation.mutate({ id: o.id, status: 'waiting' })}
                    >
                      Chegou
                    </Button>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <Card className="p-4">
          <h2 className="mb-2 text-sm font-semibold text-blue-700 dark:text-blue-300">
            Retiradas previstas para hoje
          </h2>
          {(pickupTodayQuery.data ?? []).length === 0 ? (
            <EmptyHint text="Nenhuma retirada prevista para hoje." />
          ) : (
            <ul className="flex flex-col gap-2">
              {pickupTodayQuery.data!.map((o) => {
                return (
                  <li key={o.id}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-left text-sm hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800"
                      onClick={() => navigate(`/ordens/${o.id}`)}
                    >
                      <span>
                        <span className="font-medium text-slate-800 dark:text-slate-100">
                          {o.estimatedPickupAt ? formatTime(o.estimatedPickupAt) : '—'}
                        </span>{' '}
                        <span className="text-slate-500 dark:text-slate-400">
                          {o.customer.name} · {describeVehicle(o.vehicle)}
                        </span>
                      </span>
                      <StatusBadge status={o.status} />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </div>

      {/* Quadro */}
      <div className="grid gap-4 md:grid-cols-3">
        <Column title="Aguardando" count={waitingCount} tone="amber">
          {waiting.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              vehicle={o.vehicle}
              customerName={o.customer.name}
              onOpen={() => navigate(`/ordens/${o.id}`)}
              onAction={(status) => statusMutation.mutate({ id: o.id, status })}
              actionPending={statusMutation.isPending}
            />
          ))}
          {waiting.length === 0 && <EmptyHint text="Sem ordens na fila." />}
        </Column>

        <Column title="Em andamento" count={inProgressCount} tone="blue">
          {inProgress.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              vehicle={o.vehicle}
              customerName={o.customer.name}
              onOpen={() => navigate(`/ordens/${o.id}`)}
              onAction={(status) => statusMutation.mutate({ id: o.id, status })}
              actionPending={statusMutation.isPending}
            />
          ))}
          {inProgress.length === 0 && <EmptyHint text="Nada em andamento." />}
        </Column>

        <Column title="Concluídas hoje" count={doneTodayCount} tone="green">
          {doneToday.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              vehicle={o.vehicle}
              customerName={o.customer.name}
              onOpen={() => navigate(`/ordens/${o.id}`)}
              whatsappLink={buildCarReadyWhatsAppLink({
                phone: o.customer.phone,
                customerName: o.customer.name,
                vehicle: o.vehicle,
                establishmentName: tenantQuery.data?.name,
                items: o.items,
              })}
            />
          ))}
          {doneToday.length === 0 && <EmptyHint text="Nenhuma concluída hoje ainda." />}
        </Column>
      </div>
    </div>
  )
}

/* ---------------------------------- Peças ---------------------------------- */

const toneStyles = {
  amber: 'text-amber-700 dark:text-amber-300',
  blue: 'text-blue-700 dark:text-blue-300',
  green: 'text-green-700 dark:text-green-300',
  indigo: 'text-indigo-700 dark:text-indigo-300',
  red: 'text-red-600 dark:text-red-400',
} as const
type Tone = keyof typeof toneStyles

function StatTile({ label, value, tone }: { label: string; value: string; tone: Tone }) {
  return (
    <Card className="p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${toneStyles[tone]}`}>{value}</div>
    </Card>
  )
}

function Column({
  title,
  count,
  tone,
  children,
}: {
  title: string
  count: number
  tone: Tone
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl bg-slate-100/60 p-3 dark:bg-slate-900/40">
      <div className="mb-3 flex items-center justify-between px-1">
        <span className={`text-sm font-semibold ${toneStyles[tone]}`}>{title}</span>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800">
          {count}
        </span>
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  )
}

function EmptyHint({ text }: { text: string }) {
  return <p className="px-1 py-6 text-center text-xs text-slate-400">{text}</p>
}

function OrderCard({
  order,
  vehicle,
  customerName,
  onOpen,
  onAction,
  actionPending,
  whatsappLink,
}: {
  order: ServiceOrderResponse
  vehicle?: VehicleSummary
  customerName?: string
  onOpen: () => void
  onAction?: (status: ServiceStatus) => void
  actionPending?: boolean
  whatsappLink?: string | null
}) {
  const next = NEXT_ACTION[order.status]
  return (
    <Card className="p-3">
      <button type="button" onClick={onOpen} className="block w-full text-left">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-900 dark:text-white">
            {vehicle?.plate ? formatPlate(vehicle.plate) : (vehicle ? describeVehicle(vehicle) : 'Veículo')}
          </span>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {formatCurrency(order.total)}
          </span>
        </div>
        <div className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
          {customerName ?? 'Cliente'}
          {vehicle ? ` · ${describeVehicle(vehicle)}` : ''}
        </div>
        <div className="mt-1 text-[11px] text-slate-400">
          {order.status === 'done' && order.finishedAt
            ? `Concluída ${formatTime(order.finishedAt)}`
            : `Aberta ${formatTime(order.createdAt)} · ${timeAgo(order.createdAt)}`}
          {' · '}
          {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
        </div>
        {(order.status === 'done' || order.paymentStatus !== 'pending') && (
          <div className="mt-1.5">
            <PaymentBadge status={order.paymentStatus} />
          </div>
        )}
      </button>

      {next && onAction && (
        <Button
          className="mt-2 h-8 w-full px-3 text-xs"
          disabled={actionPending}
          onClick={() => onAction(next.target)}
        >
          {next.label}
        </Button>
      )}

      {whatsappLink && (
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
        >
          <WhatsAppIcon className="h-3.5 w-3.5" />
          Avisar cliente
        </a>
      )}
    </Card>
  )
}
