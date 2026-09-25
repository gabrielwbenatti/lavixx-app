import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy, UserCog, UserPlus } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Field } from '@/components/ui/Field'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { getApiErrorMessage } from '@/lib/api'
import { useToast } from '@/lib/toastContext'
import { inviteUserSchema, type InviteUserForm } from '@/lib/schemas/userSchemas'
import {
  deleteUser,
  inviteUser,
  listUsers,
  resendInvite,
  setUserActive,
  updateUserRole,
} from '@/services/userService'
import {
  USER_ROLES,
  USER_ROLE_LABELS,
  type InviteResponse,
  type UserResponse,
  type UserRole,
} from '@/types/user'

/** Monta o link de convite a partir do token (usa a origem atual do site). */
function inviteLinkFor(token: string): string {
  return `${window.location.origin}/definir-senha?token=${token}`
}

export function UsersPage() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [linkDialog, setLinkDialog] = useState<{ name: string; url: string } | null>(null)

  const { data: users, isLoading, isError, error } = useQuery({
    queryKey: ['users'],
    queryFn: listUsers,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteUserForm>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: { name: '', email: '', role: 'staff' },
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['users'] })

  const showLink = (res: InviteResponse) => {
    invalidate()
    setInviteOpen(false)
    setLinkDialog({ name: res.user.name, url: inviteLinkFor(res.inviteToken) })
  }

  const inviteMutation = useMutation({
    mutationFn: inviteUser,
    onSuccess: showLink,
    onError: (err) => setFormError(getApiErrorMessage(err)),
  })

  const resendMutation = useMutation({
    mutationFn: (id: string) => resendInvite(id),
    onSuccess: showLink,
    onError: (err) => addToast(getApiErrorMessage(err), 'error'),
  })

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) => updateUserRole(id, role),
    onSuccess: () => {
      invalidate()
      addToast('Papel atualizado', 'success')
    },
    onError: (err) => addToast(getApiErrorMessage(err), 'error'),
  })

  const activeMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => setUserActive(id, active),
    onSuccess: invalidate,
    onError: (err) => addToast(getApiErrorMessage(err), 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      invalidate()
      addToast('Usuário removido', 'success')
    },
    onError: (err) => addToast(getApiErrorMessage(err), 'error'),
  })

  const openInvite = () => {
    setFormError(null)
    reset({ name: '', email: '', role: 'staff' })
    setInviteOpen(true)
  }

  const copyLink = async () => {
    if (!linkDialog) return
    try {
      await navigator.clipboard.writeText(linkDialog.url)
      addToast('Link copiado', 'success')
    } catch {
      addToast('Não foi possível copiar automaticamente. Copie manualmente.', 'error')
    }
  }

  const handleDelete = (user: UserResponse) => {
    if (window.confirm(`Excluir o usuário "${user.name}"? Esta ação não pode ser desfeita.`)) {
      deleteMutation.mutate(user.id)
    }
  }

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
            <UserCog size={20} strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Usuários</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Convide funcionários e gerencie o acesso ao sistema.
            </p>
          </div>
        </div>
        <Button onClick={openInvite} className="gap-2">
          <UserPlus size={16} />
          Convidar usuário
        </Button>
      </header>

      {isLoading && <p className="text-sm text-slate-500">Carregando…</p>}
      {isError && <p className="text-sm text-red-500">{getApiErrorMessage(error)}</p>}

      {users && users.length > 0 && (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-3 font-medium">Usuário</th>
                <th className="px-4 py-3 font-medium">Papel</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800 dark:text-slate-100">{user.name}</div>
                    <div className="text-xs text-slate-400">{user.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Select
                      className="h-9 w-40"
                      value={user.role}
                      disabled={roleMutation.isPending}
                      onChange={(e) =>
                        roleMutation.mutate({ id: user.id, role: e.target.value as UserRole })
                      }
                    >
                      {USER_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {USER_ROLE_LABELS[r]}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge user={user} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-1">
                      {user.pending ? (
                        <Button
                          variant="ghost"
                          className="h-9 px-3"
                          disabled={resendMutation.isPending}
                          onClick={() => resendMutation.mutate(user.id)}
                        >
                          Gerar link
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          className="h-9 px-3"
                          disabled={activeMutation.isPending}
                          onClick={() =>
                            activeMutation.mutate({ id: user.id, active: !user.active })
                          }
                        >
                          {user.active ? 'Desativar' : 'Ativar'}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        className="h-9 px-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={() => handleDelete(user)}
                      >
                        Excluir
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Dialog: convidar */}
      <Dialog open={inviteOpen} onClose={() => setInviteOpen(false)} title="Convidar usuário">
        {formError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {formError}
          </div>
        )}
        <form
          onSubmit={handleSubmit((form) => {
            setFormError(null)
            inviteMutation.mutate(form)
          })}
          className="flex flex-col gap-4"
          noValidate
        >
          <Field label="Nome" htmlFor="name" error={errors.name?.message}>
            <Input id="name" placeholder="Ex.: Maria Silva" invalid={!!errors.name} {...register('name')} />
          </Field>
          <Field label="E-mail" htmlFor="email" error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              placeholder="funcionario@exemplo.com"
              invalid={!!errors.email}
              {...register('email')}
            />
          </Field>
          <Field label="Papel" htmlFor="role" error={errors.role?.message}>
            <Select id="role" invalid={!!errors.role} {...register('role')}>
              {USER_ROLES.map((r) => (
                <option key={r} value={r}>
                  {USER_ROLE_LABELS[r]}
                </option>
              ))}
            </Select>
          </Field>
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || inviteMutation.isPending}>
              {inviteMutation.isPending ? 'Convidando…' : 'Convidar'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Dialog: link de convite gerado */}
      <Dialog
        open={!!linkDialog}
        onClose={() => setLinkDialog(null)}
        title="Link de convite"
        description={
          linkDialog
            ? `Envie este link para ${linkDialog.name} definir a senha e acessar o sistema.`
            : undefined
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Input readOnly value={linkDialog?.url ?? ''} className="font-mono text-xs" />
            <Button type="button" className="h-11 shrink-0 gap-2" onClick={copyLink}>
              <Copy size={16} />
              Copiar
            </Button>
          </div>
          <p className="text-xs text-slate-400">
            O link vale até ser usado. Gerar um novo link invalida o anterior.
          </p>
          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={() => setLinkDialog(null)}>
              Fechar
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}

function StatusBadge({ user }: { user: UserResponse }) {
  const cls =
    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium'
  if (user.pending) {
    return (
      <span className={`${cls} bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300`}>
        Convite pendente
      </span>
    )
  }
  if (user.active) {
    return (
      <span className={`${cls} bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300`}>
        Ativo
      </span>
    )
  }
  return (
    <span className={`${cls} bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300`}>
      Inativo
    </span>
  )
}
