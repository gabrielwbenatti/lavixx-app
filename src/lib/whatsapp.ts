/**
 * Monta o aviso de "carro pronto" via WhatsApp no modo manual: um link `wa.me`
 * que abre o WhatsApp (app ou Web) com a mensagem já preenchida. Não depende de
 * API oficial — o dono só confirma o envio.
 */

import type { VehicleResponse } from '@/types/vehicle'
import { describeVehicle } from '@/lib/describe'
import { formatPlate } from '@/lib/format'

/**
 * Normaliza um telefone brasileiro para o formato que o `wa.me` espera
 * (dígitos com código do país, sem `+`). Devolve `null` se não houver número
 * utilizável (menos de 10 dígitos).
 */
export function normalizeBrazilPhone(phone: string | null | undefined): string | null {
  if (!phone) return null
  const d = phone.replace(/\D/g, '')
  if (d.length < 10) return null
  // Já veio com código do país (12 = fixo, 13 = celular).
  if (d.startsWith('55') && d.length >= 12) return d
  // DDD + número (10 fixo, 11 celular) → prefixa o Brasil.
  if (d.length === 10 || d.length === 11) return '55' + d
  return d
}

/** Rótulo do veículo para a mensagem, evitando repetir a placa. */
function vehicleLabel(vehicle?: VehicleResponse): string {
  if (!vehicle) return 'seu veículo'
  const desc = describeVehicle(vehicle)
  const plate = vehicle.plate ? formatPlate(vehicle.plate) : null
  return plate && desc !== plate ? `${desc} (${plate})` : desc
}

/** Item da OS que aparece na mensagem (só o necessário para listar). */
export interface CarReadyItem {
  name: string
  quantity: number
}

/** Texto padrão do aviso de "carro pronto", listando os serviços/produtos da OS. */
export function buildCarReadyMessage(params: {
  customerName?: string | null
  vehicle?: VehicleResponse
  establishmentName?: string | null
  items?: CarReadyItem[]
}): string {
  const firstName = params.customerName?.trim().split(/\s+/)[0]
  const greeting = firstName ? `Olá, ${firstName}!` : 'Olá!'
  const at = params.establishmentName ? ` no ${params.establishmentName}` : ''
  let message = `${greeting} Seu ${vehicleLabel(params.vehicle)} já está pronto para retirada${at}.`

  const items = params.items ?? []
  if (items.length > 0) {
    const lines = items.map(
      (it) => `- ${it.name}${it.quantity > 1 ? ` (${it.quantity}x)` : ''}`,
    )
    message += `\n\nServiços realizados:\n${lines.join('\n')}`
  }
  return message
}

/**
 * Link `wa.me` para o aviso de "carro pronto". Devolve `null` quando o cliente
 * não tem telefone utilizável (aí o botão fica desabilitado/oculto).
 */
export function buildCarReadyWhatsAppLink(params: {
  phone: string | null | undefined
  customerName?: string | null
  vehicle?: VehicleResponse
  establishmentName?: string | null
  items?: CarReadyItem[]
}): string | null {
  const number = normalizeBrazilPhone(params.phone)
  if (!number) return null
  const message = buildCarReadyMessage(params)
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}
