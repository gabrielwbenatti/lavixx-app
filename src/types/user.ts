/** Espelha os DTOs de usuário da API. */

export const USER_ROLES = ['admin', 'staff'] as const
export type UserRole = (typeof USER_ROLES)[number]

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  staff: 'Funcionário',
}

export interface UserResponse {
  id: string
  name: string
  email: string
  role: UserRole
  active: boolean
  /** Convite ainda não aceito (nunca definiu a senha). */
  pending: boolean
  createdAt: string
  updatedAt: string
}

export interface InviteUserRequest {
  name: string
  email: string
  role: UserRole
}

/** Resposta ao convidar/reenviar: usuário + token para montar o link. */
export interface InviteResponse {
  user: UserResponse
  inviteToken: string
}

/** Dados exibidos na tela pública de aceite (definir senha). */
export interface InvitePreviewResponse {
  name: string
  email: string
  tenantName: string
}

export interface AcceptInviteRequest {
  token: string
  password: string
}
