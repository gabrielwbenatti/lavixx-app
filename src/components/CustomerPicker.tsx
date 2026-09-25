import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/cn'
import { formatDocument, formatPhone } from '@/lib/format'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import { listCustomers } from '@/services/customerService'

/** Quantidade máxima de sugestões exibidas. */
const MAX_RESULTS = 8

export interface PickedCustomer {
  id: string
  name: string
}

interface CustomerPickerProps {
  id?: string
  /** Cliente já escolhido (ex.: ao editar um veículo). */
  value: PickedCustomer | null
  onChange: (customer: PickedCustomer | null) => void
  invalid?: boolean
}

/**
 * Campo para escolher um cliente buscando por nome, telefone ou CPF/CNPJ na API.
 * Ao focar sem digitar nada, lista os primeiros clientes em ordem alfabética.
 */
export function CustomerPicker({ id, value, onChange, invalid }: CustomerPickerProps) {
  const [query, setQuery] = useState(value?.name ?? '')
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)

  const term = useDebouncedValue(query.trim())
  const searchQuery = useQuery({
    queryKey: ['customers', 'search', term],
    queryFn: () => listCustomers({ search: term || undefined, size: MAX_RESULTS }),
    enabled: open && !value,
    placeholderData: keepPreviousData,
  })
  const matches = searchQuery.data?.content ?? []

  const pick = (customer: PickedCustomer) => {
    setQuery(customer.name)
    setOpen(false)
    onChange({ id: customer.id, name: customer.name })
  }

  const handleChange = (text: string) => {
    setQuery(text)
    setOpen(true)
    setHighlight(0)
    if (value) onChange(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
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
        id={id}
        type="text"
        placeholder="Buscar cliente por nome, telefone ou CPF…"
        value={query}
        invalid={invalid}
        autoComplete="off"
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => !value && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={handleKeyDown}
      />

      {open && !value && (
        <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
          {matches.length === 0 ? (
            <li className="px-3 py-2 text-sm text-slate-400">
              {searchQuery.isFetching || term !== query.trim()
                ? 'Buscando…'
                : 'Nenhum cliente encontrado.'}
            </li>
          ) : (
            matches.map((c, i) => (
              <li key={c.id}>
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
                  onClick={() => pick(c)}
                >
                  <span className="font-medium text-slate-800 dark:text-slate-100">{c.name}</span>
                  {(c.phone || c.document) && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {[c.phone && formatPhone(c.phone), c.document && formatDocument(c.document)]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
