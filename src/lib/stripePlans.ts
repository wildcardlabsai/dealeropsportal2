// Mapping between Stripe product/price IDs and internal plan tiers
export const STRIPE_PLANS = {
  starter: {
    product_id: "prod_Tzs1NZUKGEA4a4",
    price_id: "price_1T1sHQEIt2zwJjCt6zTU6Ksq",
  },
  professional: {
    product_id: "prod_Tzs2bntmKaRf2N",
    price_id: "price_1T1sIYEIt2zwJjCt0LcZWrLb",
  },
  elite: {
    product_id: "prod_Tzs9ZhOe7EKYJz",
    price_id: "price_1T1sPIEIt2zwJjCtsiGdtc1L",
  },
} as const;

export function getTierByProductId(productId: string): string | null {
  for (const [tier, ids] of Object.entries(STRIPE_PLANS)) {
    if (ids.product_id === productId) return tier;
  }
  return null;
}

export function getTierByPriceId(priceId: string): string | null {
  for (const [tier, ids] of Object.entries(STRIPE_PLANS)) {
    if (ids.price_id === priceId) return tier;
  }
  return null;
}
