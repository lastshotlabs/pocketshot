import { z } from 'zod'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import { extendComponentSchema, slotsSchema } from '../../_base/schema'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const AvatarSchema = extendComponentSchema({
  id: z.string().optional(),
  src: z.union([z.string(), FromRefSchema]).optional(),
  name: z.union([z.string(), FromRefSchema]).optional(),
  size: z.enum(['xs', 'sm', 'md', 'lg', 'xl']).optional().default('md'),
  shape: z.enum(['circle', 'rounded', 'square']).optional().default('circle'),
  slots: slotsSchema(['root', 'image', 'initials', 'fallback']).optional(),
  onPress: ActionSchema.optional(),
  testID: z.string().optional(),
})
