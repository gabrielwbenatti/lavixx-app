/** Fuso padrão quando o do navegador não pode ser detectado (espelha TenantTime.DEFAULT_ZONE). */
export const DEFAULT_TIMEZONE = 'America/Sao_Paulo'

/** Fusos do Brasil (ids IANA) com o nome mais conhecido de cada um. */
export const BRAZIL_TIMEZONES: { id: string; label: string }[] = [
  { id: 'America/Sao_Paulo', label: 'Brasília (UTC−3)' },
  { id: 'America/Bahia', label: 'Bahia (UTC−3)' },
  { id: 'America/Fortaleza', label: 'Fortaleza / Nordeste (UTC−3)' },
  { id: 'America/Recife', label: 'Recife (UTC−3)' },
  { id: 'America/Belem', label: 'Belém (UTC−3)' },
  { id: 'America/Manaus', label: 'Manaus (UTC−4)' },
  { id: 'America/Cuiaba', label: 'Cuiabá (UTC−4)' },
  { id: 'America/Campo_Grande', label: 'Campo Grande (UTC−4)' },
  { id: 'America/Porto_Velho', label: 'Porto Velho (UTC−4)' },
  { id: 'America/Boa_Vista', label: 'Boa Vista (UTC−4)' },
  { id: 'America/Rio_Branco', label: 'Rio Branco (UTC−5)' },
  { id: 'America/Noronha', label: 'Fernando de Noronha (UTC−2)' },
]

/** Fuso do navegador de quem está usando (ex.: "America/Sao_Paulo"). */
export function detectBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIMEZONE
  } catch {
    return DEFAULT_TIMEZONE
  }
}
