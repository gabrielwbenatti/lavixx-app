import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Field } from '@/components/ui/Field'
import { Card } from '@/components/ui/Card'
import { getApiErrorMessage } from '@/lib/api'
import { formatCurrency, formatDocument, formatPlate } from '@/lib/format'
import { describeVehicle } from '@/lib/describe'
import { normalizePlate } from '@/lib/plate'
import { listVehicles, createVehicle } from '@/services/vehicleService'
import { listCustomers, createCustomer } from '@/services/customerService'
import { listServices } from '@/services/serviceService'
import { createServiceOrder, updateServiceOrderTax } from '@/services/serviceOrderService'
import { getCurrentTenant } from '@/services/tenantService'
import {
  VEHICLE_TYPES,
  VEHICLE_TYPE_LABELS,
  type VehicleResponse,
  type VehicleType,
} from '@/types/vehicle'

type Step = 'plate' | 'register' | 'services' | 'review' | 'done'

interface CartItem {
  serviceId: string
  name: string
  unitPrice: number
  quantity: number
}

const STEP_LABELS: Record<Exclude<Step, 'done'>, string> = {
  plate: 'Placa',
  register: 'Cadastro',
  services: 'Serviços',
  review: 'Revisão',
}
const STEP_ORDER: Array<Exclude<Step, 'done'>> = ['plate', 'register', 'services', 'review']

