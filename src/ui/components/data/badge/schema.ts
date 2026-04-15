import { z } from 'zod'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import { extendComponentSchema } from '../../_base/schema'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const BadgeSchema = extendComponentSchema({
  id: z.string().optional(),
  label: z.union([z.string(), FromRefSchema]),
  variant: z
    .enum(['default', 'primary', 'success', 'warning', 'error', 'info'])
    .optional()
    .default('default'),
  size: z.enum(['sm', 'md', 'lg']).optional().default('md'),
  onPress: ActionSchema.optional(),
  testID: z.string().optional(),
})
