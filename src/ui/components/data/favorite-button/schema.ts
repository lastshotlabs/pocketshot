import { z } from 'zod'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const FavoriteButtonSchema = z.object({
  id: z.string().optional(),
  value: z.union([z.boolean(), FromRefSchema]).optional(),
  defaultValue: z.boolean().default(false),
  variant: z.enum(['heart', 'star']).default('heart'),
  size: z.enum(['sm', 'md', 'lg']).default('md'),
  activeColor: z.string().optional(),
  onToggleAction: ActionSchema.optional(),
  testID: z.string().optional(),
})
