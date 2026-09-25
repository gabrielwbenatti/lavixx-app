import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Wrench } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { QuickVehicleForm } from '@/components/QuickVehicleForm'
import { getApiErrorMessage } from '@/lib/api'
import { formatCurrency, formatPlate } from '@/lib/format'
import { describeVehicle } from '@/lib/describe'
import { normalizePlate } from '@/lib/plate'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import { listVehicles } from '@/services/vehicleService'
import { listServices } from '@/services/serviceService'
import { listProducts } from '@/services/productService'
import {
  createServiceOrder,
  redeemServiceOrderLoyalty,
  updateServiceOrderTax,
} from '@/services/serviceOrderService'
import { getCurrentTenant } from '@/services/tenantService'
import { getCustomerLoyalty } from '@/services/customerService'
import type { VehicleResponse } from '@/types/vehicle'

type Step = 'plate' | 'register' | 'services' | 'review' | 'done'

interface CartItem {
  kind: 'service' | 'product'
  refId: string
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
  const [useReward, setUseReward] = useState(false)
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null)

  const servicesQuery = useQuery({ queryKey: ['services'], queryFn: listServices })
  const productsQuery = useQuery({ queryKey: ['products'], queryFn: listProducts })
  const tenantQuery = useQuery({ queryKey: ['tenant-settings'], queryFn: getCurrentTenant })
  const loyaltyQuery = useQuery({
    queryKey: ['customer-loyalty', vehicle?.customerId],
    queryFn: () => getCustomerLoyalty(vehicle!.customerId),
    enabled: !!vehicle?.customerId,
  })

  const cartTotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
  const rewardAvailable = !!loyaltyQuery.data?.enabled && loyaltyQuery.data.rewardsAvailable > 0
  const rewardPercent = loyaltyQuery.data?.rewardPercent ?? 0
  const loyaltyPercent = useReward && rewardAvailable ? rewardPercent : 0
  const loyaltyDiscount = Math.round(cartTotal * loyaltyPercent) / 100
  const baseTotal = cartTotal - loyaltyDiscount
  const defaultTax = tenantQuery.data?.defaultServiceTax ?? 0
  const effectiveTax = taxEnabled ? defaultTax : 0
  const taxAmount = Math.round(baseTotal * effectiveTax) / 100
  const grandTotal = baseTotal + taxAmount

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    queryClient.invalidateQueries({ queryKey: ['customers'] })
    queryClient.invalidateQueries({ queryKey: ['service-orders'] })
    queryClient.invalidateQueries({ queryKey: ['customer-loyalty'] })
  }

  // ---- Passo 1: busca por placa (na API, enquanto digita) ----
  const typedPlate = normalizePlate(plateQuery)
  const searchedPlate = useDebouncedValue(typedPlate)
  const plateSearchQuery = useQuery({
    queryKey: ['vehicles', 'search', searchedPlate],
    queryFn: () => listVehicles({ search: searchedPlate, size: 20 }),
    enabled: searchedPlate.length >= 3,
    placeholderData: keepPreviousData,
  })
  // A busca da API também casa apelido/modelo/cliente; aqui interessa só a placa.
  const plateMatches =
    typedPlate.length >= 3
      ? (plateSearchQuery.data?.content ?? [])
          .filter((v) => v.plate && normalizePlate(v.plate).includes(typedPlate))
          .slice(0, 6)
      : []
  const plateSearchSettled =
    searchedPlate === typedPlate && !plateSearchQuery.isFetching && !plateSearchQuery.isError

  const selectVehicle = (v: VehicleResponse) => {
    setVehicle(v)
    setCustomerName(v.customerName)
    setStep('services')
  }

  // ---- Passo 3: carrinho de serviços ----
  const addToCart = (kind: CartItem['kind'], refId: string, name: string, unitPrice: number) => {
    setCart((prev) => {
      const found = prev.find((i) => i.refId === refId)
      if (found) {
        return prev.map((i) => (i.refId === refId ? { ...i, quantity: i.quantity + 1 } : i))
      }
      return [...prev, { kind, refId, name, unitPrice, quantity: 1 }]
    })
  }
  const changeQty = (refId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.refId === refId ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0),
    )
  }

  // ---- Passo 4: criar OS ----
  const createOrderMutation = useMutation({
    mutationFn: async () => {
      let order = await createServiceOrder({
        vehicleId: vehicle!.id,
        items: cart.map((i) => ({
          ...(i.kind === 'product' ? { productId: i.refId } : { serviceId: i.refId }),
          quantity: i.quantity,
        })),
      })
      // A OS herda a taxa padrão do tenant na criação; se o operador optou por
      // zerar (ou o valor difere do padrão), ajusta a taxa da OS recém-criada.
      if (effectiveTax !== defaultTax) {
        order = await updateServiceOrderTax(order.id, effectiveTax)
      }
      // Aplica o prêmio de fidelidade, se o operador optou por usá-lo.
      if (useReward && rewardAvailable) {
        order = await redeemServiceOrderLoyalty(order.id)
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
    setUseReward(false)
    setCreatedOrderId(null)
  }

  // Sem nada vendável (nenhum serviço nem produto) não há como abrir uma OS —
  // trava o atendimento. (Só bloqueia depois que as duas listas carregam.)
  const catalogEmpty =
    servicesQuery.isSuccess &&
    productsQuery.isSuccess &&
    servicesQuery.data.length === 0 &&
    productsQuery.data.length === 0
  if (catalogEmpty) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-lg font-bold text-slate-900 dark:text-white">
            Lavixx · Atendimento
          </span>
          <Button variant="ghost" onClick={() => navigate('/home')}>
            Sair do atendimento
          </Button>
        </header>
        <main className="mx-auto max-w-lg px-6 py-20 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
            <Wrench size={28} strokeWidth={1.75} />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-slate-900 dark:text-white">
            Cadastre um serviço ou produto
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            O atendimento rápido precisa de pelo menos um serviço ou produto no catálogo para
            abrir uma ordem. Cadastre um e volte aqui.
          </p>
          <div className="mx-auto mt-8 flex max-w-xs flex-col gap-3">
            <Button onClick={() => navigate('/servicos')}>Cadastrar serviço</Button>
            <Button variant="outline" onClick={() => navigate('/produtos')}>
              Cadastrar produto
            </Button>
            <Button variant="ghost" onClick={() => navigate('/home')}>
              Voltar ao início
            </Button>
          </div>
        </main>
      </div>
    )
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
            searchSettled={plateSearchSettled}
            onSelect={selectVehicle}
            onRegister={() => setStep('register')}
          />
        )}

        {step === 'register' && (
          <RegisterStep
            initialPlate={normalizePlate(plateQuery)}
            onCancel={() => setStep('plate')}
            onDone={(v) => {
              invalidateAll()
              setVehicle(v)
              setCustomerName(v.customerName)
              setStep('services')
            }}
          />
        )}

        {step === 'services' && (
          <ServicesStep
            services={servicesQuery.data ?? []}
            products={productsQuery.data ?? []}
            isLoading={servicesQuery.isLoading || productsQuery.isLoading}
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
            rewardAvailable={rewardAvailable}
            rewardPercent={rewardPercent}
            loyaltyDiscount={loyaltyDiscount}
            useReward={useReward}
            onToggleReward={() => setUseReward((v) => !v)}
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
  searchSettled,
  onSelect,
  onRegister,
}: {
  plateQuery: string
  setPlateQuery: (v: string) => void
  matches: VehicleResponse[]
  /** A busca da placa digitada já terminou (evita "não encontrado" antes da resposta). */
  searchSettled: boolean
  onSelect: (v: VehicleResponse) => void
  onRegister: () => void
}) {
  const typed = normalizePlate(plateQuery)
  const showNoResult = typed.length >= 3 && searchSettled && matches.length === 0

  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Bem-vindo! {'\u{1F697}'}</h1>
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
                {describeVehicle(v)} · {v.customerName}
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
  onCancel,
  onDone,
}: {
  initialPlate: string
  onCancel: () => void
  onDone: (vehicle: VehicleResponse) => void
}) {
  return (
    <div>
      <h1 className="mb-6 text-center text-2xl font-bold text-slate-900 dark:text-white">
        Cadastro rápido
      </h1>
      <QuickVehicleForm initialPlate={initialPlate} onCancel={onCancel} onCreated={onDone} />
    </div>
  )
}

