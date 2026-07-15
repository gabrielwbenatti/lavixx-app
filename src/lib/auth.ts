/**
 * Armazenamento do token JWT e dados basicos da sessao no localStorage.
 * (Simples para o inicio; depois pode virar um Context/estado global.)
 */
const TOKEN_KEY = 'lavixx.token'
const TENANT_NAME_KEY = 'lavixx.tenantName'
const ROLE_KEY = 'lavixx.role'

export function saveSession(token: string, tenantName?: string, role?: string): void {
  localStorage.setItem(TOKEN_KEY, token)
  if (tenantName) {
    localStorage.setItem(TENANT_NAME_KEY, tenantName)
  }
  if (role) {
    localStorage.setItem(ROLE_KEY, role)
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getTenantName(): string | null {
  return localStorage.getItem(TENANT_NAME_KEY)
}

export function getRole(): string | null {
  return localStorage.getItem(ROLE_KEY)
}

export function isAdmin(): boolean {
  return getRole() === 'admin'
}

export function isAuthenticated(): boolean {
  return Boolean(getToken())
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(TENANT_NAME_KEY)
  localStorage.removeItem(ROLE_KEY)
}
