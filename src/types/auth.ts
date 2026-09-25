/** Espelha os DTOs de autenticação da API (com.benattidev.lavixx.dto.auth). */

/** Payload de POST /auth/login (LoginRequest). */
export interface LoginRequest {
  email: string
  password: string
}

/** Resposta de POST /auth/login (LoginResponse). */
export interface LoginResponse {
  token: string
  userId: string
  tenantId: string
  tenantName: string
  email: string
  role: string
}
