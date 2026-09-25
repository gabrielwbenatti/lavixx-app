import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * Página atual (base 0) guardada na URL como `?pagina=N` (base 1), para o voltar do
 * navegador e links compartilhados manterem a página.
 */
export function usePageParam(): [number, (page: number) => void] {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(Number(searchParams.get('pagina') ?? 1) - 1, 0) || 0

  const setPage = useCallback(
    (next: number) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev)
          if (next > 0) params.set('pagina', String(next + 1))
          else params.delete('pagina')
          return params
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  return [page, setPage]
}
