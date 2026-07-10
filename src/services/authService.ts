import { api } from '@/lib/api'
import type { LoginRequest, LoginResponse } from '@/types/auth'
import type { AcceptInviteRequest, InvitePreviewResponse } from '@/types/user'

/** POST /auth/login — autentica e retorna o token JWT. */
export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', payload)
  return data
}

/** GET /auth/invite/{token} — dados do convite para a tela de definir senha (público). */
export async function getInvitePreview(token: string): Promise<InvitePreviewResponse> {
  const { data } = await api.get<InvitePreviewResponse>(`/auth/invite/${token}`)
  return data
}

/** POST /auth/accept-invite — define a senha, ativa o usuário e já retorna o JWT (público). */
export async function acceptInvite(payload: AcceptInviteRequest): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/accept-invite', payload)
  return data
}
