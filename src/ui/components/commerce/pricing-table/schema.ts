import { z } from 'zod'
import { extendComponentSchema, slotsSchema } from '../../_base/schema'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const PricingTableSchema = extendComponentSchema({
  id: z.string().optional(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  tiers: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      price: z.string(),
      period: z.string().optional(),
      description: z.string().optional(),
      features: z.array(z.string()),
      cta: z.object({
        label: z.string(),
        onPress: ActionSchema,
      }),
      highlighted: z.boolean().optional().default(false),
    }),
  ),
  highlightedLabel: z.string().default('Most Popular'),
  testID: z.string().optional(),
  slots: slotsSchema([
    'root',
    'container',
    'title',
    'subtitle',
    'tiersRow',
    'card',
    'popularBadge',
    'popularBadgeText',
    'tierName',
    'priceRow',
    'tierPrice',
    'tierPeriod',
    'divider',
    'tierDescription',
    'featureList',
    'featureRow',
    'featureCheck',
    'featureText',
    'ctaButton',
    'ctaButtonText',
  ]).optional(),
})
