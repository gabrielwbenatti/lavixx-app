import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/cn'

/**
 * Falha ao baixar o chunk de uma rota lazy. Acontece tipicamente logo apos um deploy:
 * a aba aberta ainda referencia arquivos com hash antigo, que ja nao existem no servidor.
 */
function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return /dynamically imported module|Importing a module script failed|Failed to fetch/i.test(message)
}

/**
 * Tela de erro das rotas (errorElement). Importada diretamente, sem lazy, para
 * continuar funcionando mesmo quando o problema e justamente carregar chunks.
 */
export function RouteErrorPage({ fullScreen = false }: { fullScreen?: boolean }) {
  const error = useRouteError()

  let title = 'Algo deu errado'
  let description = 'Ocorreu um erro inesperado ao exibir esta tela. Tente recarregar a página.'

  if (isChunkLoadError(error)) {
    title = 'Nova versão disponível'
    description = 'O Lavixx foi atualizado. Recarregue a página para continuar usando a versão mais recente.'
  } else if (isRouteErrorResponse(error) && error.status === 404) {
    title = 'Página não encontrada'
    description = 'O endereço acessado não existe.'
  }

  if (import.meta.env.DEV) {
    console.error(error)
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center px-4',
        fullScreen ? 'min-h-screen bg-slate-50 dark:bg-slate-950' : 'py-16',
      )}
    >
      <Card className="w-full max-w-md p-8 text-center">
        <AlertTriangle className="mx-auto text-amber-500" size={40} strokeWidth={1.75} />
        <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">{title}</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{description}</p>

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={() => window.location.reload()}>Recarregar</Button>
          <Link to="/home">
            <Button variant="outline" className="w-full">
              Ir para o início
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
