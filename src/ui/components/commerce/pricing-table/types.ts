import type { z } from 'zod'
import type { PricingTableSchema } from './schema'

export type PricingTableConfig = z.infer<typeof PricingTableSchema>

export type PricingTier = PricingTableConfig['tiers'][number]