export function AtendimentoPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [step, setStep] = useState<Step>('plate')
  const [plateQuery, setPlateQuery] = useState('')
  const [vehicle, setVehicle] = useState<VehicleResponse | null>(null)
  const [customerName, setCustomerName] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [taxEnabled, setTaxEnabled] = useState(true)
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null)

  const vehiclesQuery = useQuery({ queryKey: ['vehicles'], queryFn: listVehicles })
  const customersQuery = useQuery({ queryKey: ['customers'], queryFn: listCustomers })
  const servicesQuery = useQuery({ queryKey: ['services'], queryFn: listServices })
  const tenantQuery = useQuery({ queryKey: ['tenant-settings'], queryFn: getCurrentTenant })

  const customerNameById = useMemo(() => {
    const map = new Map<string, string>()
    customersQuery.data?.forEach((c) => map.set(c.id, c.name))
    return map
  }, [customersQuery.data])

  const cartTotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
  const defaultTax = tenantQuery.data?.defaultServiceTax ?? 0
  const effectiveTax = taxEnabled ? defaultTax : 0
  const taxAmount = Math.round(cartTotal * effectiveTax) / 100
  const grandTotal = cartTotal + taxAmount

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    queryClient.invalidateQueries({ queryKey: ['customers'] })
    queryClient.invalidateQueries({ queryKey: ['service-orders'] })
  }

  // ---- Passo 1: busca por placa ----
  const plateMatches = useMemo(() => {
    const q = normalizePlate(plateQuery)
    if (q.length < 3) return []
    return (vehiclesQuery.data ?? [])
      .filter((v) => v.plate && normalizePlate(v.plate).includes(q))
      .slice(0, 6)
  }, [plateQuery, vehiclesQuery.data])

  const selectVehicle = (v: VehicleResponse) => {
    setVehicle(v)
    setCustomerName(customerNameById.get(v.customerId) ?? 'Cliente')
    setStep('services')
  }

  // ---- Passo 3: carrinho de serviços ----
  const addToCart = (serviceId: string, name: string, unitPrice: number) => {
    setCart((prev) => {
      const found = prev.find((i) => i.serviceId === serviceId)
      if (found) {
        return prev.map((i) =>
          i.serviceId === serviceId ? { ...i, quantity: i.quantity + 1 } : i,
        )
      }
      return [...prev, { serviceId, name, unitPrice, quantity: 1 }]
    })
  }
  const changeQty = (serviceId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.serviceId === serviceId ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0),
    )
  }

  // ---- Passo 4: criar OS ----
  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const order = await createServiceOrder({
        vehicleId: vehicle!.id,
        items: cart.map((i) => ({ serviceId: i.serviceId, quantity: i.quantity })),
      })
      // A OS herda a taxa padrão do tenant na criação; se o operador optou por
      // zerar (ou o valor difere do padrão), ajusta a taxa da OS recém-criada.
      if (effectiveTax !== defaultTax) {
        return updateServiceOrderTax(order.id, effectiveTax)
      }
      return order
    },
    onSuccess: (order) => {
      invalidateAll()
      setCreatedOrderId(order.id)
      setStep('done')
    },
  })

  const restart = () => {
    setStep('plate')
    setPlateQuery('')
    setVehicle(null)
    setCustomerName('')
    setCart([])
    setTaxEnabled(true)
    setCreatedOrderId(null)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Topo */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
        <span className="text-lg font-bold text-slate-900 dark:text-white">
          Lavixx · Atendimento
        </span>
        <Button variant="ghost" onClick={() => navigate('/home')}>
          Sair do atendimento
        </Button>
      </header>

      {/* Indicador de passos */}
      {step !== 'done' && (
        <div className="mx-auto flex max-w-2xl items-center justify-center gap-2 px-6 py-6">
          {STEP_ORDER.map((s, idx) => {
            const activeIdx = STEP_ORDER.indexOf(step as Exclude<Step, 'done'>)
            const state = idx < activeIdx ? 'done' : idx === activeIdx ? 'active' : 'todo'
            return (
              <div key={s} className="flex items-center gap-2">
                <span
                  className={
                    state === 'active'
                      ? 'rounded-full bg-indigo-600 px-3 py-1 text-sm font-medium text-white'
                      : state === 'done'
                        ? 'rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                        : 'rounded-full bg-slate-200 px-3 py-1 text-sm font-medium text-slate-400 dark:bg-slate-800'
                  }
                >
                  {idx + 1}. {STEP_LABELS[s]}
                </span>
                {idx < STEP_ORDER.length - 1 && <span className="text-slate-300">—</span>}
              </div>
            )
          })}
        </div>
      )}

      <main className="mx-auto max-w-2xl px-6 pb-16">
        {step === 'plate' && (
          <PlateStep
            plateQuery={plateQuery}
            setPlateQuery={setPlateQuery}
            matches={plateMatches}
            customerNameById={customerNameById}
            onSelect={selectVehicle}
            onRegister={() => setStep('register')}
          />
        )}

        {step === 'register' && (
          <RegisterStep
            initialPlate={normalizePlate(plateQuery)}
            customers={customersQuery.data ?? []}
            onCancel={() => setStep('plate')}
            onDone={(v, name) => {
              invalidateAll()
              setVehicle(v)
              setCustomerName(name)
              setStep('services')
            }}
          />
        )}

        {step === 'services' && (
          <ServicesStep
            services={servicesQuery.data ?? []}
            isLoading={servicesQuery.isLoading}
            customerName={customerName}
            vehicle={vehicle}
            cart={cart}
            cartTotal={cartTotal}
            addToCart={addToCart}
            changeQty={changeQty}
            onBack={restart}
            onContinue={() => setStep('review')}
          />
        )}

        {step === 'review' && (
          <ReviewStep
            customerName={customerName}
            vehicle={vehicle}
            cart={cart}
            cartTotal={cartTotal}
            taxRate={effectiveTax}
            taxAmount={taxAmount}
            grandTotal={grandTotal}
            taxEnabled={taxEnabled}
            canToggleTax={defaultTax > 0}
            onToggleTax={() => setTaxEnabled((v) => !v)}
            submitting={createOrderMutation.isPending}
            error={createOrderMutation.error ? getApiErrorMessage(createOrderMutation.error) : null}
            onBack={() => setStep('services')}
            onConfirm={() => createOrderMutation.mutate()}
          />
        )}

        {step === 'done' && (
          <DoneStep
            total={grandTotal}
            onNew={restart}
            onView={() => createdOrderId && navigate(`/ordens/${createdOrderId}`)}
          />
        )}
      </main>
    </div>
  )
}

/* ============================ Passo 1: Placa ============================ */
function PlateStep({
  plateQuery,
  setPlateQuery,
  matches,
  customerNameById,
  onSelect,
  onRegister,
}: {
  plateQuery: string
  setPlateQuery: (v: string) => void
  matches: VehicleResponse[]
  customerNameById: Map<string, string>
  onSelect: (v: VehicleResponse) => void
  onRegister: () => void
}) {
  const typed = normalizePlate(plateQuery)
  const showNoResult = typed.length >= 3 && matches.length === 0

  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Bem-vindo! 🚗</h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">Digite a placa do veículo para começar.</p>

      <Input
        autoFocus
        value={plateQuery}
        onChange={(e) => setPlateQuery(e.target.value)}
        placeholder="ABC1D23"
        className="mx-auto mt-8 h-16 max-w-sm text-center text-2xl font-bold uppercase tracking-widest"
      />

      <div className="mx-auto mt-6 max-w-md space-y-2">
        {matches.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => onSelect(v)}
            className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/40"
          >
            <span>
              <span className="block text-lg font-bold text-slate-900 dark:text-white">
                {formatPlate(v.plate)}
              </span>
              <span className="block text-sm text-slate-500 dark:text-slate-400">
                {describeVehicle(v)} · {customerNameById.get(v.customerId) ?? 'Sem cliente'}
              </span>
            </span>
            <span className="text-indigo-600">Selecionar →</span>
          </button>
        ))}

        {showNoResult && (
          <Card className="p-6">
            <p className="text-slate-600 dark:text-slate-300">
              Nenhum veículo encontrado com a placa{' '}
              <span className="font-bold">{typed}</span>.
            </p>
            <Button className="mt-4 w-full" onClick={onRegister}>
              Cadastrar veículo agora
            </Button>
          </Card>
        )}
      </div>
    </div>
  )
}

