import { Navigate, Outlet } from 'react-router-dom'
import { isAuthenticated } from '@/lib/auth'

/** Bloqueia rotas para quem nao esta autenticado, redirecionando para o login. */
export function ProtectedRoute() {
  return isAuthenticated() ? <Outlet /> : <Navigate to="/login" replace />
}
