import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Field } from '@/components/ui/Field'
import { Card } from '@/components/ui/Card'
import { getApiErrorMessage } from '@/lib/api'
import { saveSession } from '@/lib/auth'
import { acceptInviteSchema, type AcceptInviteForm } from '@/lib/schemas/userSchemas'
import { acceptInvite, getInvitePreview } from '@/services/authService'

export function AcceptInvitePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [apiError, setApiError] = useState<string | null>(null)

  const previewQuery = useQuery({
    queryKey: ['invite-preview', token],
    queryFn: () => getInvitePreview(token),
    enabled: !!token,
    retry: false,
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AcceptInviteForm>({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: { password: '', confirm: '' },
  })

  const onSubmit = async (form: AcceptInviteForm) => {
    setApiError(null)
    try {
      const response = await acceptInvite({ token, password: form.password })
      saveSession(response.token, response.tenantName, response.role)
      navigate('/home', { replace: true })
    } catch (error) {
      setApiError(getApiErrorMessage(error))
    }
  }

  const invalidInvite = !token || previewQuery.isError

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <Card className="w-full max-w-md p-8">
        {invalidInvite ? (
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Convite inválido</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Este link de convite é inválido ou já foi utilizado. Peça um novo link ao
              administrador do estabelecimento.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-block text-sm font-medium text-indigo-600 hover:underline"
            >
              Ir para o login
            </Link>
          </div>
        ) : previewQuery.isLoading ? (
          <p className="text-center text-sm text-slate-500">Carregando convite…</p>
        ) : (
          <>
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Definir senha</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Olá, <strong>{previewQuery.data?.name}</strong>! Crie sua senha para acessar o{' '}
                <strong>{previewQuery.data?.tenantName}</strong>.
              </p>
              <p className="mt-1 text-xs text-slate-400">{previewQuery.data?.email}</p>
            </div>

            {apiError && (
              <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                {apiError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
              <Field label="Nova senha" htmlFor="password" error={errors.password?.message}>
                <Input
                  id="password"
                  type="password"
                  placeholder="Ao menos 8 caracteres"
                  autoComplete="new-password"
                  invalid={!!errors.password}
                  {...register('password')}
                />
              </Field>
              <Field label="Confirmar senha" htmlFor="confirm" error={errors.confirm?.message}>
                <Input
                  id="confirm"
                  type="password"
                  placeholder="Repita a senha"
                  autoComplete="new-password"
                  invalid={!!errors.confirm}
                  {...register('confirm')}
                />
              </Field>
              <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
                {isSubmitting ? 'Salvando…' : 'Definir senha e entrar'}
              </Button>
            </form>
          </>
        )}
      </Card>
    </div>
  )
}