/* ========================= Passo 2: Cadastro ========================= */
function RegisterStep({
  initialPlate,
  customers,
  onCancel,
  onDone,
}: {
  initialPlate: string
  customers: { id: string; name: string; document: string | null }[]
  onCancel: () => void
  onDone: (vehicle: VehicleResponse, customerName: string) => void
}) {
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>(
    customers.length > 0 ? 'existing' : 'new',
  )
  const [customerSearch, setCustomerSearch] = useState('')
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [newName, setNewName] = useState('')
  const [newDoc, setNewDoc] = useState('')
  const [newPhone, setNewPhone] = useState('')

  const [type, setType] = useState<VehicleType>('car')
  const [plate, setPlate] = useState(initialPlate)
  const [nickname, setNickname] = useState('')
  const [manufacturer, setManufacturer] = useState('')
  const [model, setModel] = useState('')
  const [color, setColor] = useState('')

  const [error, setError] = useState<string | null>(null)

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase()
    if (!q) return customers.slice(0, 6)
    return customers
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.document ?? '').includes(q.replace(/\D/g, '')),
      )
      .slice(0, 6)
  }, [customerSearch, customers])

  const mutation = useMutation({
    mutationFn: async () => {
      let customerId = selectedCustomerId
      let name = customers.find((c) => c.id === customerId)?.name ?? ''
      if (customerMode === 'new') {
        const created = await createCustomer({
          name: newName.trim(),
          document: newDoc.replace(/\D/g, '') || undefined,
          phone: newPhone.replace(/\D/g, '') || undefined,
        })
        customerId = created.id
        name = created.name
      }
      const created = await createVehicle({
        customerId,
        type,
        plate: plate.trim() || undefined,
        nickname: nickname.trim() || undefined,
        manufacturer: manufacturer.trim() || undefined,
        model: model.trim() || undefined,
        color: color.trim() || undefined,
      })
      return { vehicle: created, customerName: name }
    },
    onSuccess: ({ vehicle, customerName }) => onDone(vehicle, customerName),
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  const handleSubmit = () => {
    setError(null)
    if (customerMode === 'existing' && !selectedCustomerId) {
      setError('Selecione um cliente ou cadastre um novo.')
      return
    }
    if (customerMode === 'new' && !newName.trim()) {
      setError('Informe o nome do cliente.')
      return
    }
    mutation.mutate()
  }

  return (
    <div>
      <h1 className="mb-6 text-center text-2xl font-bold text-slate-900 dark:text-white">
        Cadastro rápido
      </h1>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Cliente */}
      <Card className="mb-4 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">Cliente</h2>
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setCustomerMode('existing')}
              className={
                customerMode === 'existing'
                  ? 'rounded-md bg-white px-3 py-1 text-sm font-medium text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                  : 'px-3 py-1 text-sm text-slate-500'
              }
            >
              Existente
            </button>
            <button
              type="button"
              onClick={() => setCustomerMode('new')}
              className={
                customerMode === 'new'
                  ? 'rounded-md bg-white px-3 py-1 text-sm font-medium text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                  : 'px-3 py-1 text-sm text-slate-500'
              }
            >
              Novo
            </button>
          </div>
        </div>

        {customerMode === 'existing' ? (
          <div>
            <Input
              placeholder="Buscar por nome ou CPF/CNPJ…"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
            />
            <div className="mt-2 space-y-1">
              {filteredCustomers.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCustomerId(c.id)}
                  className={
                    selectedCustomerId === c.id
                      ? 'flex w-full items-center justify-between rounded-lg border border-indigo-300 bg-indigo-50 px-4 py-2 text-left text-sm dark:border-indigo-700 dark:bg-indigo-950'
                      : 'flex w-full items-center justify-between rounded-lg border border-slate-200 px-4 py-2 text-left text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
                  }
                >
                  <span className="font-medium text-slate-800 dark:text-slate-100">{c.name}</span>
                  <span className="text-xs text-slate-400">{formatDocument(c.document)}</span>
                </button>
              ))}
              {filteredCustomers.length === 0 && (
                <p className="px-1 py-2 text-sm text-slate-400">
                  Nenhum cliente. Use a aba “Novo”.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Nome do cliente" htmlFor="newName">
              <Input id="newName" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </Field>
            <Field label="Telefone (opcional)" htmlFor="newPhone">
              <Input
                id="newPhone"
                inputMode="tel"
                placeholder="(11) 91234-5678"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
              />
            </Field>
            <Field label="CPF/CNPJ (opcional)" htmlFor="newDoc">
              <Input
                id="newDoc"
                inputMode="numeric"
                value={newDoc}
                onChange={(e) => setNewDoc(e.target.value)}
              />
            </Field>
          </div>
        )}
      </Card>

      {/* Veículo */}
      <Card className="mb-6 p-5">
        <h2 className="mb-3 font-semibold text-slate-800 dark:text-slate-100">Veículo</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tipo" htmlFor="vType">
            <Select id="vType" value={type} onChange={(e) => setType(e.target.value as VehicleType)}>
              {VEHICLE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {VEHICLE_TYPE_LABELS[t]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Placa" htmlFor="vPlate">
            <Input
              id="vPlate"
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
              className="uppercase"
            />
          </Field>
          <Field label="Apelido" htmlFor="vNickname">
            <Input id="vNickname" value={nickname} onChange={(e) => setNickname(e.target.value)} />
          </Field>
          <Field label="Cor" htmlFor="vColor">
            <Input id="vColor" value={color} onChange={(e) => setColor(e.target.value)} />
          </Field>
          <Field label="Fabricante" htmlFor="vManufacturer">
            <Input
              id="vManufacturer"
              value={manufacturer}
              onChange={(e) => setManufacturer(e.target.value)}
            />
          </Field>
          <Field label="Modelo" htmlFor="vModel">
            <Input id="vModel" value={model} onChange={(e) => setModel(e.target.value)} />
          </Field>
        </div>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Voltar
        </Button>
        <Button onClick={handleSubmit} disabled={mutation.isPending}>
          {mutation.isPending ? 'Salvando…' : 'Continuar'}
        </Button>
      </div>
    </div>
  )
}

