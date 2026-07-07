import { createBrowserRouter, Navigate } from 'react-router-dom'
import { LandingPage } from '@/pages/LandingPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { LoginPage } from '@/pages/LoginPage'
import { HomePage } from '@/pages/HomePage'
import { CustomersPage } from '@/pages/CustomersPage'
import { ServicesPage } from '@/pages/ServicesPage'
import { VehiclesPage } from '@/pages/VehiclesPage'
import { OrdersPage } from '@/pages/OrdersPage'
import { OrderDetailPage } from '@/pages/OrderDetailPage'
import { AtendimentoPage } from '@/pages/AtendimentoPage'
import { PainelPage } from '@/pages/PainelPage'
import { PaymentMethodsPage } from '@/pages/PaymentMethodsPage'
import { RelatoriosPage } from '@/pages/RelatoriosPage'
import { ProtectedRoute } from './ProtectedRoute'
import { AppLayout } from './AppLayout'

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/registrar', element: <RegisterPage /> },
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      // Totem de atendimento: tela cheia, sem a navegação lateral.
      { path: '/atendimento', element: <AtendimentoPage /> },
      {
        element: <AppLayout />,
        children: [
          { path: '/home', element: <HomePage /> },
          { path: '/painel', element: <PainelPage /> },
          { path: '/relatorios', element: <RelatoriosPage /> },
          { path: '/clientes', element: <CustomersPage /> },
          { path: '/veiculos', element: <VehiclesPage /> },
          { path: '/servicos', element: <ServicesPage /> },
          { path: '/formas-pagamento', element: <PaymentMethodsPage /> },
          { path: '/ordens', element: <OrdersPage /> },
          { path: '/ordens/:id', element: <OrderDetailPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
