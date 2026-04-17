import type { z } from 'zod'
import type { PricingTableSchema } from './schema'

export type PricingTableConfig = z.input<typeof PricingTableSchema>

export type PricingTier = PricingTableConfig['tiers'][number]
