import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

import { getApiErrorMessage } from '@/lib/api'
import { formatCurrency, formatDocument, formatPhone, formatPlate } from '@/lib/format'
import { formatDateTimeBR } from '@/lib/datetime'
import { getServiceOrder } from '@/services/serviceOrderService'
import { getCustomer } from '@/services/customerService'
import { getVehicle } from '@/services/vehicleService'
import { getCurrentTenant } from '@/services/tenantService'
import { SERVICE_STATUS_LABELS } from '@/types/serviceOrder'
import { VEHICLE_TYPE_LABELS } from '@/types/vehicle'

/**
 * Impressao detalhada da ordem de servico em formato de bobina termica (80mm),
 * pensado pra ser impresso via Ctrl+P do navegador direto na impressora do balcao.
 * Rota isolada (sem AppLayout) para que apenas o documento va para o papel.
 */
export function ReceiptPage() {
  const { id = '' } = useParams()

  const orderQuery = useQuery({ queryKey: ['service-order', id], queryFn: () => getServiceOrder(id) })
  const customerId = orderQuery.data?.customerId
  const vehicleId = orderQuery.data?.vehicleId

  const customerQuery = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => getCustomer(customerId!),
    enabled: !!customerId,
  })
  const vehicleQuery = useQuery({
    queryKey: ['vehicle', vehicleId],
    queryFn: () => getVehicle(vehicleId!),
    enabled: !!vehicleId,
  })
  const tenantQuery = useQuery({ queryKey: ['tenant-me'], queryFn: getCurrentTenant })

  const order = orderQuery.data
  const customer = customerQuery.data
  const vehicle = vehicleQuery.data
  const tenant = tenantQuery.data
  const ready = !!order && !!customer && !!vehicle && !!tenant

  // Dispara a impressao automaticamente assim que o documento terminar de renderizar.
  useEffect(() => {
    if (!ready) return
    const timer = setTimeout(() => window.print(), 300)
    return () => clearTimeout(timer)
  }, [ready])

  if (orderQuery.isError) {
    return <p className="p-6 text-center text-sm text-red-500">{getApiErrorMessage(orderQuery.error)}</p>
  }
  if (!ready) {
    return <p className="p-6 text-center text-sm text-slate-500">Carregando…</p>
  }

  const remaining = Math.max(order.total - order.paidTotal, 0)

  const vehicleDetails = [
    VEHICLE_TYPE_LABELS[vehicle.type],
    [vehicle.manufacturer, vehicle.model].filter(Boolean).join(' ') || null,
    vehicle.color,
    vehicle.year ? String(vehicle.year) : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="min-h-screen bg-slate-100 py-6 print:bg-white print:py-0 dark:bg-slate-950">
      <style>{'@page { size: 80mm auto; margin: 4mm; }'}</style>

      <div className="mx-auto mb-4 flex w-[320px] justify-between px-1 print:hidden">
        <Link to={`/ordens/${id}`} className="text-sm text-indigo-600 hover:underline">
          ← Voltar
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-md bg-indigo-600 px-3 py-1 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Imprimir
        </button>
      </div>

      <div className="mx-auto w-[320px] bg-white p-3 font-mono text-[11px] leading-tight text-black shadow print:w-auto print:shadow-none">
        <header className="text-center">
          <p className="text-sm font-bold uppercase">{tenant.name}</p>
          <p>{formatDocument(tenant.document)}</p>
        </header>

        <Divider />
        <p className="text-center font-semibold">ORDEM DE SERVIÇO</p>
        <Row label="Número" value={`#${order.id.slice(0, 8)}`} />
        <Row label="Status" value={SERVICE_STATUS_LABELS[order.status]} />
        <Row label="Aberta em" value={formatDateTimeBR(order.createdAt)} />
        {order.finishedAt && <Row label="Finalizada em" value={formatDateTimeBR(order.finishedAt)} />}

        <Divider />
        <p className="font-semibold">Cliente</p>
        <p>{customer.name}</p>
        {customer.phone && <p>Tel.: {formatPhone(customer.phone)}</p>}
        {customer.document && <p>CPF/CNPJ: {formatDocument(customer.document)}</p>}

        <Divider />
        <p className="font-semibold">Veículo</p>
        {vehicleDetails && <p>{vehicleDetails}</p>}
        {vehicle.plate && <p>Placa: {formatPlate(vehicle.plate)}</p>}
        {vehicle.nickname && <p>Apelido: {vehicle.nickname}</p>}
        {vehicle.identifier && <p>Identificador: {vehicle.identifier}</p>}

        {order.observations && (
          <>
            <Divider />
            <p className="font-semibold">Observações</p>
            <p className="whitespace-pre-wrap">{order.observations}</p>
          </>
        )}

        <Divider />
        <p className="font-semibold">Itens</p>
        {order.items.length === 0 ? (
          <p>Nenhum item lançado.</p>
        ) : (
          order.items.map((item) => (
            <div key={item.id} className="mb-1">
              <div className="flex justify-between gap-2">
                <span>{item.name}</span>
                <span className="whitespace-nowrap">{formatCurrency(item.finalPrice)}</span>
              </div>
              <div className="text-[10px] text-slate-600">
                {formatCurrency(item.unitPrice)} x{item.quantity}
                {item.discount > 0 ? ` − desc. ${formatCurrency(item.discount)}/un.` : ''}
              </div>
            </div>
          ))
        )}

        <Divider />
        <Row label="Subtotal" value={formatCurrency(order.subtotal)} />
        {order.loyaltyRewardPercent > 0 && (
          <Row
            label={`Fidelidade (${order.loyaltyRewardPercent}%)`}
            value={`- ${formatCurrency(order.loyaltyDiscount)}`}
          />
        )}
        {order.serviceTax > 0 && (
          <Row label={`Taxa de serviço (${order.serviceTax}%)`} value={formatCurrency(order.taxAmount)} />
        )}
        <Row label="TOTAL" value={formatCurrency(order.total)} bold />

        <Divider />
        <p className="font-semibold">Pagamentos</p>
        {order.payments.length === 0 ? (
          <p>Nenhum pagamento registrado.</p>
        ) : (
          order.payments.map((p) => (
            <div key={p.id} className="flex justify-between gap-2">
              <span>
                {p.methodName}
                <span className="text-[10px] text-slate-600"> ({formatDateTimeBR(p.paidAt)})</span>
              </span>
              <span className="whitespace-nowrap">{formatCurrency(p.amount)}</span>
            </div>
          ))
        )}
        <Row label="Pago" value={formatCurrency(order.paidTotal)} />
        {remaining > 0 && <Row label="Saldo em aberto" value={formatCurrency(remaining)} bold />}

        <Divider />
        <p className="text-center">Impresso em {formatDateTimeBR(new Date().toISOString())}</p>
        <p className="text-center">Obrigado pela preferência!</p>
      </div>
    </div>
  )
}

function Divider() {
  return <div className="my-2 border-t border-dashed border-black" />
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between gap-2 ${bold ? 'font-bold' : ''}`}>
      <span>{label}</span>
      <span className="whitespace-nowrap">{value}</span>
    </div>
  )
}
