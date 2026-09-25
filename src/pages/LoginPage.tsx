import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Field } from '@/components/ui/Field'
import { Card } from '@/components/ui/Card'
import { login } from '@/services/authService'
import { saveSession } from '@/lib/auth'
import { getApiErrorMessage } from '@/lib/api'
import { loginSchema, type LoginForm } from '@/lib/schemas/loginSchema'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [apiError, setApiError] = useState<string | null>(null)

  // Rota que o usuário tentava acessar antes de ser redirecionado ao login.
  const state = location.state as { from?: string; expired?: boolean } | null
  const from = state?.from ?? '/home'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (form: LoginForm) => {
    setApiError(null)
    try {
      const response = await login({ email: form.email, password: form.password })
      saveSession(response.token, response.tenantName, response.role)
      navigate(from, { replace: true })
    } catch (error) {
      setApiError(getApiErrorMessage(error))
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <Card className="w-full max-w-md p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Entrar</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Acesse o painel do seu estabelecimento.
          </p>
        </div>

        {state?.expired && !apiError && (
          <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
            Sua sessão expirou. Entre novamente para continuar.
          </div>
        )}

        {apiError && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <Field label="E-mail" htmlFor="email" error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              placeholder="voce@exemplo.com"
              autoComplete="email"
              invalid={!!errors.email}
              {...register('email')}
            />
          </Field>

          <Field label="Senha" htmlFor="password" error={errors.password?.message}>
            <Input
              id="password"
              type="password"
              placeholder="Sua senha"
              autoComplete="current-password"
              invalid={!!errors.password}
              {...register('password')}
            />
          </Field>

          <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Ainda não tem conta?{' '}
          <Link to="/registrar" className="font-medium text-indigo-600 hover:underline">
            Cadastrar estabelecimento
          </Link>
        </p>
      </Card>
    </div>
  )
}
