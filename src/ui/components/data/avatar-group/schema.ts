import { z } from 'zod'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import { extendComponentSchema, slotsSchema } from '../../_base/schema'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

const AvatarItemSchema = z.object({
  src: z.string().optional(),
  name: z.string().optional(),
})

export const AvatarGroupSchema = extendComponentSchema({
  id: z.string().optional(),
  avatars: z.union([z.array(AvatarItemSchema), FromRefSchema]),
  maxVisible: z.number().int().positive().optional().default(4),
  size: z.enum(['xs', 'sm', 'md', 'lg']).optional().default('sm'),
  overlap: z.number().optional().default(8),
  slots: slotsSchema(['root', 'item', 'image', 'initials', 'overflow']).optional(),
  onPress: ActionSchema.optional(),
  testID: z.string().optional(),
})
