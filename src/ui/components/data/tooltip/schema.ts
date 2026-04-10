import { z } from 'zod'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()
const FromRefSchema = z.object({ from: z.string() })

export const TooltipSchema = z.object({
  id: z.string().optional(),
  trigger: z.union([z.string(), FromRefSchema]),
  content: z.union([z.string(), FromRefSchema]),
  position: z.enum(['top', 'bottom', 'left', 'right']).optional().default('top'),
  testID: z.string().optional(),
})
