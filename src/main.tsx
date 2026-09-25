import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import { router } from '@/routes/router'
import { queryClient } from '@/lib/queryClient'
import { ToastProvider } from '@/lib/toastContext'
import { ToasterContainer } from '@/components/ToasterContainer'
import { setUnauthorizedHandler } from '@/lib/api'

// Sessao expirada: descarta os dados em cache (sao do tenant anterior) e volta ao login,
// guardando a rota atual para retornar a ela depois.
setUnauthorizedHandler(() => {
  queryClient.clear()
  const { pathname, search } = router.state.location
  if (pathname === '/login') return
  router.navigate('/login', { replace: true, state: { from: pathname + search, expired: true } })
})

// Chunk de uma rota nao encontrado (aba aberta antes de um deploy): recarrega uma vez para
// buscar a versao nova. Se falhar de novo em seguida, deixa o erro seguir para o errorElement.
window.addEventListener('vite:preloadError', (event) => {
  const RELOAD_KEY = 'lavixx.chunkReloadAt'
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0)
    if (Date.now() - last < 10_000) return
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()))
  } catch {
    return
  }
  event.preventDefault()
  window.location.reload()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <RouterProvider router={router} />
        <ToasterContainer />
      </ToastProvider>
    </QueryClientProvider>
  </StrictMode>,
)
