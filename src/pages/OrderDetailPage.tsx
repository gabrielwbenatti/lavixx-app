import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Printer } from 'lucide-react'
import { useToast } from '@/lib/toastContext'
import { isAdmin } from '@/lib/auth'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Field } from '@/components/ui/Field'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { Textarea } from '@/components/ui/Textarea'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { PaymentBadge } from '@/components/ui/PaymentBadge'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { CatalogSearch } from '@/components/CatalogSearch'
import { getApiErrorMessage } from '@/lib/api'
import { formatCurrency, formatPlate } from '@/lib/format'
import { formatDateTimeBR, toDateTimeLocalInput } from '@/lib/datetime'
import { describeVehicle } from '@/lib/describe'
import { buildCarReadyWhatsAppLink } from '@/lib/whatsapp'
import {
  orderItemSchema,
  editItemSchema,
  type OrderItemFormInput,
  type OrderItemFormOutput,
  type EditItemFormInput,
  type EditItemFormOutput,
} from '@/lib/schemas/serviceOrderSchemas'
import {
  paymentSchema,
  type PaymentFormInput,
  type PaymentFormOutput,
} from '@/lib/schemas/paymentSchema'
import {
  addServiceOrderItem,
  addServiceOrderPayment,
  deleteServiceOrder,
  getServiceOrder,
  removeServiceOrderItem,
  removeServiceOrderPayment,
  removeServiceOrderLoyalty,
  redeemServiceOrderLoyalty,
  updateServiceOrderFinishedAt,
  updateServiceOrderIssuedAt,
  updateServiceOrderItem,
  updateServiceOrderObservations,
  updateServiceOrderPaymentDate,
  updateServiceOrderPickupEstimate,
  updateServiceOrderStatus,
  updateServiceOrderTax,
} from '@/services/serviceOrderService'
import { listServices } from '@/services/serviceService'
import { listProducts } from '@/services/productService'
import { getCustomerLoyalty } from '@/services/customerService'
import { listPaymentMethods } from '@/services/paymentMethodService'
import { getCurrentTenant } from '@/services/tenantService'
import {
  DELETABLE_STATUSES,
  EDITABLE_STATUSES,
  SERVICE_STATUS_LABELS,
  STATUS_TRANSITIONS,
  type ServiceOrderItemResponse,
  type ServiceStatus,
} from '@/types/serviceOrder'
import type { PaymentResponse } from '@/types/payment'

const ACTION_LABELS: Partial<Record<ServiceStatus, string>> = {
  waiting: 'Cliente chegou',
  in_progress: 'Iniciar',
  done: 'Concluir',
  cancelled: 'Cancelar ordem',
}

