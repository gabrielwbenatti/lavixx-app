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

// Se a API responder 401, a sessao expirou/invalidou -> limpa o token.
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      clearSession()
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
