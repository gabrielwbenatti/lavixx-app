import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/Input'
import { formatCurrency } from '@/lib/format'
import { normalizeSearch } from '@/lib/text'
import { cn } from '@/lib/cn'

interface CatalogItem {
  id: string
  name: string
  price: number
}

interface CatalogEntry extends CatalogItem {
  kind: 'service' | 'product'
}

interface CatalogSearchProps {
  services: CatalogItem[]
  products: CatalogItem[]
  /** Valor selecionado no formato "service:<id>" | "product:<id>" | "". */
  value: string
  onChange: (ref: string) => void
  invalid?: boolean
  autoFocus?: boolean
}

const MAX_RESULTS = 50

/** Mínimo de caracteres para exibir a lista de resultados. */
const MIN_CHARS = 3

/**
 * Combobox com busca para escolher um item do catálogo (serviço ou produto).
 * Digite para filtrar por nome; com o campo vazio, lista tudo.
 *
 * Remonte o componente (via `key`) para resetar o estado interno.
 */
export function CatalogSearch({
  services,
  products,
  value,
  onChange,
  invalid,
  autoFocus,
}: CatalogSearchProps) {
  const entries = useMemo<CatalogEntry[]>(
    () => [
      ...services.map((s) => ({ ...s, kind: 'service' as const })),
      ...products.map((p) => ({ ...p, kind: 'product' as const })),
    ],
    [services, products],
  )

  const refOf = (e: CatalogEntry) => `${e.kind}:${e.id}`
  const selected = entries.find((e) => refOf(e) === value)

  const [query, setQuery] = useState(selected ? selected.name : '')
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)

  const matches = useMemo(() => {
    const trimmed = query.trim()
    if (trimmed.length < MIN_CHARS) return []
    const q = normalizeSearch(trimmed)
    return entries
      .filter((e) => normalizeSearch(e.name).includes(q))
      .slice(0, MAX_RESULTS)
  }, [query, entries])

  const pick = (e: CatalogEntry) => {
    setQuery(e.name)
    setOpen(false)
    onChange(refOf(e))
  }

  const handleChange = (v: string) => {
    setQuery(v)
    setOpen(v.trim().length >= MIN_CHARS)
    setHighlight(0)
    if (value) onChange('')
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
        placeholder="Digite para buscar serviço ou produto…"
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
            <li className="px-3 py-2 text-sm text-slate-400">Nenhum item encontrado.</li>
          ) : (
            matches.map((e, i) => (
              <li key={refOf(e)}>
                <button
                  type="button"
                  className={cn(
                    'flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm',
                    i === highlight
                      ? 'bg-indigo-50 dark:bg-indigo-950'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800',
                  )}
                  onMouseDown={(ev) => ev.preventDefault()}
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => pick(e)}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        'rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase',
                        e.kind === 'service'
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
                      )}
                    >
                      {e.kind === 'service' ? 'Serviço' : 'Produto'}
                    </span>
                    <span className="font-medium text-slate-800 dark:text-slate-100">{e.name}</span>
                  </span>
                  <span className="shrink-0 text-slate-500 dark:text-slate-400">
                    {formatCurrency(e.price)}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
