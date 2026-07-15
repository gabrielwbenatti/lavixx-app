import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Field } from '@/components/ui/Field'
import { Card } from '@/components/ui/Card'
import { registerTenant } from '@/services/tenantService'
import { saveSession } from '@/lib/auth'
import { getApiErrorMessage } from '@/lib/api'
import { maskDocument, withMask } from '@/lib/mask'
import {
  tenantRegistrationSchema,
  type TenantRegistrationForm,
} from '@/lib/schemas/tenantRegistrationSchema'

export function RegisterPage() {
  const navigate = useNavigate()
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TenantRegistrationForm>({
    resolver: zodResolver(tenantRegistrationSchema),
    defaultValues: {
      name: '',
      document: '',
      adminName: '',
      adminEmail: '',
      adminPassword: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (form: TenantRegistrationForm) => {
    setApiError(null)
    try {
      const response = await registerTenant({
        name: form.name,
        document: form.document, // ja normalizado para digitos pelo schema
        adminName: form.adminName,
        adminEmail: form.adminEmail,
        adminPassword: form.adminPassword,
      })
      saveSession(response.token, response.tenantName, 'admin')
      navigate('/home', { replace: true })
    } catch (error) {
      setApiError(getApiErrorMessage(error))
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <Card className="w-full max-w-lg p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Criar conta do estabelecimento
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Cadastre seu lava-rapido e o usuario administrador.
          </p>
        </div>

        {apiError && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="border-b border-slate-100 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:border-slate-800">
            Estabelecimento
          </div>

          <Field label="Nome do estabelecimento" htmlFor="name" error={errors.name?.message}>
            <Input
              id="name"
              placeholder="Ex.: Lava-Rapido do Ze"
              invalid={!!errors.name}
              {...register('name')}
            />
          </Field>

          <Field
            label="CPF ou CNPJ"
            htmlFor="document"
            error={errors.document?.message}
            hint="Somente numeros (11 para CPF, 14 para CNPJ)."
          >
            <Input
              id="document"
              inputMode="numeric"
              placeholder="000.000.000-00"
              invalid={!!errors.document}
              {...withMask(register('document'), maskDocument)}
            />
          </Field>

          <div className="mt-2 border-b border-slate-100 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:border-slate-800">
            Administrador
          </div>

          <Field label="Seu nome" htmlFor="adminName" error={errors.adminName?.message}>
            <Input
              id="adminName"
              placeholder="Nome completo"
              autoComplete="name"
              invalid={!!errors.adminName}
              {...register('adminName')}
            />
          </Field>

          <Field label="E-mail" htmlFor="adminEmail" error={errors.adminEmail?.message}>
            <Input
              id="adminEmail"
              type="email"
              placeholder="voce@exemplo.com"
              autoComplete="email"
              invalid={!!errors.adminEmail}
              {...register('adminEmail')}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Senha" htmlFor="adminPassword" error={errors.adminPassword?.message}>
              <Input
                id="adminPassword"
                type="password"
                placeholder="Minimo 8 caracteres"
                autoComplete="new-password"
                invalid={!!errors.adminPassword}
                {...register('adminPassword')}
              />
            </Field>

            <Field
              label="Confirmar senha"
              htmlFor="confirmPassword"
              error={errors.confirmPassword?.message}
            >
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repita a senha"
                autoComplete="new-password"
                invalid={!!errors.confirmPassword}
                {...register('confirmPassword')}
              />
            </Field>
          </div>

          <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
            {isSubmitting ? 'Cadastrando...' : 'Concluir cadastro'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Ja tem conta?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:underline">
            Entrar
          </Link>
        </p>
      </Card>
    </div>
  )
}
