import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { getTenantName } from '@/lib/auth'

const shortcuts = [
  { to: '/painel', title: 'Painel do dia', desc: 'Fila e faturamento em tempo real.' },
  { to: '/ordens', title: 'Ordens de serviço', desc: 'Abra e acompanhe as ordens.' },
  { to: '/clientes', title: 'Clientes', desc: 'Cadastre e gerencie seus clientes.' },
  { to: '/veiculos', title: 'Veículos', desc: 'Vincule veículos aos clientes.' },
  { to: '/servicos', title: 'Serviços', desc: 'Monte o catálogo de serviços e preços.' },
]

/** Tela inicial do painel (dentro do AppLayout). */
export function HomePage() {
  const tenantName = getTenantName()

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Bem-vindo{tenantName ? `, ${tenantName}` : ''}! 🎉
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-300">
          Escolha por onde começar.
        </p>
      </header>

      <Link to="/atendimento">
        <Card className="mb-6 flex items-center justify-between bg-indigo-600 p-6 text-white transition-colors hover:bg-indigo-500">
          <div>
            <h2 className="text-lg font-bold">🚗 Atendimento rápido</h2>
            <p className="text-sm text-indigo-100">
              Chegou um cliente? Comece pela placa e abra a ordem em segundos.
            </p>
          </div>
          <span className="text-2xl">→</span>
        </Card>
      </Link>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {shortcuts.map((s) => (
          <Link key={s.to} to={s.to}>
            <Card className="h-full p-5 transition-colors hover:border-indigo-300 hover:bg-indigo-50/40 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/30">
              <h2 className="font-semibold text-slate-900 dark:text-white">{s.title}</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{s.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
