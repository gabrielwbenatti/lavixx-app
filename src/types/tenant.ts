/** Espelha os DTOs da API Lavixx (com.benattidev.lavixx.dto.tenant). */

/** Payload de POST /tenants (TenantRegistrationRequest). */
export interface TenantRegistrationRequest {
  name: string
  document: string
  adminName: string
  adminEmail: string
  adminPassword: string
}

/** Resposta de POST /tenants (TenantRegistrationResponse). */
export interface TenantRegistrationResponse {
  tenantId: string
  tenantName: string
  adminUserId: string
  adminEmail: string
  token: string
}
