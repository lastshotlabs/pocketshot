import { z } from 'zod'
import { extendComponentSchema } from '../../_base'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const NotificationItemSchema = extendComponentSchema({
  id: z.string().optional(),
  title: z.union([z.string(), FromRefSchema]),
  body: z.union([z.string(), FromRefSchema]).optional(),
  timestamp: z.union([z.string(), FromRefSchema]).optional(),
  read: z.union([z.boolean(), FromRefSchema]).optional().default(false),
  icon: z.string().optional(),
  onPress: ActionSchema.optional(),
  onDismiss: ActionSchema.optional(),
  testID: z.string().optional(),
})


