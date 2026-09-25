import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, ShoppingBag } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Field } from '@/components/ui/Field'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { getApiErrorMessage } from '@/lib/api'
import { formatCurrency } from '@/lib/format'
import {
  productSchema,
  type ProductFormInput,
  type ProductFormOutput,
} from '@/lib/schemas/productSchema'
import {
  createProduct,
  deleteProduct,
  listProducts,
  updateProduct,
} from '@/services/productService'
import type { ProductResponse } from '@/types/product'

export function ProductsPage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ProductResponse | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    data: products,
    isLoading,
    isError,
    error,
  } = useQuery({ queryKey: ['products'], queryFn: listProducts })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormInput, unknown, ProductFormOutput>({
    resolver: zodResolver(productSchema),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['products'] })

  const saveMutation = useMutation({
    mutationFn: (form: ProductFormOutput) =>
      editing ? updateProduct(editing.id, form) : createProduct(form),
    onSuccess: () => {
      invalidate()
      closeDialog()
    },
    onError: (err) => setFormError(getApiErrorMessage(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: invalidate,
  })

  const openCreate = () => {
    setEditing(null)
    setFormError(null)
    reset({ name: '', price: '' })
    setDialogOpen(true)
  }

  const openEdit = (product: ProductResponse) => {
    setEditing(product)
    setFormError(null)
    reset({ name: product.name, price: String(product.price) })
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditing(null)
  }

  const handleDelete = (product: ProductResponse) => {
    if (window.confirm(`Excluir o produto "${product.name}"?`)) {
      deleteMutation.mutate(product.id)
    }
  }

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
            <ShoppingBag size={20} strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Produtos</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Catálogo de produtos para venda e seus preços.
            </p>
          </div>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus size={16} />
          Novo produto
        </Button>
      </header>

      {isLoading && <p className="text-sm text-slate-500">Carregando…</p>}
      {isError && <p className="text-sm text-red-500">{getApiErrorMessage(error)}</p>}

      {products && products.length === 0 && (
        <Card className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
          Nenhum produto cadastrado ainda. Clique em “Novo produto”.
        </Card>
      )}

      {products && products.length > 0 && (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-3 font-medium">Produto</th>
                <th className="px-4 py-3 font-medium">Preço</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                >
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">
                    {product.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {formatCurrency(product.price)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" className="h-9 px-3" onClick={() => openEdit(product)}>
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        className="h-9 px-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={() => handleDelete(product)}
                      >
                        Excluir
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        title={editing ? 'Editar produto' : 'Novo produto'}
      >
        {formError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {formError}
          </div>
        )}
        <form
          onSubmit={handleSubmit((form) => {
            setFormError(null)
            saveMutation.mutate(form)
          })}
          className="flex flex-col gap-4"
          noValidate
        >
          <Field label="Nome do produto" htmlFor="name" error={errors.name?.message}>
            <Input id="name" placeholder="Ex.: Aromatizante" invalid={!!errors.name} {...register('name')} />
          </Field>
          <Field label="Preço (R$)" htmlFor="price" error={errors.price?.message}>
            <Input
              id="price"
              inputMode="decimal"
              placeholder="0,00"
              invalid={!!errors.price}
              {...register('price')}
            />
          </Field>
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || saveMutation.isPending}>
              {saveMutation.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