/* ========================= Passo 3: Serviços ========================= */
function ServicesStep({
  services,
  isLoading,
  customerName,
  vehicle,
  cart,
  cartTotal,
  addToCart,
  changeQty,
  onBack,
  onContinue,
}: {
  services: { id: string; name: string; price: number }[]
  isLoading: boolean
  customerName: string
  vehicle: VehicleResponse | null
  cart: CartItem[]
  cartTotal: number
  addToCart: (serviceId: string, name: string, unitPrice: number) => void
  changeQty: (serviceId: string, delta: number) => void
  onBack: () => void
  onContinue: () => void
}) {
  const qtyOf = (serviceId: string) => cart.find((i) => i.serviceId === serviceId)?.quantity ?? 0

  return (
    <div>
      <div className="mb-4 rounded-lg bg-white p-4 text-sm shadow-sm dark:bg-slate-900">
        <span className="font-medium text-slate-800 dark:text-slate-100">{customerName}</span>
        <span className="text-slate-400">
          {' · '}
          {vehicle ? describeVehicle(vehicle) : ''}
          {vehicle?.plate ? ` (${formatPlate(vehicle.plate)})` : ''}
        </span>
      </div>

      <h1 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">Escolha os serviços</h1>

      {isLoading && <p className="text-sm text-slate-500">Carregando…</p>}
      {!isLoading && services.length === 0 && (
        <Card className="p-6 text-center text-sm text-slate-500">
          Nenhum serviço cadastrado. Cadastre serviços no catálogo primeiro.
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {services.map((s) => {
          const qty = qtyOf(s.id)
          return (
            <Card key={s.id} className="flex items-center justify-between p-4">
              <div>
                <div className="font-medium text-slate-800 dark:text-slate-100">{s.name}</div>
                <div className="text-sm text-slate-500">{formatCurrency(s.price)}</div>
              </div>
              {qty === 0 ? (
                <Button className="h-9 px-4" onClick={() => addToCart(s.id, s.name, s.price)}>
                  Adicionar
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="outline" className="h-9 w-9 px-0" onClick={() => changeQty(s.id, -1)}>
                    −
                  </Button>
                  <span className="w-6 text-center font-medium">{qty}</span>
                  <Button variant="outline" className="h-9 w-9 px-0" onClick={() => changeQty(s.id, 1)}>
                    +
                  </Button>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-800">
        <Button variant="outline" onClick={onBack}>
          Cancelar
        </Button>
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold text-slate-900 dark:text-white">
            Total: {formatCurrency(cartTotal)}
          </span>
          <Button onClick={onContinue} disabled={cart.length === 0}>
            Continuar
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ========================= Passo 4: Revisão ========================= */
function ReviewStep({
  customerName,
  vehicle,
  cart,
  cartTotal,
  taxRate,
  taxAmount,
  grandTotal,
  taxEnabled,
  canToggleTax,
  onToggleTax,
  submitting,
  error,
  onBack,
  onConfirm,
}: {
  customerName: string
  vehicle: VehicleResponse | null
  cart: CartItem[]
  cartTotal: number
  taxRate: number
  taxAmount: number
  grandTotal: number
  taxEnabled: boolean
  canToggleTax: boolean
  onToggleTax: () => void
  submitting: boolean
  error: string | null
  onBack: () => void
  onConfirm: () => void
}) {
  return (
    <div>
      <h1 className="mb-6 text-center text-2xl font-bold text-slate-900 dark:text-white">
        Revise o atendimento
      </h1>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      <Card className="mb-4 p-5">
        <div className="text-sm text-slate-500">Cliente</div>
        <div className="font-medium text-slate-900 dark:text-white">{customerName}</div>
        <div className="mt-2 text-sm text-slate-500">Veículo</div>
        <div className="font-medium text-slate-900 dark:text-white">
          {vehicle ? describeVehicle(vehicle) : ''}
          {vehicle?.plate ? ` · ${formatPlate(vehicle.plate)}` : ''}
        </div>
      </Card>

      <Card className="mb-6 overflow-hidden">
        <table className="w-full text-sm">
          <tbody>
            {cart.map((i) => (
              <tr key={i.serviceId} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                <td className="px-4 py-3 text-slate-800 dark:text-slate-100">
                  {i.name} <span className="text-slate-400">× {i.quantity}</span>
                </td>
                <td className="px-4 py-3 text-right font-medium text-slate-800 dark:text-slate-100">
                  {formatCurrency(i.unitPrice * i.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50 dark:bg-slate-800/50">
            {canToggleTax && (
              <>
                <tr>
                  <td className="px-4 pt-3 text-slate-500">Subtotal</td>
                  <td className="px-4 pt-3 text-right text-slate-700 dark:text-slate-200">
                    {formatCurrency(cartTotal)}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-1 text-slate-500">
                    <span className="flex items-center gap-2">
                      Taxa de serviço{taxEnabled ? ` (${taxRate}%)` : ''}
                      <button
                        type="button"
                        onClick={onToggleTax}
                        className="rounded-md border border-slate-300 px-2 py-0.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        {taxEnabled ? 'Remover' : 'Aplicar'}
                      </button>
                    </span>
                  </td>
                  <td className="px-4 py-1 text-right text-slate-700 dark:text-slate-200">
                    {taxEnabled ? formatCurrency(taxAmount) : '—'}
                  </td>
                </tr>
              </>
            )}
            <tr>
              <td className="px-4 py-3 font-medium text-slate-500">Total</td>
              <td className="px-4 py-3 text-right text-lg font-bold text-slate-900 dark:text-white">
                {formatCurrency(grandTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={submitting}>
          Voltar
        </Button>
        <Button onClick={onConfirm} disabled={submitting}>
          {submitting ? 'Criando ordem…' : 'Confirmar e abrir ordem'}
        </Button>
      </div>
    </div>
  )
}

/* ========================= Passo 5: Concluído ========================= */
function DoneStep({
  total,
  onNew,
  onView,
}: {
  total: number
  onNew: () => void
  onView: () => void
}) {
  return (
    <div className="mt-10 text-center">
      <div className="text-6xl">✅</div>
      <h1 className="mt-4 text-3xl font-bold text-slate-900 dark:text-white">Ordem criada!</h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        Total do atendimento: <span className="font-bold">{formatCurrency(total)}</span>
      </p>
      <div className="mx-auto mt-8 flex max-w-sm flex-col gap-3">
        <Button onClick={onNew}>Novo atendimento</Button>
        <Button variant="outline" onClick={onView}>
          Ver ordem criada
        </Button>
      </div>
    </div>
  )
}
