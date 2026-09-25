import { useState, useCallback } from 'react'
import { toDateInput } from '@/lib/datetime'
import type { ServiceStatus } from '@/types/serviceOrder'

export interface OrderFilters {
  status?: ServiceStatus
  fromDate?: string
  toDate?: string
  minAmount?: number
  maxAmount?: number
}

export function useOrderFilters(initialFilters?: OrderFilters) {
  const [filters, setFilters] = useState<OrderFilters>(initialFilters || {})

  const setFilter = useCallback(<K extends keyof OrderFilters>(key: K, value: OrderFilters[K]) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({})
  }, [])

  const setDateRange = useCallback((fromDate?: Date, toDate?: Date) => {
    setFilters((prev) => ({
      ...prev,
      fromDate: fromDate ? toDateInput(fromDate) : undefined,
      toDate: toDate ? toDateInput(toDate) : undefined,
    }))
  }, [])

  return {
    filters,
    setFilter,
    clearFilters,
    setDateRange,
  }
}
