/** Formata um número como moeda brasileira (R$). */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/** Formata CPF (11) ou CNPJ (14) dígitos; devolve o valor original se não bater. */
export function formatDocument(doc: string | null | undefined): string {
  if (!doc) return '—'
  const d = doc.replace(/\D/g, '')
  if (d.length === 11) {
    return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }
  if (d.length === 14) {
    return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }
  return doc
}
