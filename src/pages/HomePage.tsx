import { Link } from 'react-router-dom'
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

const shortcuts = [
  { to: '/painel',   title: 'Painel do dia',      desc: 'Fila e faturamento em tempo real.', icon: BarChart3 },
  { to: '/ordens',   title: 'Ordens de serviço',  desc: 'Abra e acompanhe as ordens.',       icon: ClipboardList },
  { to: '/clientes', title: 'Clientes',            desc: 'Cadastre e gerencie seus clientes.', icon: Users },
  { to: '/veiculos', title: 'Veículos',            desc: 'Vincule veículos aos clientes.',    icon: Car },
  { to: '/servicos', title: 'Serviços',            desc: 'Monte o catálogo de serviços e preços.', icon: Wrench },
]

export function HomePage() {
  const tenantName = getTenantName()

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
