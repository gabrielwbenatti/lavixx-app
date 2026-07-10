import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart3 } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { getApiErrorMessage } from '@/lib/api'
import { formatCurrency } from '@/lib/format'
import { toDateInput } from '@/lib/datetime'
import { getReportSummary } from '@/services/reportService'
import { EXPENSE_CATEGORY_LABELS } from '@/types/expense'

/** Presets de período rápidos. */
function presets() {
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const sevenAgo = new Date()
  sevenAgo.setDate(today.getDate() - 6)
  return {
    today: { from: toDateInput(today), to: toDateInput(today) },
    week: { from: toDateInput(sevenAgo), to: toDateInput(today) },
    month: { from: toDateInput(startOfMonth), to: toDateInput(today) },
  }
}

export function RelatoriosPage() {
  const p = presets()
  const [from, setFrom] = useState(p.today.from)
  const [to, setTo] = useState(p.today.to)

  const invalidRange = from > to

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ['report-summary', from, to],
    queryFn: () => getReportSummary(from, to),
    enabled: !invalidRange,
  })

  const applyPreset = (preset: { from: string; to: string }) => {
    setFrom(preset.from)
    setTo(preset.to)
  }

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
          <BarChart3 size={20} strokeWidth={1.75} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Fechamento de caixa</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Faturamento, recebimentos e desempenho por período.
          </p>
        </div>
      </header>

      {/* Filtro de período */}
      <Card className="mb-6 p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor="from" className="mb-1 block text-xs font-medium text-slate-500">
              De
            </label>
            <Input
              id="from"
              type="date"
              value={from}
              max={to}
              onChange={(e) => setFrom(e.target.value)}
              className="w-44"
            />
          </div>
          <div>
            <label htmlFor="to" className="mb-1 block text-xs font-medium text-slate-500">
              Até
            </label>
            <Input
              id="to"
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
              7 dias
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

      {isLoading && <p className="text-sm text-slate-500">Carregando…</p>}
      {isError && <p className="text-sm text-red-500">{getApiErrorMessage(error)}</p>}

      {data && (
        <div className={isFetching ? 'opacity-60 transition-opacity' : ''}>
          {/* Resultado do caixa: recebido − despesas = lucro */}
          <div className="mb-4 grid gap-4 sm:grid-cols-3">
            <Tile label="Recebido" value={formatCurrency(data.received)} tone="green" />
            <Tile label="Despesas" value={formatCurrency(data.expenses)} tone="red" />
            <Tile
              label="Lucro (caixa)"
              value={formatCurrency(data.profit)}
              tone={data.profit >= 0 ? 'green' : 'red'}
            />
          </div>

          {/* Indicadores secundários */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Tile label="Faturado" value={formatCurrency(data.revenue)} tone="indigo" />
            <Tile label="A receber" value={formatCurrency(data.receivable)} tone="red" />
            <Tile label="OS concluídas" value={String(data.completedOrders)} tone="slate" />
            <Tile label="Ticket médio" value={formatCurrency(data.averageTicket)} tone="slate" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Por forma de pagamento */}
            <Card className="overflow-hidden">
              <h2 className="border-b border-slate-200 px-4 py-3 font-semibold text-slate-800 dark:border-slate-800 dark:text-slate-100">
                Recebido por forma de pagamento
              </h2>
              {data.byPaymentMethod.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-slate-400">
                  Nenhum pagamento no período.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-slate-500 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-4 py-2 font-medium">Forma</th>
                      <th className="px-4 py-2 font-medium">Qtd</th>
                      <th className="px-4 py-2 text-right font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byPaymentMethod.map((m) => (
                      <tr
                        key={m.methodName}
                        className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                      >
                        <td className="px-4 py-2 text-slate-800 dark:text-slate-100">{m.methodName}</td>
                        <td className="px-4 py-2 text-slate-500">{m.count}</td>
                        <td className="px-4 py-2 text-right font-medium text-slate-800 dark:text-slate-100">
                          {formatCurrency(m.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>

            {/* Por serviço */}
            <Card className="overflow-hidden">
              <h2 className="border-b border-slate-200 px-4 py-3 font-semibold text-slate-800 dark:border-slate-800 dark:text-slate-100">
                Faturamento por serviço
              </h2>
              {data.byService.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-slate-400">
                  Nenhum serviço concluído no período.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-slate-500 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-4 py-2 font-medium">Serviço</th>
                      <th className="px-4 py-2 font-medium">Qtd</th>
                      <th className="px-4 py-2 text-right font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byService.map((s) => (
                      <tr
                        key={s.name}
                        className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                      >
                        <td className="px-4 py-2 text-slate-800 dark:text-slate-100">{s.name}</td>
                        <td className="px-4 py-2 text-slate-500">{s.quantity}</td>
                        <td className="px-4 py-2 text-right font-medium text-slate-800 dark:text-slate-100">
                          {formatCurrency(s.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>

            {/* Despesas por categoria */}
            <Card className="overflow-hidden">
              <h2 className="border-b border-slate-200 px-4 py-3 font-semibold text-slate-800 dark:border-slate-800 dark:text-slate-100">
                Despesas por categoria
              </h2>
              {data.byExpenseCategory.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-slate-400">
                  Nenhuma despesa no período.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-slate-500 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-4 py-2 font-medium">Categoria</th>
                      <th className="px-4 py-2 font-medium">Qtd</th>
                      <th className="px-4 py-2 text-right font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byExpenseCategory.map((c) => (
                      <tr
                        key={c.category}
                        className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                      >
                        <td className="px-4 py-2 text-slate-800 dark:text-slate-100">
                          {EXPENSE_CATEGORY_LABELS[c.category]}
                        </td>
                        <td className="px-4 py-2 text-slate-500">{c.count}</td>
                        <td className="px-4 py-2 text-right font-medium text-red-600 dark:text-red-400">
                          {formatCurrency(c.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

const toneStyles = {
  green: 'text-green-700 dark:text-green-400',
  indigo: 'text-indigo-700 dark:text-indigo-300',
  red: 'text-red-600 dark:text-red-400',
  slate: 'text-slate-800 dark:text-slate-100',
} as const

function Tile({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: keyof typeof toneStyles
}) {
  return (
    <Card className="p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</div>
      <div className={`mt-1 text-xl font-bold ${toneStyles[tone]}`}>{value}</div>
    </Card>
  )
}