/* ========================= Passo 3: Serviços ========================= */
function ServicesStep({
  services,
  products,
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
  products: { id: string; name: string; price: number }[]
  isLoading: boolean
  customerName: string
  vehicle: VehicleResponse | null
  cart: CartItem[]
  cartTotal: number
  addToCart: (kind: CartItem['kind'], refId: string, name: string, unitPrice: number) => void
  changeQty: (refId: string, delta: number) => void
  onBack: () => void
  onContinue: () => void
}) {
  const qtyOf = (refId: string) => cart.find((i) => i.refId === refId)?.quantity ?? 0

  const renderEntry = (kind: CartItem['kind'], e: { id: string; name: string; price: number }) => {
    const qty = qtyOf(e.id)
    return (
      <Card key={`${kind}:${e.id}`} className="flex items-center justify-between p-4">
        <div>
          <div className="font-medium text-slate-800 dark:text-slate-100">{e.name}</div>
          <div className="text-sm text-slate-500">{formatCurrency(e.price)}</div>
        </div>
        {qty === 0 ? (
          <Button className="h-9 px-4" onClick={() => addToCart(kind, e.id, e.name, e.price)}>
            Adicionar
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-9 w-9 px-0" onClick={() => changeQty(e.id, -1)}>
              −
            </Button>
            <span className="w-6 text-center font-medium">{qty}</span>
            <Button variant="outline" className="h-9 w-9 px-0" onClick={() => changeQty(e.id, 1)}>
              +
            </Button>
          </div>
        )}
      </Card>
    )
  }

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

      <h1 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">Escolha os itens</h1>

      {isLoading && <p className="text-sm text-slate-500">Carregando…</p>}
      {!isLoading && services.length === 0 && products.length === 0 && (
        <Card className="p-6 text-center text-sm text-slate-500">
          Nenhum serviço ou produto cadastrado. Cadastre no catálogo primeiro.
        </Card>
      )}

      {services.length > 0 && (
        <>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">Serviços</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {services.map((s) => renderEntry('service', s))}
          </div>
        </>
      )}

      {products.length > 0 && (
        <>
          <h2 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-slate-400">Produtos</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {products.map((p) => renderEntry('product', p))}
          </div>
        </>
      )}

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
  rewardAvailable,
  rewardPercent,
  loyaltyDiscount,
  useReward,
  onToggleReward,
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
  rewardAvailable: boolean
  rewardPercent: number
  loyaltyDiscount: number
  useReward: boolean
  onToggleReward: () => void
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

      {rewardAvailable && (
        <label className="mb-4 flex cursor-pointer items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-indigo-600"
            checked={useReward}
            onChange={onToggleReward}
          />
          <span className="text-sm font-medium text-amber-900 dark:text-amber-200">
            {'\u{1F389}'} Usar prêmio de fidelidade
            {rewardPercent >= 100 ? ' (lavagem grátis)' : ` (${rewardPercent}% de desconto)`}
          </span>
        </label>
      )}

      <Card className="mb-6 overflow-hidden">
        <table className="w-full text-sm">
          <tbody>
            {cart.map((i) => (
              <tr key={i.refId} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
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
            {(canToggleTax || (rewardAvailable && useReward)) && (
              <tr>
                <td className="px-4 pt-3 text-slate-500">Subtotal</td>
                <td className="px-4 pt-3 text-right text-slate-700 dark:text-slate-200">
                  {formatCurrency(cartTotal)}
                </td>
              </tr>
            )}
            {rewardAvailable && useReward && (
              <tr>
                <td className="px-4 py-1 text-slate-500">Fidelidade ({rewardPercent}%)</td>
                <td className="px-4 py-1 text-right text-emerald-700 dark:text-emerald-400">
                  − {formatCurrency(loyaltyDiscount)}
                </td>
              </tr>
            )}
            {canToggleTax && (
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
      <div className="text-6xl">{'\u{2705}'}</div>
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
