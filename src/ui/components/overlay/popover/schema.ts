import { z } from 'zod'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import type { Action } from '../../../actions/types'
const ActionSchema = z.custom<Action>()

void ActionSchema
void FromRefSchema

export const PopoverSchema = z.object({
  id: z.string(),
  triggerLabel: z.string(),
  triggerIcon: z.string().optional(),
  title: z.string().optional(),
  content: z.string(),
  position: z.enum(['top', 'bottom', 'left', 'right']).optional().default('bottom'),
  closeOnBackdrop: z.boolean().optional().default(true),
  testID: z.string().optional(),
})
