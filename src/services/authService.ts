import { api } from '@/lib/api'
import type { LoginRequest, LoginResponse } from '@/types/auth'

/** POST /auth/login — autentica e retorna o token JWT. */
export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', payload)
  return data
}
