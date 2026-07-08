import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/Input'
import { describeVehicle } from '@/lib/describe'
import { normalizePlate } from '@/lib/plate'
import { normalizeSearch } from '@/lib/text'
import { formatPlate } from '@/lib/format'
import { cn } from '@/lib/cn'
import { VEHICLE_TYPE_LABELS, type VehicleResponse } from '@/types/vehicle'

interface VehicleSearchProps {
  vehicles: VehicleResponse[]
  customerNameById: Map<string, string>
  onSelect: (vehicleId: string) => void
  invalid?: boolean
  autoFocus?: boolean
}

/** Mínimo de caracteres para exibir a lista de resultados. */
const MIN_CHARS = 3

/**
 * Campo de busca de veículo por placa, apelido, modelo ou nome do cliente.
 * Mostra uma lista filtrada; ao escolher, informa o vehicleId ao pai.
 *
 * Remonte o componente (via `key`) para resetar o estado interno.
 */
export function VehicleSearch({
  vehicles,
  customerNameById,
  onSelect,
  invalid,
  autoFocus,
}: VehicleSearchProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const [selectedId, setSelectedId] = useState('')

  const matches = useMemo(() => {
    const q = normalizeSearch(query.trim())
    const qPlate = normalizePlate(query)
    if (q.length < MIN_CHARS) return []
    return vehicles
      .filter((v) => {
        const customer = customerNameById.get(v.customerId) ?? ''
        const haystack = normalizeSearch(
          [v.nickname, v.manufacturer, v.model, v.identifier, customer]
            .filter(Boolean)
            .join(' '),
        )
        const plateMatch = v.plate ? normalizePlate(v.plate).includes(qPlate) && qPlate !== '' : false
        return plateMatch || haystack.includes(q)
      })
      .slice(0, 8)
  }, [query, vehicles, customerNameById])

  const label = (v: VehicleResponse) => {
    const customer = customerNameById.get(v.customerId)
    const base = v.plate ? `${formatPlate(v.plate)} — ${describeVehicle(v)}` : describeVehicle(v)
    return customer ? `${base} (${customer})` : base
  }

  const pick = (v: VehicleResponse) => {
    setSelectedId(v.id)
    setQuery(label(v))
    setOpen(false)
    onSelect(v.id)
  }

  const handleChange = (value: string) => {
    setQuery(value)
    setOpen(value.trim().length >= MIN_CHARS)
    setHighlight(0)
    if (selectedId) {
      setSelectedId('')
      onSelect('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      if (query.trim().length >= MIN_CHARS) setOpen(true)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => Math.min(h + 1, matches.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      if (open && matches[highlight]) {
        e.preventDefault()
        pick(matches[highlight])
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const selectedVehicle = vehicles.find((v) => v.id === selectedId)

  return (
    <div className="relative">
      <Input
        type="text"
        placeholder="Digite a placa, apelido ou cliente…"
        value={query}
        invalid={invalid}
        autoFocus={autoFocus}
        autoComplete="off"
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => setOpen(query.trim().length >= MIN_CHARS)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={handleKeyDown}
      />

      {open && query.trim().length >= MIN_CHARS && (
        <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
          {matches.length === 0 ? (
            <li className="px-3 py-2 text-sm text-slate-400">Nenhum veículo encontrado.</li>
          ) : (
            matches.map((v, i) => {
              const customer = customerNameById.get(v.customerId)
              return (
                <li key={v.id}>
                  <button
                    type="button"
                    className={cn(
                      'flex w-full flex-col items-start px-3 py-2 text-left text-sm',
                      i === highlight
                        ? 'bg-indigo-50 dark:bg-indigo-950'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800',
                    )}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setHighlight(i)}
                    onClick={() => pick(v)}
                  >
                    <span className="font-medium text-slate-800 dark:text-slate-100">
                      {v.plate ? formatPlate(v.plate) : describeVehicle(v)}
                      <span className="ml-2 text-xs font-normal text-slate-400">
                        {VEHICLE_TYPE_LABELS[v.type]}
                      </span>
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {v.plate ? `${describeVehicle(v)} · ` : ''}
                      {customer ?? 'Sem cliente'}
                    </span>
                  </button>
                </li>
              )
            })
          )}
        </ul>
      )}

      {selectedVehicle && (
        <div className="mt-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
          <span className="font-medium">Cliente:</span>{' '}
          {customerNameById.get(selectedVehicle.customerId) ?? '—'}
          {' · '}
          <span className="font-medium">Veículo:</span> {describeVehicle(selectedVehicle)}
          {selectedVehicle.plate ? ` (${formatPlate(selectedVehicle.plate)})` : ''}
        </div>
      )}
    </div>
  )
}
