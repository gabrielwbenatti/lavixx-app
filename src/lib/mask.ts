import type { UseFormRegisterReturn } from 'react-hook-form'

/**
 * Máscaras progressivas para telefone e CPF/CNPJ: reformatam a cada tecla,
 * a partir da quantidade de caracteres já digitados (sem exigir o tamanho final).
 * Sempre recebem o valor bruto do <input> (que já pode conter a máscara anterior)
 * e devolvem o valor mascarado para reatribuir ao input.
 */

/** (XX) XXXX-XXXX enquanto <= 10 dígitos; reflui para (XX) XXXXX-XXXX ao digitar o 11º. */
export function maskPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11)
  if (digits.length === 0) return ''
  if (digits.length <= 2) return `(${digits}`

  const ddd = digits.slice(0, 2)
  const rest = digits.slice(2)
  if (rest.length <= 4) return `(${ddd}) ${rest}`

  const splitAt = digits.length <= 10 ? 4 : 5
  return `(${ddd}) ${rest.slice(0, splitAt)}-${rest.slice(splitAt)}`
}

/**
 * CPF (000.000.000-00) enquanto <= 11 caracteres; reflui para CNPJ
 * (00.000.000/0000-00) ao passar de 11. CNPJ pode ser alfanumérico
 * (12 alfanuméricos + 2 dígitos), por isso os grupos aceitam qualquer caractere.
 */
export function maskDocument(raw: string): string {
  const clean = raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 14)
  const len = clean.length

  if (len <= 11) {
    if (len > 9) return clean.replace(/(.{3})(.{3})(.{3})(.{1,2})/, '$1.$2.$3-$4')
    if (len > 6) return clean.replace(/(.{3})(.{3})(.{1,3})/, '$1.$2.$3')
    if (len > 3) return clean.replace(/(.{3})(.{1,3})/, '$1.$2')
    return clean
  }

  if (len > 12) return clean.replace(/(.{2})(.{3})(.{3})(.{4})(.{1,2})/, '$1.$2.$3/$4-$5')
  if (len > 8) return clean.replace(/(.{2})(.{3})(.{3})(.{1,4})/, '$1.$2.$3/$4')
  return clean.replace(/(.{2})(.{3})(.{1,3})/, '$1.$2.$3')
}

/** Envolve o retorno de `register(...)` para mascarar o valor a cada digitação. */
export function withMask(
  registration: UseFormRegisterReturn,
  mask: (value: string) => string,
): UseFormRegisterReturn {
  return {
    ...registration,
    onChange: (e) => {
      e.target.value = mask(e.target.value)
      return registration.onChange(e)
    },
  }
}
