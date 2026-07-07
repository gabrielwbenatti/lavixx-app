import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Settings } from 'lucide-react'
import { z } from 'zod'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Field } from '@/components/ui/Field'
import { Card } from '@/components/ui/Card'
import { getApiErrorMessage } from '@/lib/api'
import { useToast } from '@/lib/toastContext'

const api = (await import('@/lib/api')).api

interface TenantResponse {
  id: string
  name: string
  document: string
  operatingHoursStart: string
  operatingHoursEnd: string
  defaultServiceTax: number
}

const settingsSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório').max(150),
  operatingHoursStart: z.string().regex(/^\d{2}:\d{2}$/, 'Formato: HH:mm'),
  operatingHoursEnd: z.string().regex(/^\d{2}:\d{2}$/, 'Formato: HH:mm'),
  defaultServiceTax: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Formato: 0.00'),
})

type SettingsForm = z.infer<typeof settingsSchema>

async function getTenantSettings(): Promise<TenantResponse> {
  const { data } = await api.get<TenantResponse>('/tenants/me')
  return data
}

async function updateTenantSettings(settings: SettingsForm): Promise<TenantResponse> {
  const { data } = await api.patch<TenantResponse>('/tenants/me', {
    ...settings,
    defaultServiceTax: parseFloat(settings.defaultServiceTax),
  })
  return data
}

export function SettingsPage() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  const tenantQuery = useQuery({
    queryKey: ['tenant-settings'],
    queryFn: getTenantSettings,
  })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    values: tenantQuery.data ? {
      name: tenantQuery.data.name,
      operatingHoursStart: tenantQuery.data.operatingHoursStart || '08:00',
      operatingHoursEnd: tenantQuery.data.operatingHoursEnd || '18:00',
      defaultServiceTax: String(tenantQuery.data.defaultServiceTax || 0),
    } : undefined,
  })

  const updateMutation = useMutation({
    mutationFn: updateTenantSettings,
    onSuccess: (updated) => {
      queryClient.setQueryData(['tenant-settings'], updated)
      addToast('Configurações salvas com sucesso', 'success')
    },
    onError: (err) => {
      addToast(getApiErrorMessage(err), 'error')
    },
  })

  if (tenantQuery.isLoading) {
    return <p className="text-sm text-slate-500">Carregando…</p>
  }

  if (tenantQuery.isError) {
    return <p className="text-sm text-red-500">{getApiErrorMessage(tenantQuery.error)}</p>
  }

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
          <Settings size={20} strokeWidth={1.75} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Configurações</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Personalize as configurações do seu estabelecimento.
          </p>
        </div>
      </header>

      <Card className="p-6">
        <form
          onSubmit={handleSubmit((form) => updateMutation.mutate(form))}
          className="flex flex-col gap-4"
          noValidate
        >
          <Field label="Nome do estabelecimento" htmlFor="name" error={errors.name?.message}>
            <Input id="name" invalid={!!errors.name} {...register('name')} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Horário de abertura"
              htmlFor="operatingHoursStart"
              error={errors.operatingHoursStart?.message}
              hint="Formato: HH:mm"
            >
              <Input
                id="operatingHoursStart"
                type="time"
                invalid={!!errors.operatingHoursStart}
                {...register('operatingHoursStart')}
              />
            </Field>
            <Field
              label="Horário de fechamento"
              htmlFor="operatingHoursEnd"
              error={errors.operatingHoursEnd?.message}
              hint="Formato: HH:mm"
            >
              <Input
                id="operatingHoursEnd"
                type="time"
                invalid={!!errors.operatingHoursEnd}
                {...register('operatingHoursEnd')}
              />
            </Field>
          </div>

          <Field
            label="Taxa de serviço padrão (R$)"
            htmlFor="defaultServiceTax"
            error={errors.defaultServiceTax?.message}
            hint="Aplicada automaticamente em novos serviços"
          >
            <Input
              id="defaultServiceTax"
              inputMode="decimal"
              placeholder="0.00"
              invalid={!!errors.defaultServiceTax}
              {...register('defaultServiceTax')}
            />
          </Field>

          <div className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => reset()}
              disabled={isSubmitting || updateMutation.isPending}
            >
              Descartar
            </Button>
            <Button type="submit" disabled={isSubmitting || updateMutation.isPending}>
              {updateMutation.isPending ? 'Salvando…' : 'Salvar configurações'}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="mt-6 border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
        <h3 className="font-semibold text-amber-900 dark:text-amber-200">Informações do estabelecimento</h3>
        <dl className="mt-3 space-y-2 text-sm text-amber-800 dark:text-amber-300">
          <div className="flex justify-between">
            <dt>CNPJ/CPF:</dt>
            <dd className="font-mono">{tenantQuery.data?.document}</dd>
          </div>
          <div className="flex justify-between">
            <dt>ID do estabelecimento:</dt>
            <dd className="font-mono">{tenantQuery.data?.id}</dd>
          </div>
        </dl>
      </Card>
    </div>
  )
}
