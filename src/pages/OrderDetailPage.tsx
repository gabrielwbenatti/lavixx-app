import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/lib/toastContext'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Field } from '@/components/ui/Field'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { PaymentBadge } from '@/components/ui/PaymentBadge'
import { getApiErrorMessage } from '@/lib/api'
import { formatCurrency, formatPlate } from '@/lib/format'
import { formatTime } from '@/lib/datetime'
import { describeVehicle } from '@/lib/describe'
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
  updateServiceOrderItem,
  updateServiceOrderStatus,
} from '@/services/serviceOrderService'
import { listServices } from '@/services/serviceService'
import { listVehicles } from '@/services/vehicleService'
import { listCustomers } from '@/services/customerService'
import { listPaymentMethods } from '@/services/paymentMethodService'
import {
  EDITABLE_STATUSES,
  SERVICE_STATUS_LABELS,
  STATUS_TRANSITIONS,
  type ServiceOrderItemResponse,
  type ServiceStatus,
} from '@/types/serviceOrder'
import type { PaymentResponse } from '@/types/payment'

const ACTION_LABELS: Partial<Record<ServiceStatus, string>> = {
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

  const orderQuery = useQuery({ queryKey: ['service-order', id], queryFn: () => getServiceOrder(id) })
  const servicesQuery = useQuery({ queryKey: ['services'], queryFn: listServices })
  const vehiclesQuery = useQuery({ queryKey: ['vehicles'], queryFn: listVehicles })
  const customersQuery = useQuery({ queryKey: ['customers'], queryFn: listCustomers })
  const paymentMethodsQuery = useQuery({
    queryKey: ['payment-methods'],
    queryFn: listPaymentMethods,
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
  }

  const addItemMutation = useMutation({
    mutationFn: (form: OrderItemFormOutput) =>
      addServiceOrderItem(id, {
        serviceId: form.serviceId,
        quantity: form.quantity,
        discount: form.discount,
      }),
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
      addServiceOrderPayment(id, { paymentMethodId: form.paymentMethodId, amount: form.amount }),
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

  if (orderQuery.isLoading) {
    return <p className="text-sm text-slate-500">Carregando…</p>
  }
  if (orderQuery.isError || !orderQuery.data) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="text-sm text-red-500">{getApiErrorMessage(orderQuery.error)}</p>
        <Link to="/ordens" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">
          ← Voltar para ordens
        </Link>
      </div>
    )
  }

  const order = orderQuery.data
  const editable = EDITABLE_STATUSES.includes(order.status)
  const customerName = customersQuery.data?.find((c) => c.id === order.customerId)?.name
  const vehicle = vehiclesQuery.data?.find((v) => v.id === order.vehicleId)

  const openAdd = () => {
    setItemError(null)
    addForm.reset({ serviceId: '', quantity: '1', discount: '' })
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
    setPayOpen(true)
  }

  const handleRemovePayment = (payment: PaymentResponse) => {
    if (window.confirm(`Remover o pagamento de ${formatCurrency(payment.amount)} (${payment.methodName})?`)) {
      removePaymentMutation.mutate(payment.id)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
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
            <p className="mt-1 text-xs text-slate-400">
              Aberta em {new Date(order.createdAt).toLocaleString('pt-BR')}
              {order.finishedAt
                ? ` · Finalizada em ${new Date(order.finishedAt).toLocaleString('pt-BR')}`
                : ''}
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
          {order.status === 'waiting' && (
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

      {/* Itens */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">Itens</h2>
          {editable && (
            <Button className="h-9 px-3" onClick={openAdd}>
              Adicionar item
            </Button>
          )}
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
            <tfoot>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <td
                  className="px-4 py-3 text-right font-medium text-slate-500"
                  colSpan={editable ? 4 : 4}
                >
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
                  <div className="text-xs text-slate-400">{formatTime(p.paidAt)}</div>
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
          <Field label="Serviço" htmlFor="serviceId" error={addForm.formState.errors.serviceId?.message}>
            <Select
              id="serviceId"
              invalid={!!addForm.formState.errors.serviceId}
              {...addForm.register('serviceId')}
            >
              <option value="">Selecione…</option>
              {servicesQuery.data?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {formatCurrency(s.price)}
                </option>
              ))}
            </Select>
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
