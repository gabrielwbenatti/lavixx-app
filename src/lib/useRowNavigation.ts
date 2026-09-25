import { useCallback } from 'react'
import type { MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'

/** Elementos que têm ação própria: um clique neles não deve abrir a linha. */
const INTERACTIVE = 'a, button, input, select, textarea, label, [role="button"]'

/**
 * Handler de clique para linhas/itens de listagem que abrem uma tela de detalhe.
 * - Clique em qualquer ponto abre `to`; Ctrl/⌘+clique abre em nova aba.
 * - Cliques em links e botões dentro da linha seguem com a própria ação.
 * - Arrastar para selecionar texto não abre a linha.
 */
export function useRowNavigation() {
  const navigate = useNavigate()
  return useCallback(
    (to: string) => (e: MouseEvent<HTMLElement>) => {
      if (e.defaultPrevented) return
      if ((e.target as HTMLElement).closest(INTERACTIVE)) return
      if (window.getSelection()?.toString()) return
      if (e.ctrlKey || e.metaKey) {
        window.open(to, '_blank', 'noopener')
        return
      }
      navigate(to)
    },
    [navigate],
  )
}
