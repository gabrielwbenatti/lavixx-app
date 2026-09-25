import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { QuickVehicleForm } from '@/components/QuickVehicleForm'
import { VehicleSearch } from '@/components/VehicleSearch'
import { getApiErrorMessage } from '@/lib/api'
import { createOrderSchema, type CreateOrderForm } from '@/lib/schemas/serviceOrderSchemas'
import { createServiceOrder } from '@/services/serviceOrderService'
import type { ServiceOrderResponse } from '@/types/serviceOrder'
import type { VehicleResponse } from '@/types/vehicle'

interface NewOrderDialogProps {
  open: boolean
  onClose: () => void
  onCreated: (order: ServiceOrderResponse) => void
  /** Sempre cria agendamento (ex.: a partir da Agenda): data/hora obrigatória, sem a opção. */
  scheduledOnly?: boolean
  /** Valor inicial da data/hora do agendamento, no formato de <input type="datetime-local">. */
  defaultScheduledAt?: string
}

/**
 * Modal de nova ordem de serviço: busca o veículo (ou cadastra na hora) e, opcionalmente,
 * agenda para depois. Os itens são adicionados na tela da ordem.
 */
export function NewOrderDialog({
  open,
  onClose,
  onCreated,
  scheduledOnly = false,
  defaultScheduledAt = '',
}: NewOrderDialogProps) {
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<'search' | 'register'>('search')
  const [registerPlate, setRegisterPlate] = useState('')
  const [newVehicle, setNewVehicle] = useState<VehicleResponse | null>(null)
  const [searchKey, setSearchKey] = useState(0)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    handleSubmit,
    reset,
    register,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateOrderForm>({ resolver: zodResolver(createOrderSchema) })

  // Cada abertura começa do zero.
  useEffect(() => {
    if (!open) return
    reset({ vehicleId: '', scheduled: scheduledOnly, scheduledAt: defaultScheduledAt })
    setMode('search')
    setNewVehicle(null)
    setFormError(null)
    setSearchKey((k) => k + 1)
  }, [open, scheduledOnly, defaultScheduledAt, reset])

  const isScheduled = watch('scheduled')

  const createMutation = useMutation({
    mutationFn: (form: CreateOrderForm) =>
      createServiceOrder({
        vehicleId: form.vehicleId,
        ...(form.scheduled && form.scheduledAt
          ? { scheduledAt: new Date(form.scheduledAt).toISOString() }
          : {}),
      }),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['service-orders'] })
      queryClient.invalidateQueries({ queryKey: ['service-orders-schedule'] })
      onCreated(order)
    },
    onError: (err) => setFormError(getApiErrorMessage(err)),
  })

  const handleVehicleCreated = (vehicle: VehicleResponse) => {
    queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    queryClient.invalidateQueries({ queryKey: ['customers'] })
    setNewVehicle(vehicle)
    setValue('vehicleId', vehicle.id, { shouldValidate: true })
    setSearchKey((k) => k + 1)
    setMode('search')
  }

  if (mode === 'register') {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        title="Cadastrar veículo"
        description="Cadastre o veículo e o cliente; em seguida ele já fica selecionado na ordem."
      >
        <QuickVehicleForm
          compact
          initialPlate={registerPlate}
          cancelLabel="Voltar à busca"
          submitLabel="Cadastrar e usar"
          onCancel={() => setMode('search')}
          onCreated={handleVehicleCreated}
        />
      </Dialog>
    )
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={scheduledOnly ? 'Novo agendamento' : 'Nova ordem de serviço'}
      description="Busque o veículo pela placa (ou apelido/cliente). O cliente é vinculado automaticamente."
    >
      {formError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {formError}
        </div>
      )}
      <form
        onSubmit={handleSubmit((form) => {
          setFormError(null)
          createMutation.mutate(form)
        })}
        className="flex flex-col gap-4"
        noValidate
      >
        <Field label="Buscar veículo" htmlFor="vehicleSearch" error={errors.vehicleId?.message}>
          <VehicleSearch
            key={searchKey}
            initialVehicle={newVehicle}
            invalid={!!errors.vehicleId}
            autoFocus={!newVehicle}
            onSelect={(vehicleId) => setValue('vehicleId', vehicleId, { shouldValidate: true })}
            onRegisterNew={(typed) => {
              // Aproveita o texto digitado como placa quando parece uma (só letras/números).
              setRegisterPlate(/^[a-z0-9-\s]{1,10}$/i.test(typed) ? typed.toUpperCase() : '')
              setMode('register')
            }}
          />
        </Field>

        {!scheduledOnly && (
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input type="checkbox" className="h-4 w-4 rounded" {...register('scheduled')} />
            Agendar para depois (cliente ainda não chegou)
          </label>
        )}

        {isScheduled && (
          <Field label="Data e hora do agendamento" htmlFor="scheduledAt" error={errors.scheduledAt?.message}>
            <Input
              id="scheduledAt"
              type="datetime-local"
              invalid={!!errors.scheduledAt}
              {...register('scheduledAt')}
            />
          </Field>
        )}

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending
              ? 'Salvando…'
              : isScheduled
                ? 'Agendar'
                : 'Criar e adicionar itens'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
