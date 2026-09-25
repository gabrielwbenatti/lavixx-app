import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { Page } from '@/types/page'

interface PaginationProps {
  page: Pick<Page<unknown>, 'page' | 'totalPages' | 'totalElements'>
  onChange: (page: number) => void
  /** Rótulo da contagem, no plural (ex.: "clientes"). */
  label?: string
}

/** Rodapé de listagem paginada: anterior/próxima e "Página X de Y · N registros". */
export function Pagination({ page, onChange, label = 'registros' }: PaginationProps) {
  if (page.totalElements === 0) return null
  const current = page.page + 1
  const total = Math.max(page.totalPages, 1)

  return (
    <nav
      className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500 dark:text-slate-400"
      aria-label="Paginação"
    >
      <span>
        {page.totalElements} {label}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          className="h-9 px-3"
          onClick={() => onChange(page.page - 1)}
          disabled={current <= 1}
          aria-label="Página anterior"
        >
          <ChevronLeft size={16} />
        </Button>
        <span className="min-w-24 text-center">
          Página {current} de {total}
        </span>
        <Button
          variant="outline"
          className="h-9 px-3"
          onClick={() => onChange(page.page + 1)}
          disabled={current >= total}
          aria-label="Próxima página"
        >
          <ChevronRight size={16} />
        </Button>
      </div>
    </nav>
  )
}
