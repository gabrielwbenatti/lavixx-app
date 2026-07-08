import { api } from '@/lib/api'
import type {
  TenantRegistrationRequest,
  TenantRegistrationResponse,
  TenantResponse,
} from '@/types/tenant'

/** POST /tenants — cadastra o estabelecimento + usuario admin e retorna o token. */
export async function registerTenant(
  payload: TenantRegistrationRequest,
): Promise<TenantRegistrationResponse> {
  const { data } = await api.post<TenantRegistrationResponse>('/tenants', payload)
  return data
}

/** GET /tenants/me — dados e configurações do estabelecimento atual. */
export async function getCurrentTenant(): Promise<TenantResponse> {
  const { data } = await api.get<TenantResponse>('/tenants/me')
  return data
}
