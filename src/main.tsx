import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import { router } from '@/routes/router'
import { queryClient } from '@/lib/queryClient'
import { ToastProvider } from '@/lib/toastContext'
import { ToasterContainer } from '@/components/ToasterContainer'

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
