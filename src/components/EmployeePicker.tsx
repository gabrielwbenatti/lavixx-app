import { cn } from '@/lib/cn'
import type { EmployeeResponse, EmployeeSummary } from '@/types/employee'

interface EmployeePickerProps {
  /** Todos os funcionários do estabelecimento. */
  employees: EmployeeResponse[]
  /** Funcionários já vinculados ao item (mantém visíveis mesmo se inativados depois). */
  current?: EmployeeSummary[]
  value: string[]
  onChange: (ids: string[]) => void
}

/** Seleção múltipla de funcionários, em botões alternáveis (um toque por pessoa). */
export function EmployeePicker({ employees, current = [], value, onChange }: EmployeePickerProps) {
  const currentIds = new Set(current.map((e) => e.id))
  // Ativos + inativos que já estavam no item (para não "sumirem" da edição).
  const options = employees.filter((e) => e.active || currentIds.has(e.id))

  if (options.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Nenhum funcionário ativo. Cadastre em Cadastros › Funcionários.
      </p>
    )
  }

  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id])

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((e) => {
        const selected = value.includes(e.id)
        return (
          <button
            key={e.id}
            type="button"
            aria-pressed={selected}
            onClick={() => toggle(e.id)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
              selected
                ? 'border-indigo-600 bg-indigo-600 text-white'
                : 'border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800',
              !e.active && 'opacity-60',
            )}
          >
            {e.name}
            {!e.active && ' (inativo)'}
          </button>
        )
      })}
    </div>
  )
}
