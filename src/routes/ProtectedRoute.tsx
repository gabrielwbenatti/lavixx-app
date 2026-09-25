import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { isAuthenticated } from '@/lib/auth'

/** Bloqueia rotas para quem nao esta autenticado, redirecionando para o login. */
export function ProtectedRoute() {
  const location = useLocation()
  if (isAuthenticated()) {
    return <Outlet />
  }
  // Guarda a rota atual para retornar a ela apos o login.
  return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
}
