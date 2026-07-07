import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

/** Tela de entrada da plataforma: apresenta o produto e leva ao login ou cadastro. */
export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-xl text-center">
        <span className="inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
          Gestao de lava-rapido
        </span>
        <h1 className="mt-6 text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
          Lavixx
        </h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
          Controle clientes, veiculos, servicos e ordens de servico do seu
          estabelecimento em um so lugar.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/registrar" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">Criar minha conta</Button>
          </Link>
          <Link to="/login" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto">
              Ja tenho conta
            </Button>
          </Link>
        </div>
      </div>

      <footer className="mt-16 text-xs text-slate-400">
        Lavixx &copy; {new Date().getFullYear()}
      </footer>
    </div>
  )
}
