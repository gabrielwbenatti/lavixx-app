import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  Car,
  ClipboardList,
  CreditCard,
  Home,
  LayoutDashboard,
  LogOut,
  type LucideIcon,
  Receipt,
  Settings,
  ShoppingBag,
  UserCog,
  Users,
  Wrench,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { clearSession, getTenantName } from '@/lib/auth'
import { cn } from '@/lib/cn'

const navItems: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: '/home',             label: 'Início',              icon: Home,          end: true },
  { to: '/painel',           label: 'Painel do dia',       icon: LayoutDashboard },
  { to: '/relatorios',       label: 'Fechamento de caixa', icon: BarChart3 },
  { to: '/despesas',         label: 'Despesas',            icon: Receipt },
  { to: '/ordens',           label: 'Ordens de serviço',   icon: ClipboardList },
  { to: '/clientes',         label: 'Clientes',            icon: Users },
  { to: '/veiculos',         label: 'Veículos',            icon: Car },
  { to: '/servicos',         label: 'Serviços',            icon: Wrench },
  { to: '/produtos',         label: 'Produtos',            icon: ShoppingBag },
  { to: '/formas-pagamento', label: 'Formas de pagamento', icon: CreditCard },
  { to: '/usuarios',         label: 'Usuários',            icon: UserCog },
  { to: '/configuracoes',    label: 'Configurações',       icon: Settings },
]

export function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const tenantName = getTenantName()
  const [menuOpen, setMenuOpen] = useState(false)

  // Fecha o menu ao navegar
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  // Impede scroll do body quando o menu está aberto
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const handleLogout = () => {
    clearSession()
    navigate('/', { replace: true })
  }

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between px-6 py-5">
        <div>
          <span className="text-lg font-bold text-slate-900 dark:text-white">Lavixx</span>
          {tenantName && (
            <p className="mt-0.5 truncate text-xs text-slate-400" title={tenantName}>
              {tenantName}
            </p>
          )}
        </div>
        <button
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
          onClick={() => setMenuOpen(false)}
          aria-label="Fechar menu"
        >
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
              )
            }
          >
            <Icon size={18} strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3">
        <Button variant="ghost" onClick={handleLogout} className="w-full justify-start gap-3">
          <LogOut size={18} strokeWidth={1.75} />
          Sair
        </Button>
      </div>
    </>
  )

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Top bar mobile */}
      <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden dark:border-slate-800 dark:bg-slate-900">
        <span className="text-lg font-bold text-slate-900 dark:text-white">Lavixx</span>
        <button
          className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          onClick={() => setMenuOpen(true)}
          aria-label="Abrir menu"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {/* Backdrop mobile */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Sidebar desktop (estática) */}
      <aside className="hidden w-60 flex-shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 md:flex">
        {sidebarContent}
      </aside>

      {/* Sidebar mobile (slide-out) */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-200 dark:border-slate-800 dark:bg-slate-900 md:hidden',
          menuOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {sidebarContent}
      </aside>

      <main className="flex-1 overflow-x-hidden px-4 pb-8 pt-20 md:px-8 md:py-8 md:pt-8">
        <Outlet />
      </main>
    </div>
  )
}
