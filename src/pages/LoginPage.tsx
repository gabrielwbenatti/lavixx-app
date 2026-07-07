import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

/**
 * Placeholder da tela de login.
 * O fluxo de autenticacao (POST /auth/login) sera implementado na proxima etapa.
 */
export function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <Card className="w-full max-w-md p-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Entrar</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          A tela de login sera construida na proxima etapa.
        </p>
        <Link to="/registrar" className="mt-6 inline-block">
          <Button variant="outline">Ir para o cadastro</Button>
        </Link>
      </Card>
    </div>
  )
}
