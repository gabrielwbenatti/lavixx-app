import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart3,
  Car,
  ChevronRight,
  ClipboardList,
  Users,
  Wrench,
  Zap,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { getTenantName } from '@/lib/auth'
import { listServices } from '@/services/serviceService'
import { listProducts } from '@/services/productService'

const shortcuts = [
  { to: '/painel',   title: 'Painel do dia',      desc: 'Fila e faturamento em tempo real.', icon: BarChart3 },
  { to: '/ordens',   title: 'Ordens de serviço',  desc: 'Abra e acompanhe as ordens.',       icon: ClipboardList },
  { to: '/clientes', title: 'Clientes',            desc: 'Cadastre e gerencie seus clientes.', icon: Users },
  { to: '/veiculos', title: 'Veículos',            desc: 'Vincule veículos aos clientes.',    icon: Car },
  { to: '/servicos', title: 'Serviços',            desc: 'Monte o catálogo de serviços e preços.', icon: Wrench },
]

export function HomePage() {
  const tenantName = getTenantName()
  const servicesQuery = useQuery({ queryKey: ['services'], queryFn: listServices })
  const productsQuery = useQuery({ queryKey: ['products'], queryFn: listProducts })
  // Sem nada vendável (nenhum serviço nem produto) não há como abrir OS/venda.
  const noCatalog =
    servicesQuery.isSuccess &&
    productsQuery.isSuccess &&
    servicesQuery.data.length === 0 &&
    productsQuery.data.length === 0

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Bem-vindo{tenantName ? `, ${tenantName}` : ''}!
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-300">
          Escolha por onde começar.
        </p>
      </header>

      {noCatalog ? (
        <Card className="mb-6 flex flex-wrap items-center justify-between gap-4 border-dashed border-slate-300 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <Zap size={24} strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200">
                Atendimento rápido
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Cadastre ao menos um serviço ou produto para liberar o atendimento.
              </p>
            </div>
          </div>
          <Link
            to="/servicos"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
          >
            <Wrench size={16} />
            Cadastrar serviço
          </Link>
        </Card>
      ) : (
        <Link to="/atendimento">
          <Card className="mb-6 flex items-center justify-between bg-indigo-600 p-6 text-white transition-colors hover:bg-indigo-500">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                <Zap size={24} strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-lg font-bold">Atendimento rápido</h2>
                <p className="text-sm text-indigo-100">
                  Chegou um cliente? Comece pela placa e abra a ordem em segundos.
                </p>
              </div>
            </div>
            <ChevronRight size={24} className="shrink-0 opacity-70" />
          </Card>
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {shortcuts.map(({ to, title, desc, icon: Icon }) => (
          <Link key={to} to={to}>
            <Card className="flex h-full flex-col gap-3 p-5 transition-colors hover:border-indigo-300 hover:bg-indigo-50/40 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/30">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                <Icon size={20} strokeWidth={1.75} />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-white">{title}</h2>
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{desc}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
