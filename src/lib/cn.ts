/**
 * Junta classes condicionais, ignorando valores falsy.
 * Versao enxuta (sem dependencias) no estilo do `clsx`.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}
