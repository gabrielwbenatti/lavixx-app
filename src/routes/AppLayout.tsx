import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { clearSession, getTenantName } from '@/lib/auth'
import { cn } from '@/lib/cn'

const navItems = [
  { to: '/home', label: 'Início', end: true },
  { to: '/painel', label: 'Painel do dia' },
  { to: '/relatorios', label: 'Fechamento de caixa' },
  { to: '/ordens', label: 'Ordens de serviço' },
  { to: '/clientes', label: 'Clientes' },
  { to: '/veiculos', label: 'Veículos' },
  { to: '/servicos', label: 'Serviços' },
  { to: '/formas-pagamento', label: 'Formas de pagamento' },
]

/** Layout do painel autenticado: barra lateral de navegação + conteúdo. */
export function AppLayout() {
  const navigate = useNavigate()
  const tenantName = getTenantName()

  const handleLogout = () => {
    clearSession()
    navigate('/', { replace: true })
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <aside className="flex w-60 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="px-6 py-5">
          <span className="text-lg font-bold text-slate-900 dark:text-white">Lavixx</span>
          {tenantName && (
            <p className="mt-0.5 truncate text-xs text-slate-400" title={tenantName}>
              {tenantName}
            </p>
          )}
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3">
          <Button variant="ghost" onClick={handleLogout} className="w-full justify-start">
            Sair
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden px-8 py-8">
        <Outlet />
      </main>
    </div>
  )
}
