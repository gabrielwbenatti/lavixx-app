/** Espelha PageResponse da API: uma página de resultados de uma listagem. */
export interface Page<T> {
  content: T[]
  /** Índice da página, começando em 0. */
  page: number
  size: number
  totalElements: number
  totalPages: number
}

/** Parâmetros comuns das listagens paginadas. */
export interface PageParams {
  page?: number
  size?: number
}
