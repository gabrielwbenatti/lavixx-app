/** Espelha os DTOs da API Lavixx (com.benattidev.lavixx.dto.tenant). */

/** Payload de POST /tenants (TenantRegistrationRequest). */
export interface TenantRegistrationRequest {
  name: string
  document: string
  adminName: string
  adminEmail: string
  adminPassword: string
  /** Fuso IANA do estabelecimento; se omitido (ou inválido), a API usa America/Sao_Paulo. */
  timezone?: string
}

/** Resposta de POST /tenants (TenantRegistrationResponse). */
export interface TenantRegistrationResponse {
  tenantId: string
  tenantName: string
  adminUserId: string
  adminEmail: string
  token: string
}

/** Resposta de GET/PATCH /tenants/me (TenantResponse). */
export interface TenantResponse {
  id: string
  name: string
  document: string
  /** Fuso IANA do estabelecimento (define onde o "dia" começa e termina nos relatórios). */
  timezone: string
  operatingHoursStart: string
  operatingHoursEnd: string
  /** Taxa de serviço padrão (%) aplicada a novas ordens. */
  defaultServiceTax: number
  /** Programa de fidelidade (cartão) habilitado. */
  loyaltyEnabled: boolean
  /** Nº de lavagens concluídas para ganhar um prêmio. */
  loyaltyTarget: number
  /** Prêmio: % de desconto na OS ao resgatar (100 = grátis). */
  loyaltyRewardPercent: number
}
