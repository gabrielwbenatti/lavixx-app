import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { useRowNavigation } from '@/lib/useRowNavigation'

interface LinkRowProps extends HTMLAttributes<HTMLTableRowElement> {
  /** Rota de detalhe aberta ao clicar na linha. */
  to: string
}

/**
 * Linha de tabela que abre o item ao clicar em qualquer ponto (padrão das listagens).
 * Mantenha um <Link> no texto principal da linha: ele dá acesso por teclado e Ctrl+clique.
 */
export function LinkRow({ to, className, ...props }: LinkRowProps) {
  const openRow = useRowNavigation()
  return (
    <tr
      onClick={openRow(to)}
      className={cn(
        'cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50',
        'dark:border-slate-800 dark:hover:bg-slate-800/50',
        className,
      )}
      {...props}
    />
  )
}
