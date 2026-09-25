import axios, { AxiosError } from 'axios'
import { getToken, clearSession } from './auth'

/**
 * Cliente HTTP para a API Lavixx.
 * baseURL = /api -> o proxy do Vite (vite.config.ts) redireciona para http://localhost:8080 em dev.
 */
export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Anexa o token JWT (quando existir) em toda requisicao.
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let onUnauthorized: (() => void) | null = null

/**
 * Registra o que fazer quando a sessao cair (401 numa requisicao autenticada).
 * Fica fora deste modulo para o cliente HTTP nao depender do router.
 */
export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler
}

// Se a API responder 401 a uma requisicao que levava token, a sessao expirou/invalidou.
// Requisicoes sem token (ex.: login com senha errada) apenas propagam o erro.
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && error.config?.headers.Authorization) {
      clearSession()
      onUnauthorized?.()
    }
    return Promise.reject(error)
  },
)

/** Formato de erro padronizado da API (ErrorResponse). */
interface ApiErrorBody {
  timestamp?: string
  status?: number
  erro?: string
  mensagem?: string
}

/** Extrai a mensagem amigavel de um erro do Axios. */
export function getApiErrorMessage(error: unknown, fallback = 'Ocorreu um erro inesperado.'): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiErrorBody | undefined
    if (body?.mensagem) return body.mensagem
    if (body?.erro) return body.erro
    if (error.code === 'ERR_NETWORK') {
      return 'Nao foi possivel conectar a API. Verifique se o servidor esta rodando.'
    }
  }
  return fallback
}
