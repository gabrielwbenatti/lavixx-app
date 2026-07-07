/**
 * Armazenamento do token JWT e dados basicos da sessao no localStorage.
 * (Simples para o inicio; depois pode virar um Context/estado global.)
 */
const TOKEN_KEY = 'lavixx.token'
const TENANT_NAME_KEY = 'lavixx.tenantName'

export function saveSession(token: string, tenantName?: string): void {
  localStorage.setItem(TOKEN_KEY, token)
  if (tenantName) {
    localStorage.setItem(TENANT_NAME_KEY, tenantName)
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getTenantName(): string | null {
  return localStorage.getItem(TENANT_NAME_KEY)
}

export function isAuthenticated(): boolean {
  return Boolean(getToken())
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(TENANT_NAME_KEY)
}
