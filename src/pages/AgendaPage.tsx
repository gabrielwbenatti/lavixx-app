import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarClock } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { getApiErrorMessage } from '@/lib/api'
import { describeVehicle } from '@/lib/describe'
import { toDateInput, formatTime } from '@/lib/datetime'
import { listScheduledServiceOrders, updateServiceOrderStatus } from '@/services/serviceOrderService'
import { listVehicles } from '@/services/vehicleService'
import { listCustomers } from '@/services/customerService'

export function AgendaPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [date, setDate] = useState(() => toDateInput(new Date()))

  const scheduleQuery = useQuery({
    queryKey: ['service-orders-schedule', date],
    queryFn: () => listScheduledServiceOrders(date, date),
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

  const checkInMutation = useMutation({
    mutationFn: (id: string) => updateServiceOrderStatus(id, 'waiting'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-orders-schedule'] })
      queryClient.invalidateQueries({ queryKey: ['service-orders'] })
    },
    onError: (err) => window.alert(getApiErrorMessage(err)),
  })

  const orders = scheduleQuery.data ?? []

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
              Ordens agendadas com antecedência. Quando o cliente chegar, marque o check-in.
            </p>
          </div>
        </div>
        <Link to="/ordens">
          <Button variant="outline">Ir para Ordens de serviço</Button>
        </Link>
      </header>

      <div className="mb-4 flex items-center gap-2">
        <label htmlFor="agendaDate" className="text-sm text-slate-500">
          Data:
        </label>
        <Input
          id="agendaDate"
          type="date"
          className="h-9 w-44"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {scheduleQuery.isLoading && <p className="text-sm text-slate-500">Carregando…</p>}
      {scheduleQuery.isError && (
        <p className="text-sm text-red-500">{getApiErrorMessage(scheduleQuery.error)}</p>
      )}

      {orders.length === 0 && !scheduleQuery.isLoading && (
        <Card className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
          Nenhum agendamento para este dia.
        </Card>
      )}

      {orders.length > 0 && (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-3 font-medium">Horário</th>
                <th className="px-4 py-3 font-medium">Cliente / Veículo</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                >
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">
                    {order.scheduledAt ? formatTime(order.scheduledAt) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800 dark:text-slate-100">
                      {customerNameById.get(order.customerId) ?? 'Cliente'}
                    </div>
                    <div className="text-xs text-slate-400">
                      {vehicleLabelById.get(order.vehicleId) ?? '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        className="h-9 px-3"
                        onClick={() => navigate(`/ordens/${order.id}`)}
                      >
                        Abrir
                      </Button>
                      <Button
                        className="h-9 px-3"
                        disabled={checkInMutation.isPending}
                        onClick={() => checkInMutation.mutate(order.id)}
                      >
                        Cliente chegou
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
