export interface EntitlementAccessSource {
  canAccess(productId: string): boolean
}

export interface FeatureEntitlementRule {
  /** At least one product must be accessible. */
  anyOf?: readonly string[]
  /** Every product must be accessible. */
  allOf?: readonly string[]
}

export type FeatureEntitlementMap<Feature extends string = string> = Record<
  Feature,
  FeatureEntitlementRule
>

/**
 * Central feature-to-store-product mapping. Product IDs stay in release
 * configuration while screens and domain controllers ask about stable features.
 */
export class FeatureEntitlementGate<Feature extends string = string> {
  private readonly rules: FeatureEntitlementMap<Feature>

  constructor(
    rules: FeatureEntitlementMap<Feature>,
    private readonly source: EntitlementAccessSource,
  ) {
    this.rules = structuredClone(rules)
    for (const [feature, rule] of Object.entries<FeatureEntitlementRule>(this.rules)) {
      const anyOf = uniqueProducts(rule.anyOf)
      const allOf = uniqueProducts(rule.allOf)
      if (!feature.trim() || (anyOf.length === 0 && allOf.length === 0)) {
        throw new Error('Every feature entitlement rule requires a feature and product')
      }
      if (anyOf.length !== (rule.anyOf?.length ?? 0) || allOf.length !== (rule.allOf?.length ?? 0)) {
        throw new Error(`Feature entitlement rule contains duplicate or invalid products: ${feature}`)
      }
    }
  }

  canAccess(feature: Feature): boolean {
    const rule = this.rules[feature]
    if (!rule) return false
    const any = rule.anyOf ?? []
    const all = rule.allOf ?? []
    return (
      (any.length === 0 || any.some((productId) => this.source.canAccess(productId))) &&
      all.every((productId) => this.source.canAccess(productId))
    )
  }

  inaccessibleProducts(feature: Feature): string[] {
    const rule = this.rules[feature]
    if (!rule) return []
    const missingAll = (rule.allOf ?? []).filter((productId) => !this.source.canAccess(productId))
    const any = rule.anyOf ?? []
    const missingAny =
      any.length > 0 && !any.some((productId) => this.source.canAccess(productId)) ? any : []
    return [...new Set([...missingAll, ...missingAny])]
  }
}

function uniqueProducts(products: readonly string[] | undefined): string[] {
  return [...new Set((products ?? []).map((product) => product.trim()).filter(Boolean))]
}
