import { useState, type ReactNode } from 'react'
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { getApiErrorMessage } from '@/lib/api'
import { cn } from '@/lib/cn'
import { formatDocument } from '@/lib/format'
import { maskDocument, maskPhone } from '@/lib/mask'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import { createCustomer, listCustomers } from '@/services/customerService'
import { createVehicle } from '@/services/vehicleService'
import {
  VEHICLE_TYPES,
  VEHICLE_TYPE_LABELS,
  type VehicleResponse,
  type VehicleType,
} from '@/types/vehicle'

interface QuickVehicleFormProps {
  /** Placa já digitada na busca, para vir preenchida. */
  initialPlate?: string
  onCancel: () => void
  onCreated: (vehicle: VehicleResponse) => void
  cancelLabel?: string
  submitLabel?: string
  /** Layout enxuto, para uso dentro de modal (sem cartões, menos sugestões de cliente). */
  compact?: boolean
}

/**
 * Cadastro rápido de veículo, com cliente existente (busca na API) ou novo.
 * Usado no atendimento rápido e no modal de nova ordem.
 */
export function QuickVehicleForm({
  initialPlate = '',
  onCancel,
  onCreated,
  cancelLabel = 'Voltar',
  submitLabel = 'Continuar',
  compact = false,
}: QuickVehicleFormProps) {
  // Só para saber se já existe algum cliente (define a aba inicial).
  const anyCustomerQuery = useQuery({
    queryKey: ['customers', 'any'],
    queryFn: () => listCustomers({ size: 1 }),
  })
  const hasCustomers = (anyCustomerQuery.data?.totalElements ?? 0) > 0

  // null = ainda não escolhido pelo usuário; segue o padrão (existente se houver clientes).
  const [chosenMode, setChosenMode] = useState<'existing' | 'new' | null>(null)
  const customerMode = chosenMode ?? (hasCustomers ? 'existing' : 'new')
  const [customerSearch, setCustomerSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; name: string } | null>(null)
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

  const suggestions = compact ? 4 : 6
  const customerTerm = useDebouncedValue(customerSearch.trim())
  const customerSearchQuery = useQuery({
    queryKey: ['customers', 'search', customerTerm, suggestions],
    queryFn: () => listCustomers({ search: customerTerm || undefined, size: suggestions }),
    enabled: customerMode === 'existing',
    placeholderData: keepPreviousData,
  })
  const filteredCustomers = customerSearchQuery.data?.content ?? []

  const mutation = useMutation({
    mutationFn: async () => {
      let customerId = selectedCustomer?.id ?? ''
      if (customerMode === 'new') {
        const created = await createCustomer({
          name: newName.trim(),
          document: newDoc.replace(/\D/g, '') || undefined,
          phone: newPhone.replace(/\D/g, '') || undefined,
        })
        customerId = created.id
      }
      return createVehicle({
        customerId,
        type,
        plate: plate.trim() || undefined,
        nickname: nickname.trim() || undefined,
        manufacturer: manufacturer.trim() || undefined,
        model: model.trim() || undefined,
        color: color.trim() || undefined,
      })
    },
    onSuccess: onCreated,
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  const handleSubmit = () => {
    setError(null)
    if (customerMode === 'existing' && !selectedCustomer) {
      setError('Selecione um cliente ou cadastre um novo.')
      return
    }
    if (customerMode === 'new' && !newName.trim()) {
      setError('Informe o nome do cliente.')
      return
    }
    mutation.mutate()
  }

  const modeTab = (mode: 'existing' | 'new', label: string) => (
    <button
      type="button"
      onClick={() => setChosenMode(mode)}
      className={
        customerMode === mode
          ? 'rounded-md bg-white px-3 py-1 text-sm font-medium text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
          : 'px-3 py-1 text-sm text-slate-500'
      }
    >
      {label}
    </button>
  )

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Cliente */}
      <Section compact={compact}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">Cliente</h2>
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
            {modeTab('existing', 'Existente')}
            {modeTab('new', 'Novo')}
          </div>
        </div>

        {customerMode === 'existing' ? (
          <div>
            <Input
              placeholder="Buscar por nome, telefone ou CPF/CNPJ…"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
            />
            <div className="mt-2 space-y-1">
              {filteredCustomers.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCustomer({ id: c.id, name: c.name })}
                  className={
                    selectedCustomer?.id === c.id
                      ? 'flex w-full items-center justify-between rounded-lg border border-indigo-300 bg-indigo-50 px-4 py-2 text-left text-sm dark:border-indigo-700 dark:bg-indigo-950'
                      : 'flex w-full items-center justify-between rounded-lg border border-slate-200 px-4 py-2 text-left text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
                  }
                >
                  <span className="font-medium text-slate-800 dark:text-slate-100">{c.name}</span>
                  <span className="text-xs text-slate-400">{formatDocument(c.document)}</span>
                </button>
              ))}
              {filteredCustomers.length === 0 && !customerSearchQuery.isFetching && (
                <p className="px-1 py-2 text-sm text-slate-400">
                  Nenhum cliente. Use a aba “Novo”.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className={cn('grid gap-4', compact ? 'sm:grid-cols-2' : 'sm:grid-cols-3')}>
            <Field label="Nome do cliente" htmlFor="newName">
              <Input id="newName" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </Field>
            <Field label="Telefone (opcional)" htmlFor="newPhone">
              <Input
                id="newPhone"
                inputMode="tel"
                placeholder="(11) 91234-5678"
                value={newPhone}
                onChange={(e) => setNewPhone(maskPhone(e.target.value))}
              />
            </Field>
            <Field label="CPF/CNPJ (opcional)" htmlFor="newDoc">
              <Input
                id="newDoc"
                inputMode="numeric"
                placeholder="000.000.000-00"
                value={newDoc}
                onChange={(e) => setNewDoc(maskDocument(e.target.value))}
              />
            </Field>
          </div>
        )}
      </Section>

      {/* Veículo */}
      <Section compact={compact} className={compact ? undefined : 'mb-6'}>
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
      </Section>

      <div className="flex justify-between gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={mutation.isPending}>
          {mutation.isPending ? 'Salvando…' : submitLabel}
        </Button>
      </div>
    </div>
  )
}

/** Bloco do formulário: cartão no atendimento, seção simples dentro do modal. */
function Section({
  compact,
  className,
  children,
}: {
  compact: boolean
  className?: string
  children: ReactNode
}) {
  return compact ? (
    <section className={cn('mb-5', className)}>{children}</section>
  ) : (
    <Card className={cn('mb-4 p-5', className)}>{children}</Card>
  )
}
