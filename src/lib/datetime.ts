/** Converte uma Date para o formato de <input type="date"> (yyyy-MM-dd, horário local). */
export function toDateInput(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Formata uma data yyyy-MM-dd para exibição pt-BR (dd/MM/yyyy). */
export function formatDateBR(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

/** Verdadeiro se a data (ISO) cai no dia de hoje (horário local). */
export function isToday(iso: string | null | undefined): boolean {
  if (!iso) return false
  const d = new Date(iso)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

/** Hora no formato HH:mm (local). */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

/** Data + hora pt-BR (dd/MM/yyyy HH:mm, local). */
export function formatDateTimeBR(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Converte um ISO para o formato de <input type="datetime-local"> (yyyy-MM-ddTHH:mm, horário local). */
export function toDateTimeLocalInput(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${mo}-${day}T${h}:${mi}`
}

/** Tempo decorrido desde a data, resumido: "agora", "há 12 min", "há 2 h 5 min". */
export function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diffMs / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  const h = Math.floor(min / 60)
  const rest = min % 60
  return rest ? `há ${h} h ${rest} min` : `há ${h} h`
}
