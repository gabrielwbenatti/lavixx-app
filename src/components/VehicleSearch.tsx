import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Input } from '@/components/ui/Input'
import { describeVehicle } from '@/lib/describe'
import { formatPlate } from '@/lib/format'
import { cn } from '@/lib/cn'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import { listVehicles } from '@/services/vehicleService'
import { VEHICLE_TYPE_LABELS, type VehicleResponse } from '@/types/vehicle'

interface VehicleSearchProps {
  onSelect: (vehicleId: string) => void
  invalid?: boolean
  autoFocus?: boolean
}

/** Mínimo de caracteres para exibir a lista de resultados. */
const MIN_CHARS = 3
/** Quantidade máxima de sugestões exibidas. */
const MAX_RESULTS = 8

/**
 * Campo de busca de veículo por placa, apelido, modelo ou nome do cliente.
 * A busca é feita na API enquanto o usuário digita; ao escolher, informa o vehicleId ao pai.
 *
 * Remonte o componente (via `key`) para resetar o estado interno.
 */
export function VehicleSearch({
  onSelect,
  invalid,
  autoFocus,
}: VehicleSearchProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const [selected, setSelected] = useState<VehicleResponse | null>(null)

  const term = useDebouncedValue(query.trim())
  const searchQuery = useQuery({
    queryKey: ['vehicles', 'search', term],
    queryFn: () => listVehicles({ search: term, size: MAX_RESULTS }),
    enabled: term.length >= MIN_CHARS && !selected,
    placeholderData: keepPreviousData,
  })
  const matches = term.length >= MIN_CHARS ? (searchQuery.data?.content ?? []) : []

  const label = (v: VehicleResponse) => {
    const base = v.plate ? `${formatPlate(v.plate)} — ${describeVehicle(v)}` : describeVehicle(v)
    return `${base} (${v.customerName})`
  }

  const pick = (v: VehicleResponse) => {
    setSelected(v)
    setQuery(label(v))
    setOpen(false)
    onSelect(v.id)
  }

  const handleChange = (value: string) => {
    setQuery(value)
    setOpen(value.trim().length >= MIN_CHARS)
    setHighlight(0)
    if (selected) {
      setSelected(null)
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
            <li className="px-3 py-2 text-sm text-slate-400">
              {searchQuery.isFetching || term !== query.trim() ? 'Buscando…' : 'Nenhum veículo encontrado.'}
            </li>
          ) : (
            matches.map((v, i) => (
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
                    {v.customerName}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}

      {selected && (
        <div className="mt-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
          <span className="font-medium">Cliente:</span>{' '}
          {selected.customerName}
          {' · '}
          <span className="font-medium">Veículo:</span> {describeVehicle(selected)}
          {selected.plate ? ` (${formatPlate(selected.plate)})` : ''}
        </div>
      )}
    </div>
  )
}
