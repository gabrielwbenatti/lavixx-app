import type { ServiceResponse } from '@/types/service'
import type { VehicleSize } from '@/types/vehicle'

/**
 * Preço de tabela do serviço para o porte do veículo; sem porte (ou sem preço específico
 * para ele) vale o preço padrão. Espelha Service.priceFor da API, que é quem grava o preço
 * no item da OS — aqui serve só para exibir/estimar na tela.
 */
export function servicePriceFor(
  service: Pick<ServiceResponse, 'price' | 'priceSmall' | 'priceMedium' | 'priceLarge'>,
  size: VehicleSize | null | undefined,
): number {
  const specific =
    size === 'small'
      ? service.priceSmall
      : size === 'medium'
        ? service.priceMedium
        : size === 'large'
          ? service.priceLarge
          : null
  return specific ?? service.price
}
