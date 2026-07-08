/** Espelha LoyaltyStatusResponse da API (cartão-fidelidade de um cliente). */
export interface LoyaltyStatus {
  enabled: boolean
  /** Nº de lavagens concluídas para ganhar um prêmio. */
  target: number
  /** Prêmio: % de desconto na OS (100 = grátis). */
  rewardPercent: number
  completedWashes: number
  rewardsRedeemed: number
  /** Prêmios disponíveis para resgatar agora. */
  rewardsAvailable: number
  /** Selos no cartão atual (completedWashes % target). */
  stampsInCurrentCard: number
  /** Lavagens que faltam para o próximo prêmio. */
  washesUntilNextReward: number
}
