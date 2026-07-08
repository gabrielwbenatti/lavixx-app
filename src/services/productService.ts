import { api } from '@/lib/api'
import type { ProductRequest, ProductResponse } from '@/types/product'

export async function listProducts(): Promise<ProductResponse[]> {
  const { data } = await api.get<ProductResponse[]>('/products')
  return data
}

export async function createProduct(payload: ProductRequest): Promise<ProductResponse> {
  const { data } = await api.post<ProductResponse>('/products', payload)
  return data
}

export async function updateProduct(
  id: string,
  payload: ProductRequest,
): Promise<ProductResponse> {
  const { data } = await api.put<ProductResponse>(`/products/${id}`, payload)
  return data
}

export async function deleteProduct(id: string): Promise<void> {
  await api.delete(`/products/${id}`)
}
