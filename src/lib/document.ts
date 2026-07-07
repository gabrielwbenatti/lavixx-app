/**
 * Normaliza um documento (CPF/CNPJ) para armazenamento: remove separadores,
 * mantém alfanumérico e deixa em maiúsculas.
 *
 * O CNPJ alfanumérico (jul/2026) tem 12 caracteres alfanuméricos + 2 dígitos
 * verificadores, por isso NÃO removemos letras — apenas a formatação.
 */
export function normalizeDocument(value: string): string {
  return value.replace(/[^a-z0-9]/gi, '').toUpperCase()
}

/** CPF (11 dígitos) ou CNPJ (12 alfanuméricos + 2 dígitos). */
export function isValidDocument(value: string): boolean {
  return /^\d{11}$/.test(value) || /^[A-Z0-9]{12}\d{2}$/.test(value)
}
