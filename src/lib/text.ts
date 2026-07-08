/**
 * Normaliza texto para buscas tolerantes: remove acentos/diacríticos e passa a
 * minúsculas. Assim "agua" encontra "água" e "sao" encontra "São".
 */
export function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}
