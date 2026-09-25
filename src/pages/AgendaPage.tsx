import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarClock, Pencil } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { LinkRow } from '@/components/ui/LinkRow'
import { Dialog } from '@/components/ui/Dialog'
import { Field } from '@/components/ui/Field'
import { getApiErrorMessage } from '@/lib/api'
import { describeVehicle } from '@/lib/describe'
import { toDateInput, formatTime, toDateTimeLocalInput } from '@/lib/datetime'
import {
  listScheduledServiceOrders,
  updateServiceOrderScheduledAt,
  updateServiceOrderStatus,
} from '@/services/serviceOrderService'
import type { ServiceOrderResponse } from '@/types/serviceOrder'

/** Presets de período rápidos (sempre olhando pra frente, é uma agenda de compromissos futuros). */
function presets() {
  const today = new Date()
  const in7Days = new Date()
  in7Days.setDate(today.getDate() + 6)
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  return {
    today: { from: toDateInput(today), to: toDateInput(today) },
    week: { from: toDateInput(today), to: toDateInput(in7Days) },
    month: { from: toDateInput(today), to: toDateInput(endOfMonth) },
  }
}

/** Cabeçalho de grupo por dia: "Segunda-feira, 13/07". */
function formatDayHeading(iso: string): string {
  const d = new Date(iso)
  const weekday = d.toLocaleDateString('pt-BR', { weekday: 'long' })
  const date = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${date}`
}

export function AgendaPage() {
  const queryClient = useQueryClient()
  const p = presets()
  const [from, setFrom] = useState(p.today.from)
  const [to, setTo] = useState(p.week.to)
  const [editingOrder, setEditingOrder] = useState<ServiceOrderResponse | null>(null)
  const [rescheduleValue, setRescheduleValue] = useState('')
  const [rescheduleError, setRescheduleError] = useState<string | null>(null)

  const invalidRange = from > to

  const scheduleQuery = useQuery({
    queryKey: ['service-orders-schedule', from, to],
    queryFn: () => listScheduledServiceOrders(from, to),
    enabled: !invalidRange,
  })

  const checkInMutation = useMutation({
    mutationFn: (id: string) => updateServiceOrderStatus(id, 'waiting'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-orders-schedule'] })
      queryClient.invalidateQueries({ queryKey: ['service-orders'] })
    },
    onError: (err) => window.alert(getApiErrorMessage(err)),
  })

  const rescheduleMutation = useMutation({
    mutationFn: ({ id, scheduledAt }: { id: string; scheduledAt: string }) =>
      updateServiceOrderScheduledAt(id, scheduledAt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-orders-schedule'] })
      queryClient.invalidateQueries({ queryKey: ['service-orders'] })
      setEditingOrder(null)
    },
    onError: (err) => setRescheduleError(getApiErrorMessage(err)),
  })

  const applyPreset = (preset: { from: string; to: string }) => {
    setFrom(preset.from)
    setTo(preset.to)
  }

  const openReschedule = (order: ServiceOrderResponse) => {
    setRescheduleError(null)
    setRescheduleValue(order.scheduledAt ? toDateTimeLocalInput(order.scheduledAt) : '')
    setEditingOrder(order)
  }

  const submitReschedule = () => {
    if (!rescheduleValue) {
      setRescheduleError('Informe data e hora')
      return
    }
    setRescheduleError(null)
    rescheduleMutation.mutate({
      id: editingOrder!.id,
      scheduledAt: new Date(rescheduleValue).toISOString(),
    })
  }

  const orders = scheduleQuery.data ?? []

  // Agrupa por dia (yyyy-MM-dd local) pra ficar legível quando o período abrange vários dias.
  const groups = useMemo(() => {
    const map = new Map<string, ServiceOrderResponse[]>()
    for (const order of orders) {
      if (!order.scheduledAt) continue
      const key = toDateInput(new Date(order.scheduledAt))
      const list = map.get(key) ?? []
      list.push(order)
      map.set(key, list)
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [orders])

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400">
            <CalendarClock size={20} strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Agenda</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Ordens agendadas que ainda não chegaram. Assim que o cliente chega ou a OS é cancelada,
              ela sai desta lista.
            </p>
          </div>
        </div>
        <Link to="/ordens">
          <Button variant="outline">Ir para Ordens de serviço</Button>
        </Link>
      </header>

      {/* Filtro de período */}
      <Card className="mb-6 p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor="agendaFrom" className="mb-1 block text-xs font-medium text-slate-500">
              De
            </label>
            <Input
              id="agendaFrom"
              type="date"
              value={from}
              max={to}
              onChange={(e) => setFrom(e.target.value)}
              className="w-44"
            />
          </div>
          <div>
            <label htmlFor="agendaTo" className="mb-1 block text-xs font-medium text-slate-500">
              Até
            </label>
            <Input
              id="agendaTo"
              type="date"
              value={to}
              min={from}
              onChange={(e) => setTo(e.target.value)}
              className="w-44"
            />
          </div>
          <div className="flex gap-1">
            <Button variant="outline" className="h-9 px-3" onClick={() => applyPreset(p.today)}>
              Hoje
            </Button>
            <Button variant="outline" className="h-9 px-3" onClick={() => applyPreset(p.week)}>
              Próximos 7 dias
            </Button>
            <Button variant="outline" className="h-9 px-3" onClick={() => applyPreset(p.month)}>
              Este mês
            </Button>
          </div>
        </div>
        {invalidRange && (
          <p className="mt-2 text-xs text-red-500">A data inicial não pode ser maior que a final.</p>
        )}
      </Card>

      {scheduleQuery.isLoading && <p className="text-sm text-slate-500">Carregando…</p>}
      {scheduleQuery.isError && (
        <p className="text-sm text-red-500">{getApiErrorMessage(scheduleQuery.error)}</p>
      )}

      {groups.length === 0 && !scheduleQuery.isLoading && (
        <Card className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
          Nenhum agendamento em aberto neste período.
        </Card>
      )}

      <div className="flex flex-col gap-4">
        {groups.map(([day, dayOrders]) => (
          <Card key={day} className="overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-200">
              {formatDayHeading(day)}
            </div>
            <table className="w-full text-sm">
              <tbody>
                {dayOrders.map((order) => (
                  <LinkRow key={order.id} to={`/ordens/${order.id}`}>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">
                      {order.scheduledAt ? formatTime(order.scheduledAt) : '—'}
                    </td>
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
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openReschedule(order)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"
                          title="Reagendar"
                        >
                          <Pencil size={16} />
                        </button>
                        <Button
                          className="h-9 px-3"
                          disabled={checkInMutation.isPending}
                          onClick={() => checkInMutation.mutate(order.id)}
                        >
                          Cliente chegou
                        </Button>
                      </div>
                    </td>
                  </LinkRow>
                ))}
              </tbody>
            </table>
          </Card>
        ))}
      </div>

      {/* Dialog: reagendar */}
      <Dialog
        open={!!editingOrder}
        onClose={() => setEditingOrder(null)}
        title="Reagendar"
        description="Cliente pediu para mudar o horário, ou o agendamento foi lançado errado."
      >
        {rescheduleError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {rescheduleError}
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            submitReschedule()
          }}
          className="flex flex-col gap-4"
          noValidate
        >
          <Field label="Nova data e hora" htmlFor="rescheduleAt">
            <Input
              id="rescheduleAt"
              type="datetime-local"
              value={rescheduleValue}
              onChange={(e) => setRescheduleValue(e.target.value)}
            />
          </Field>
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setEditingOrder(null)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={rescheduleMutation.isPending}>
              {rescheduleMutation.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
