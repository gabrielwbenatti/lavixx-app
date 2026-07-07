/** Normaliza uma placa para comparação/exibição: só letras e números, maiúsculo. */
export function normalizePlate(s: string): string {
  return s.replace(/[^a-z0-9]/gi, '').toUpperCase()
}
