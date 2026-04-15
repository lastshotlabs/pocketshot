import { z } from 'zod'
import type { Action } from '../../../actions/types'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import { extendComponentSchema } from '../../_base/schema'

const ActionSchema = z.custom<Action>()

export const StatCardSchema = extendComponentSchema({
  label: z.string(),
  value: z.union([z.string(), z.number(), FromRefSchema]),
  trend: z
    .object({
      direction: z.enum(['up', 'down', 'neutral']),
      value: z.string(),
    })
    .optional(),
  icon: z.string().optional(),
  onPress: ActionSchema.optional(),
})
