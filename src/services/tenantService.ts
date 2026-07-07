import { api } from '@/lib/api'
import type {
  TenantRegistrationRequest,
  TenantRegistrationResponse,
} from '@/types/tenant'

/** POST /tenants — cadastra o estabelecimento + usuario admin e retorna o token. */
export async function registerTenant(
  payload: TenantRegistrationRequest,
): Promise<TenantRegistrationResponse> {
  const { data } = await api.post<TenantRegistrationResponse>('/tenants', payload)
  return data
}
