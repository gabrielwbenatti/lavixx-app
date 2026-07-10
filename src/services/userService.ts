import { api } from '@/lib/api'
import type {
  InviteResponse,
  InviteUserRequest,
  UserResponse,
  UserRole,
} from '@/types/user'

export async function listUsers(): Promise<UserResponse[]> {
  const { data } = await api.get<UserResponse[]>('/users')
  return data
}

export async function inviteUser(payload: InviteUserRequest): Promise<InviteResponse> {
  const { data } = await api.post<InviteResponse>('/users', payload)
  return data
}

export async function resendInvite(id: string): Promise<InviteResponse> {
  const { data } = await api.post<InviteResponse>(`/users/${id}/resend-invite`)
  return data
}

export async function updateUserRole(id: string, role: UserRole): Promise<UserResponse> {
  const { data } = await api.patch<UserResponse>(`/users/${id}/role`, { role })
  return data
}

export async function setUserActive(id: string, active: boolean): Promise<UserResponse> {
  const { data } = await api.patch<UserResponse>(`/users/${id}/active`, { active })
  return data
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/users/${id}`)
}
