/** Formata um número como moeda brasileira (R$). */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/**
 * Formata CPF (11 dígitos) ou CNPJ (14 caracteres); devolve o valor original se não bater.
 * O CNPJ pode ser alfanumérico (12 alfanuméricos + 2 dígitos), então a máscara do
 * CNPJ usa `.` (qualquer caractere) em vez de `\d`.
 */
export function formatDocument(doc: string | null | undefined): string {
  if (!doc) return '—'
  const d = doc.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (d.length === 11) {
    return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }
  if (d.length === 14) {
    return d.replace(/(.{2})(.{3})(.{3})(.{4})(.{2})/, '$1.$2.$3/$4-$5')
  }
  return doc
}

/**
 * Formata telefone (armazenado só com dígitos) para exibição.
 * 11 dígitos → (XX) XXXXX-XXXX (celular); 10 → (XX) XXXX-XXXX (fixo).
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '—'
  const d = phone.replace(/\D/g, '')
  if (d.length === 11) {
    return d.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  if (d.length === 10) {
    return d.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  return phone
}

/**
 * Formata a placa (armazenada limpa, sem separadores) para exibição.
 * Formato antigo (3 letras + 4 números) recebe hífen: ABC-1234.
 * Formato Mercosul (ABC1D23) e demais são exibidos como estão, em maiúsculas.
 */
export function formatPlate(plate: string | null | undefined): string {
  if (!plate) return '—'
  const p = plate.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (/^[A-Z]{3}[0-9]{4}$/.test(p)) {
    return `${p.slice(0, 3)}-${p.slice(3)}`
  }
  return p
}
