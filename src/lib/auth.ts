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

/** Atualiza o nome exibido na navegacao (ex.: apos renomear o estabelecimento). */
export function setTenantName(name: string): void {
  localStorage.setItem(TENANT_NAME_KEY, name)
}

export function getRole(): string | null {
  return localStorage.getItem(ROLE_KEY)
}

export function isAdmin(): boolean {
  return getRole() === 'admin'
}

/**
 * Le o `exp` (segundos desde epoch) do payload do JWT, sem validar a assinatura —
 * quem valida e a API; aqui so evitamos mostrar telas com um token ja vencido.
 * Retorna null se o token nao tiver `exp` ou nao puder ser lido.
 */
function getTokenExpiry(token: string): number | null {
  try {
    const payload = token.split('.')[1]
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const { exp } = JSON.parse(atob(base64)) as { exp?: unknown }
    return typeof exp === 'number' ? exp : null
  } catch {
    return null
  }
}

/** Ha token e ele nao esta vencido. Token vencido e descartado. */
export function isAuthenticated(): boolean {
  const token = getToken()
  if (!token) return false
  const exp = getTokenExpiry(token)
  if (exp !== null && exp * 1000 <= Date.now()) {
    clearSession()
    return false
  }
  return true
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(TENANT_NAME_KEY)
  localStorage.removeItem(ROLE_KEY)
}
