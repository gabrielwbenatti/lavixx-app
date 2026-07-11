import type { ComponentType } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { AppLayout } from './AppLayout'

// Cada import() dinamico vira um chunk separado no build, carregado sob demanda
// quando o usuario navega ate a rota. O React Router espera que a funcao `lazy`
// resolva um objeto com `Component`, entao mapeamos o export nomeado da pagina.
const lazyRoute =
  (loader: () => Promise<Record<string, ComponentType>>, name: string) =>
  async () => ({ Component: (await loader())[name] })

export const router = createBrowserRouter([
  { path: '/', lazy: lazyRoute(() => import('@/pages/LandingPage'), 'LandingPage') },
  { path: '/registrar', lazy: lazyRoute(() => import('@/pages/RegisterPage'), 'RegisterPage') },
  { path: '/login', lazy: lazyRoute(() => import('@/pages/LoginPage'), 'LoginPage') },
  { path: '/definir-senha', lazy: lazyRoute(() => import('@/pages/AcceptInvitePage'), 'AcceptInvitePage') },
  {
    element: <ProtectedRoute />,
    children: [
      // Totem de atendimento: tela cheia, sem a navegação lateral.
      { path: '/atendimento', lazy: lazyRoute(() => import('@/pages/AtendimentoPage'), 'AtendimentoPage') },
      {
        element: <AppLayout />,
        children: [
          { path: '/home', lazy: lazyRoute(() => import('@/pages/HomePage'), 'HomePage') },
          { path: '/painel', lazy: lazyRoute(() => import('@/pages/PainelPage'), 'PainelPage') },
          { path: '/relatorios', lazy: lazyRoute(() => import('@/pages/RelatoriosPage'), 'RelatoriosPage') },
          { path: '/despesas', lazy: lazyRoute(() => import('@/pages/ExpensesPage'), 'ExpensesPage') },
          { path: '/clientes', lazy: lazyRoute(() => import('@/pages/CustomersPage'), 'CustomersPage') },
          { path: '/clientes/:id', lazy: lazyRoute(() => import('@/pages/CustomerDetailPage'), 'CustomerDetailPage') },
          { path: '/veiculos', lazy: lazyRoute(() => import('@/pages/VehiclesPage'), 'VehiclesPage') },
          { path: '/veiculos/:id', lazy: lazyRoute(() => import('@/pages/VehicleDetailPage'), 'VehicleDetailPage') },
          { path: '/servicos', lazy: lazyRoute(() => import('@/pages/ServicesPage'), 'ServicesPage') },
          { path: '/produtos', lazy: lazyRoute(() => import('@/pages/ProductsPage'), 'ProductsPage') },
          { path: '/formas-pagamento', lazy: lazyRoute(() => import('@/pages/PaymentMethodsPage'), 'PaymentMethodsPage') },
          { path: '/ordens', lazy: lazyRoute(() => import('@/pages/OrdersPage'), 'OrdersPage') },
          { path: '/ordens/:id', lazy: lazyRoute(() => import('@/pages/OrderDetailPage'), 'OrderDetailPage') },
          { path: '/agenda', lazy: lazyRoute(() => import('@/pages/AgendaPage'), 'AgendaPage') },
          { path: '/usuarios', lazy: lazyRoute(() => import('@/pages/UsersPage'), 'UsersPage') },
          { path: '/configuracoes', lazy: lazyRoute(() => import('@/pages/SettingsPage'), 'SettingsPage') },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