export function OrderDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  const [addOpen, setAddOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ServiceOrderItemResponse | null>(null)
  const [itemError, setItemError] = useState<string | null>(null)
  const [pageError, setPageError] = useState<string | null>(null)
  const [payOpen, setPayOpen] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)
  const [taxOpen, setTaxOpen] = useState(false)
  const [taxValue, setTaxValue] = useState('')
  const [taxError, setTaxError] = useState<string | null>(null)
  const [obsOpen, setObsOpen] = useState(false)
  const [obsValue, setObsValue] = useState('')
  const [obsError, setObsError] = useState<string | null>(null)
  const [pickupOpen, setPickupOpen] = useState(false)
  const [pickupValue, setPickupValue] = useState('')
  const [pickupError, setPickupError] = useState<string | null>(null)
  const [datesOpen, setDatesOpen] = useState(false)
  const [issuedAtValue, setIssuedAtValue] = useState('')
  const [finishedAtValue, setFinishedAtValue] = useState('')
  const [datesError, setDatesError] = useState<string | null>(null)
  const [editingPayment, setEditingPayment] = useState<PaymentResponse | null>(null)
  const [paymentDateValue, setPaymentDateValue] = useState('')
  const [paymentDateError, setPaymentDateError] = useState<string | null>(null)
  const [payDateValue, setPayDateValue] = useState('')

  const orderQuery = useQuery({ queryKey: ['service-order', id], queryFn: () => getServiceOrder(id) })
  const servicesQuery = useQuery({ queryKey: ['services'], queryFn: listServices })
  const productsQuery = useQuery({ queryKey: ['products'], queryFn: listProducts })
  const paymentMethodsQuery = useQuery({
    queryKey: ['payment-methods'],
    queryFn: listPaymentMethods,
  })
  const tenantQuery = useQuery({ queryKey: ['tenant-me'], queryFn: getCurrentTenant })
  const loyaltyQuery = useQuery({
    queryKey: ['customer-loyalty', orderQuery.data?.customerId],
    queryFn: () => getCustomerLoyalty(orderQuery.data!.customerId),
    enabled: !!orderQuery.data?.customerId,
  })

  const addForm = useForm<OrderItemFormInput, unknown, OrderItemFormOutput>({
    resolver: zodResolver(orderItemSchema),
  })
  const editForm = useForm<EditItemFormInput, unknown, EditItemFormOutput>({
    resolver: zodResolver(editItemSchema),
  })
  const payForm = useForm<PaymentFormInput, unknown, PaymentFormOutput>({
    resolver: zodResolver(paymentSchema),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['service-order', id] })
    queryClient.invalidateQueries({ queryKey: ['service-orders'] })
    queryClient.invalidateQueries({ queryKey: ['customer-loyalty'] })
  }

  const addItemMutation = useMutation({
    mutationFn: (form: OrderItemFormOutput) => {
      const [kind, refId] = form.catalogRef.split(':')
      return addServiceOrderItem(id, {
        ...(kind === 'product' ? { productId: refId } : { serviceId: refId }),
        quantity: form.quantity,
        discount: form.discount,
      })
    },
    onSuccess: () => {
      invalidate()
      setAddOpen(false)
      addToast('Item adicionado à ordem', 'success')
    },
    onError: (err) => setItemError(getApiErrorMessage(err)),
  })

  const editItemMutation = useMutation({
    mutationFn: (form: EditItemFormOutput) =>
      updateServiceOrderItem(id, editingItem!.id, {
        quantity: form.quantity,
        discount: form.discount,
      }),
    onSuccess: () => {
      invalidate()
      setEditingItem(null)
    },
    onError: (err) => setItemError(getApiErrorMessage(err)),
  })

  const removeItemMutation = useMutation({
    mutationFn: (itemId: string) => removeServiceOrderItem(id, itemId),
    onSuccess: () => {
      invalidate()
      addToast('Item removido', 'success')
    },
    onError: (err) => window.alert(getApiErrorMessage(err)),
  })

  const statusMutation = useMutation({
    mutationFn: (status: ServiceStatus) => updateServiceOrderStatus(id, status),
    onSuccess: (order) => {
      invalidate()
      addToast(`Ordem movida para '${order.status}'`, 'success')
    },
    onError: (err) => setPageError(getApiErrorMessage(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteServiceOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-orders'] })
      navigate('/ordens', { replace: true })
    },
    onError: (err) => setPageError(getApiErrorMessage(err)),
  })

  const addPaymentMutation = useMutation({
    mutationFn: (form: PaymentFormOutput) =>
      addServiceOrderPayment(id, {
        paymentMethodId: form.paymentMethodId,
        amount: form.amount,
        ...(isAdmin() && payDateValue ? { paidAt: new Date(payDateValue).toISOString() } : {}),
      }),
    onSuccess: () => {
      invalidate()
      setPayOpen(false)
      addToast('Pagamento registrado', 'success')
    },
    onError: (err) => setPayError(getApiErrorMessage(err)),
  })

  const removePaymentMutation = useMutation({
    mutationFn: (paymentId: string) => removeServiceOrderPayment(id, paymentId),
    onSuccess: invalidate,
    onError: (err) => window.alert(getApiErrorMessage(err)),
  })

  const taxMutation = useMutation({
    mutationFn: (serviceTax: number) => updateServiceOrderTax(id, serviceTax),
    onSuccess: () => {
      invalidate()
      setTaxOpen(false)
      addToast('Taxa de serviço atualizada', 'success')
    },
    onError: (err) => setTaxError(getApiErrorMessage(err)),
  })

  const obsMutation = useMutation({
    mutationFn: (observations: string) => updateServiceOrderObservations(id, observations),
    onSuccess: () => {
      invalidate()
      setObsOpen(false)
      addToast('Observações atualizadas', 'success')
    },
    onError: (err) => setObsError(getApiErrorMessage(err)),
  })

  const pickupMutation = useMutation({
    mutationFn: (estimatedPickupAt: string | null) =>
      updateServiceOrderPickupEstimate(id, estimatedPickupAt),
    onSuccess: () => {
      invalidate()
      setPickupOpen(false)
      addToast('Previsão de retirada atualizada', 'success')
    },
    onError: (err) => setPickupError(getApiErrorMessage(err)),
  })

  const datesMutation = useMutation({
    mutationFn: async ({ issuedAt, finishedAt }: { issuedAt: string; finishedAt: string | null }) => {
      await updateServiceOrderIssuedAt(id, issuedAt)
      if (finishedAt) {
        await updateServiceOrderFinishedAt(id, finishedAt)
      }
    },
    onSuccess: () => {
      invalidate()
      setDatesOpen(false)
      addToast('Datas da ordem atualizadas', 'success')
    },
    onError: (err) => setDatesError(getApiErrorMessage(err)),
  })

  const paymentDateMutation = useMutation({
    mutationFn: ({ paymentId, paidAt }: { paymentId: string; paidAt: string }) =>
      updateServiceOrderPaymentDate(id, paymentId, paidAt),
    onSuccess: () => {
      invalidate()
      setEditingPayment(null)
      addToast('Data do pagamento atualizada', 'success')
    },
    onError: (err) => setPaymentDateError(getApiErrorMessage(err)),
  })

  const redeemLoyaltyMutation = useMutation({
    mutationFn: () => redeemServiceOrderLoyalty(id),
    onSuccess: () => {
      invalidate()
      addToast('Prêmio de fidelidade aplicado', 'success')
    },
    onError: (err) => setPageError(getApiErrorMessage(err)),
  })

  const removeLoyaltyMutation = useMutation({
    mutationFn: () => removeServiceOrderLoyalty(id),
    onSuccess: invalidate,
    onError: (err) => setPageError(getApiErrorMessage(err)),
  })

  if (orderQuery.isLoading) {
    return <p className="text-sm text-slate-500">Carregando…</p>
  }
  if (orderQuery.isError || !orderQuery.data) {
    return (
      <div>
        <p className="text-sm text-red-500">{getApiErrorMessage(orderQuery.error)}</p>
        <Link to="/ordens" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">
          ← Voltar para ordens
        </Link>
      </div>
    )
  }

  const order = orderQuery.data
  const editable = EDITABLE_STATUSES.includes(order.status)
  const customer = order.customer
  const customerName = customer.name
  const vehicle = order.vehicle

  const whatsappLink =
    order.status !== 'cancelled'
      ? buildCarReadyWhatsAppLink({
          phone: customer?.phone,
          customerName: customer?.name,
          vehicle,
          establishmentName: tenantQuery.data?.name,
          items: order.items,
        })
      : null

  const openAdd = () => {
    setItemError(null)
    addForm.reset({ catalogRef: '', quantity: '1', discount: '' })
    setAddOpen(true)
  }

  const openEdit = (item: ServiceOrderItemResponse) => {
    setItemError(null)
    editForm.reset({ quantity: String(item.quantity), discount: item.discount ? String(item.discount) : '' })
    setEditingItem(item)
  }

  const handleRemove = (item: ServiceOrderItemResponse) => {
    if (window.confirm(`Remover o item "${item.name}"?`)) {
      removeItemMutation.mutate(item.id)
    }
  }

  const handleDeleteOrder = () => {
    if (window.confirm('Excluir esta ordem de serviço? Esta ação não pode ser desfeita.')) {
      deleteMutation.mutate()
    }
  }

  const remaining = Math.max(order.total - order.paidTotal, 0)
  const activeMethods = paymentMethodsQuery.data?.filter((m) => m.active) ?? []

  const openPay = () => {
    setPayError(null)
    payForm.reset({
      paymentMethodId: activeMethods[0]?.id ?? '',
      amount: remaining > 0 ? String(remaining.toFixed(2)) : '',
    })
    setPayDateValue(toDateTimeLocalInput(new Date().toISOString()))
    setPayOpen(true)
  }

  const openEditPaymentDate = (payment: PaymentResponse) => {
    setPaymentDateError(null)
    setPaymentDateValue(toDateTimeLocalInput(payment.paidAt))
    setEditingPayment(payment)
  }

  const submitEditPaymentDate = () => {
    if (!paymentDateValue) {
      setPaymentDateError('Informe data e hora')
      return
    }
    setPaymentDateError(null)
    paymentDateMutation.mutate({
      paymentId: editingPayment!.id,
      paidAt: new Date(paymentDateValue).toISOString(),
    })
  }

  const handleRemovePayment = (payment: PaymentResponse) => {
    if (window.confirm(`Remover o pagamento de ${formatCurrency(payment.amount)} (${payment.methodName})?`)) {
      removePaymentMutation.mutate(payment.id)
    }
  }

  const canEditTax = order.status !== 'cancelled'

  const openTax = () => {
    setTaxError(null)
    setTaxValue(String(order.serviceTax ?? 0))
    setTaxOpen(true)
  }

  const openObs = () => {
    setObsError(null)
    setObsValue(order.observations ?? '')
    setObsOpen(true)
  }

  const openPickup = () => {
    setPickupError(null)
    setPickupValue(order.estimatedPickupAt ? toDateTimeLocalInput(order.estimatedPickupAt) : '')
    setPickupOpen(true)
  }

  const submitPickup = () => {
    if (!pickupValue) {
      setPickupError('Informe data e hora')
      return
    }
    setPickupError(null)
    pickupMutation.mutate(new Date(pickupValue).toISOString())
  }

  const openDates = () => {
    setDatesError(null)
    setIssuedAtValue(toDateTimeLocalInput(order.issuedAt))
    setFinishedAtValue(order.finishedAt ? toDateTimeLocalInput(order.finishedAt) : '')
    setDatesOpen(true)
  }

  const submitDates = () => {
    if (!issuedAtValue) {
      setDatesError('Informe a data de emissão')
      return
    }
    if (order.finishedAt && !finishedAtValue) {
      setDatesError('Informe a data de finalização')
      return
    }
    setDatesError(null)
    datesMutation.mutate({
      issuedAt: new Date(issuedAtValue).toISOString(),
      finishedAt: order.finishedAt ? new Date(finishedAtValue).toISOString() : null,
    })
  }

  const submitTax = () => {
    const parsed = Number(taxValue.replace(',', '.'))
    if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) {
      setTaxError('Informe uma taxa entre 0 e 100')
      return
    }
    setTaxError(null)
    taxMutation.mutate(parsed)
  }

  return (
    <div>
      <Link to="/ordens" className="mb-4 inline-block text-sm text-indigo-600 hover:underline">
        ← Voltar para ordens
      </Link>

      {pageError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {pageError}
        </div>
      )}

      {/* Cabeçalho: cliente/veículo + status */}
      <Card className="mb-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {customerName ?? 'Cliente'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {vehicle ? describeVehicle(vehicle) : 'Veículo'}
              {vehicle?.plate ? ` · ${formatPlate(vehicle.plate)}` : ''}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
              <span>
                {order.status === 'scheduled' && order.scheduledAt
                  ? `Agendada para ${formatDateTimeBR(order.scheduledAt)}`
                  : `Aberta em ${formatDateTimeBR(order.issuedAt)}`}
                {order.finishedAt ? ` · Finalizada em ${formatDateTimeBR(order.finishedAt)}` : ''}
              </span>
              {isAdmin() && order.status !== 'scheduled' && (
                <button
                  type="button"
                  onClick={openDates}
                  className="text-slate-400 hover:text-indigo-600"
                  title="Editar datas (admin)"
                >
                  <Pencil size={12} />
                </button>
              )}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <StatusBadge status={order.status} />
            <PaymentBadge status={order.paymentStatus} />
          </div>
        </div>

        {/* Ações de status */}
        <div className="mt-4 flex flex-wrap gap-2">
          {STATUS_TRANSITIONS[order.status].map((target) => (
            <Button
              key={target}
              variant={target === 'cancelled' ? 'outline' : 'primary'}
              className={target === 'cancelled' ? 'text-red-600' : undefined}
              disabled={statusMutation.isPending}
              onClick={() => {
                setPageError(null)
                statusMutation.mutate(target)
              }}
            >
              {ACTION_LABELS[target] ?? SERVICE_STATUS_LABELS[target]}
            </Button>
          ))}
          {order.status !== 'scheduled' && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => window.open(`/ordens/${id}/recibo`, '_blank')}
            >
              <Printer size={16} />
              Imprimir
            </Button>
          )}
          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Avisar no WhatsApp
            </a>
          )}
          {DELETABLE_STATUSES.includes(order.status) && (
            <Button
              variant="ghost"
              className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
              disabled={deleteMutation.isPending}
              onClick={handleDeleteOrder}
            >
              Excluir ordem
            </Button>
          )}
        </div>
      </Card>

      {/* Prêmio de fidelidade disponível */}
      {loyaltyQuery.data?.enabled &&
        loyaltyQuery.data.rewardsAvailable > 0 &&
        order.loyaltyRewardPercent === 0 &&
        order.status !== 'cancelled' && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
              {'\u{1F389}'} Cliente tem prêmio de fidelidade disponível
              {loyaltyQuery.data.rewardPercent >= 100
                ? ' (lavagem grátis)'
                : ` (${loyaltyQuery.data.rewardPercent}% de desconto)`}
              .
            </p>
            <Button
              className="h-9 px-3"
              disabled={redeemLoyaltyMutation.isPending}
              onClick={() => {
                setPageError(null)
                redeemLoyaltyMutation.mutate()
              }}
            >
              {redeemLoyaltyMutation.isPending ? 'Aplicando…' : 'Aplicar prêmio'}
            </Button>
          </div>
        )}

      {/* Observações */}
      <Card className="mb-4 p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">Observações</h2>
          <Button variant="outline" className="h-9 px-3" onClick={openObs}>
            {order.observations ? 'Editar' : 'Adicionar'}
          </Button>
        </div>
        {order.observations ? (
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">
            {order.observations}
          </p>
        ) : (
          <p className="mt-2 text-sm text-slate-400">Nenhuma observação registrada.</p>
        )}
      </Card>

      {/* Previsão de retirada */}
      {order.status !== 'cancelled' && (
        <Card className="mb-4 p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">Previsão de retirada</h2>
            <Button variant="outline" className="h-9 px-3" onClick={openPickup}>
              {order.estimatedPickupAt ? 'Editar' : 'Informar'}
            </Button>
          </div>
          {order.estimatedPickupAt ? (
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Cliente volta em {formatDateTimeBR(order.estimatedPickupAt)}
            </p>
          ) : (
            <p className="mt-2 text-sm text-slate-400">Nenhuma previsão registrada.</p>
          )}
        </Card>
      )}

      {/* Itens */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">Itens</h2>
          <div className="flex gap-2">
            {canEditTax && (
              <Button variant="outline" className="h-9 px-3" onClick={openTax}>
                {order.serviceTax > 0 ? `Taxa ${order.serviceTax}%` : 'Adicionar taxa'}
              </Button>
            )}
            {editable && (
              <Button className="h-9 px-3" onClick={openAdd}>
                Adicionar item
              </Button>
            )}
          </div>
        </div>

        {order.items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            {editable
              ? 'Nenhum item ainda. Clique em “Adicionar item”.'
              : 'Esta ordem não possui itens.'}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-2 font-medium">Serviço</th>
                <th className="hidden px-4 py-2 font-medium sm:table-cell">Unit.</th>
                <th className="hidden px-4 py-2 font-medium sm:table-cell">Desc./un.</th>
                <th className="hidden px-4 py-2 font-medium sm:table-cell">Qtd</th>
                <th className="px-4 py-2 font-medium">Subtotal</th>
                {editable && <th className="px-4 py-2" />}
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                >
                  <td className="px-4 py-2 font-medium text-slate-800 dark:text-slate-100">
                    {item.name}
                    <div className="mt-0.5 text-xs font-normal text-slate-400 sm:hidden">
                      {formatCurrency(item.unitPrice)}
                      {item.quantity > 1 && ` × ${item.quantity}`}
                      {item.discount > 0 && ` − ${formatCurrency(item.discount)}/un.`}
                    </div>
                  </td>
                  <td className="hidden px-4 py-2 text-slate-600 dark:text-slate-300 sm:table-cell">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="hidden px-4 py-2 text-slate-600 dark:text-slate-300 sm:table-cell">
                    {item.discount > 0 ? formatCurrency(item.discount) : '—'}
                  </td>
                  <td className="hidden px-4 py-2 text-slate-600 dark:text-slate-300 sm:table-cell">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-2 font-medium text-slate-800 dark:text-slate-100">
                    {formatCurrency(item.finalPrice)}
                  </td>
                  {editable && (
                    <td className="px-4 py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" className="h-8 px-2" onClick={() => openEdit(item)}>
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          className="h-8 px-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                          onClick={() => handleRemove(item)}
                        >
                          Remover
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 dark:bg-slate-800/50">
              {(order.serviceTax > 0 || order.loyaltyRewardPercent > 0) && (
                <tr>
                  <td className="px-4 pt-3 text-right text-slate-500" colSpan={4}>
                    Subtotal
                  </td>
                  <td className="px-4 pt-3 text-slate-700 dark:text-slate-200" colSpan={editable ? 2 : 1}>
                    {formatCurrency(order.subtotal)}
                  </td>
                </tr>
              )}
              {order.loyaltyRewardPercent > 0 && (
                <tr>
                  <td className="px-4 py-1 text-right text-slate-500" colSpan={4}>
                    <span className="inline-flex items-center gap-2">
                      Fidelidade ({order.loyaltyRewardPercent}%)
                      {order.status !== 'cancelled' && (
                        <button
                          type="button"
                          onClick={() => removeLoyaltyMutation.mutate()}
                          className="rounded border border-slate-300 px-1.5 py-0.5 text-xs text-slate-500 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
                        >
                          Remover
                        </button>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-1 text-emerald-700 dark:text-emerald-400" colSpan={editable ? 2 : 1}>
                    − {formatCurrency(order.loyaltyDiscount)}
                  </td>
                </tr>
              )}
              {order.serviceTax > 0 && (
                <tr>
                  <td className="px-4 py-1 text-right text-slate-500" colSpan={4}>
                    Taxa de serviço ({order.serviceTax}%)
                  </td>
                  <td className="px-4 py-1 text-slate-700 dark:text-slate-200" colSpan={editable ? 2 : 1}>
                    {formatCurrency(order.taxAmount)}
                  </td>
                </tr>
              )}
              <tr>
                <td className="px-4 py-3 text-right font-medium text-slate-500" colSpan={4}>
                  Total
                </td>
                <td
                  className="px-4 py-3 font-bold text-slate-900 dark:text-white"
                  colSpan={editable ? 2 : 1}
                >
                  {formatCurrency(order.total)}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </Card>

      {/* Pagamentos */}
      <Card className="mt-4 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">Pagamentos</h2>
          {order.status !== 'cancelled' && (
            <Button
              className="h-9 px-3"
              disabled={activeMethods.length === 0}
              onClick={openPay}
            >
              Registrar pagamento
            </Button>
          )}
        </div>

        {/* Resumo financeiro */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 text-center dark:divide-slate-800 dark:border-slate-800">
          <div className="px-2 py-3">
            <div className="text-xs text-slate-400">Total</div>
            <div className="font-semibold text-slate-800 dark:text-slate-100">
              {formatCurrency(order.total)}
            </div>
          </div>
          <div className="px-2 py-3">
            <div className="text-xs text-slate-400">Pago</div>
            <div className="font-semibold text-green-700 dark:text-green-400">
              {formatCurrency(order.paidTotal)}
            </div>
          </div>
          <div className="px-2 py-3">
            <div className="text-xs text-slate-400">Falta</div>
            <div className="font-semibold text-red-600 dark:text-red-400">
              {formatCurrency(remaining)}
            </div>
          </div>
        </div>

        {order.payments.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Nenhum pagamento registrado.
          </p>
        ) : (
          <ul>
            {order.payments.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between border-b border-slate-100 px-4 py-3 last:border-0 dark:border-slate-800"
              >
                <div>
                  <div className="font-medium text-slate-800 dark:text-slate-100">{p.methodName}</div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    {formatDateTimeBR(p.paidAt)}
                    {isAdmin() && (
                      <button
                        type="button"
                        onClick={() => openEditPaymentDate(p)}
                        className="text-slate-400 hover:text-indigo-600"
                        title="Editar data (admin)"
                      >
                        <Pencil size={11} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium text-slate-800 dark:text-slate-100">
                    {formatCurrency(p.amount)}
                  </span>
                  <Button
                    variant="ghost"
                    className="h-8 px-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                    onClick={() => handleRemovePayment(p)}
                  >
                    Remover
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Dialog: ajustar taxa de serviço */}
      <Dialog
        open={taxOpen}
        onClose={() => setTaxOpen(false)}
        title="Taxa de serviço"
        description="Percentual aplicado sobre o subtotal desta ordem. Deixe 0 para não cobrar taxa."
      >
        {taxError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {taxError}
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            submitTax()
          }}
          className="flex flex-col gap-4"
          noValidate
        >
          <Field label="Taxa (%)" htmlFor="serviceTax">
            <Input
              id="serviceTax"
              inputMode="decimal"
              placeholder="0"
              value={taxValue}
              onChange={(e) => setTaxValue(e.target.value)}
            />
          </Field>
          <div className="mt-2 flex justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
              disabled={taxMutation.isPending}
              onClick={() => taxMutation.mutate(0)}
            >
              Remover taxa
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setTaxOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={taxMutation.isPending}>
                {taxMutation.isPending ? 'Salvando…' : 'Salvar'}
              </Button>
            </div>
          </div>
        </form>
      </Dialog>

      {/* Dialog: observações */}
      <Dialog
        open={obsOpen}
        onClose={() => setObsOpen(false)}
        title="Observações"
        description="Anotações livres sobre esta ordem (avarias, pedidos do cliente, etc.)."
      >
        {obsError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {obsError}
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setObsError(null)
            obsMutation.mutate(obsValue)
          }}
          className="flex flex-col gap-4"
          noValidate
        >
          <Textarea
            autoFocus
            rows={4}
            maxLength={1000}
            placeholder="Ex.: Riscado no para-choque; cliente pediu cuidado com o vidro."
            value={obsValue}
            onChange={(e) => setObsValue(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setObsOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={obsMutation.isPending}>
              {obsMutation.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Dialog: previsão de retirada */}
      <Dialog
        open={pickupOpen}
        onClose={() => setPickupOpen(false)}
        title="Previsão de retirada"
        description="Quando o cliente disse que vem buscar o veículo."
      >
        {pickupError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {pickupError}
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            submitPickup()
          }}
          className="flex flex-col gap-4"
          noValidate
        >
          <Field label="Data e hora" htmlFor="pickupAt">
            <Input
              id="pickupAt"
              type="datetime-local"
              value={pickupValue}
              onChange={(e) => setPickupValue(e.target.value)}
            />
          </Field>
          <div className="mt-2 flex justify-between gap-2">
            {order.estimatedPickupAt && (
              <Button
                type="button"
                variant="ghost"
                className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                disabled={pickupMutation.isPending}
                onClick={() => pickupMutation.mutate(null)}
              >
                Remover previsão
              </Button>
            )}
            <div className="ml-auto flex gap-2">
              <Button type="button" variant="outline" onClick={() => setPickupOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pickupMutation.isPending}>
                {pickupMutation.isPending ? 'Salvando…' : 'Salvar'}
              </Button>
            </div>
          </div>
        </form>
      </Dialog>

      {/* Dialog: editar datas da OS (admin) */}
      <Dialog
        open={datesOpen}
        onClose={() => setDatesOpen(false)}
        title="Editar datas da OS"
        description="Uso administrativo — para lançamento retroativo de ordens antigas. Não afeta o registro de auditoria, só as datas usadas em telas e relatórios."
      >
        {datesError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {datesError}
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            submitDates()
          }}
          className="flex flex-col gap-4"
          noValidate
        >
          <Field label="Data de emissão" htmlFor="issuedAt">
            <Input
              id="issuedAt"
              type="datetime-local"
              value={issuedAtValue}
              onChange={(e) => setIssuedAtValue(e.target.value)}
            />
          </Field>
          {order.finishedAt && (
            <Field label="Data de finalização" htmlFor="finishedAtField">
              <Input
                id="finishedAtField"
                type="datetime-local"
                value={finishedAtValue}
                onChange={(e) => setFinishedAtValue(e.target.value)}
              />
            </Field>
          )}
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDatesOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={datesMutation.isPending}>
              {datesMutation.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Dialog: editar data de um pagamento (admin) */}
      <Dialog
        open={!!editingPayment}
        onClose={() => setEditingPayment(null)}
        title="Editar data do pagamento"
        description={editingPayment?.methodName}
      >
        {paymentDateError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {paymentDateError}
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            submitEditPaymentDate()
          }}
          className="flex flex-col gap-4"
          noValidate
        >
          <Field label="Data e hora" htmlFor="paymentDate">
            <Input
              id="paymentDate"
              type="datetime-local"
              value={paymentDateValue}
              onChange={(e) => setPaymentDateValue(e.target.value)}
            />
          </Field>
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setEditingPayment(null)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={paymentDateMutation.isPending}>
              {paymentDateMutation.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Dialog: registrar pagamento */}
      <Dialog open={payOpen} onClose={() => setPayOpen(false)} title="Registrar pagamento">
        {payError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {payError}
          </div>
        )}
        <form
          onSubmit={payForm.handleSubmit((form) => {
            setPayError(null)
            addPaymentMutation.mutate(form)
          })}
          className="flex flex-col gap-4"
          noValidate
        >
          <Field
            label="Forma de pagamento"
            htmlFor="paymentMethodId"
            error={payForm.formState.errors.paymentMethodId?.message}
          >
            <Select
              id="paymentMethodId"
              invalid={!!payForm.formState.errors.paymentMethodId}
              {...payForm.register('paymentMethodId')}
            >
              {activeMethods.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Valor (R$)"
            htmlFor="amount"
            error={payForm.formState.errors.amount?.message}
            hint={remaining > 0 ? `Falta ${formatCurrency(remaining)}` : undefined}
          >
            <Input
              id="amount"
              inputMode="decimal"
              placeholder="0,00"
              invalid={!!payForm.formState.errors.amount}
              {...payForm.register('amount')}
            />
          </Field>
          {isAdmin() && (
            <Field label="Data do pagamento (admin)" htmlFor="payDate">
              <Input
                id="payDate"
                type="datetime-local"
                value={payDateValue}
                onChange={(e) => setPayDateValue(e.target.value)}
              />
            </Field>
          )}
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setPayOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={addPaymentMutation.isPending}>
              {addPaymentMutation.isPending ? 'Registrando…' : 'Registrar'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Dialog: adicionar item */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} title="Adicionar item">
        {itemError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {itemError}
          </div>
        )}
        <form
          onSubmit={addForm.handleSubmit((form) => {
            setItemError(null)
            addItemMutation.mutate(form)
          })}
          className="flex flex-col gap-4"
          noValidate
        >
          <Field label="Serviço ou produto" htmlFor="catalogRef" error={addForm.formState.errors.catalogRef?.message}>
            <Controller
              control={addForm.control}
              name="catalogRef"
              render={({ field }) => (
                <CatalogSearch
                  key={addOpen ? 'open' : 'closed'}
                  services={servicesQuery.data ?? []}
                  products={productsQuery.data ?? []}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  invalid={!!addForm.formState.errors.catalogRef}
                  autoFocus
                />
              )}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Quantidade" htmlFor="quantity" error={addForm.formState.errors.quantity?.message}>
              <Input
                id="quantity"
                inputMode="numeric"
                invalid={!!addForm.formState.errors.quantity}
                {...addForm.register('quantity')}
              />
            </Field>
            <Field
              label="Desconto por unidade (R$)"
              htmlFor="discount"
              error={addForm.formState.errors.discount?.message}
            >
              <Input
                id="discount"
                inputMode="decimal"
                placeholder="0,00"
                invalid={!!addForm.formState.errors.discount}
                {...addForm.register('discount')}
              />
            </Field>
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={addItemMutation.isPending}>
              {addItemMutation.isPending ? 'Adicionando…' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Dialog: editar item */}
      <Dialog
        open={!!editingItem}
        onClose={() => setEditingItem(null)}
        title="Editar item"
        description={editingItem?.name}
      >
        {itemError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {itemError}
          </div>
        )}
        <form
          onSubmit={editForm.handleSubmit((form) => {
            setItemError(null)
            editItemMutation.mutate(form)
          })}
          className="flex flex-col gap-4"
          noValidate
        >
          <div className="grid grid-cols-2 gap-4">
            <Field label="Quantidade" htmlFor="editQuantity" error={editForm.formState.errors.quantity?.message}>
              <Input
                id="editQuantity"
                inputMode="numeric"
                invalid={!!editForm.formState.errors.quantity}
                {...editForm.register('quantity')}
              />
            </Field>
            <Field
              label="Desconto por unidade (R$)"
              htmlFor="editDiscount"
              error={editForm.formState.errors.discount?.message}
            >
              <Input
                id="editDiscount"
                inputMode="decimal"
                placeholder="0,00"
                invalid={!!editForm.formState.errors.discount}
                {...editForm.register('discount')}
              />
            </Field>
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setEditingItem(null)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={editItemMutation.isPending}>
              {editItemMutation.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
