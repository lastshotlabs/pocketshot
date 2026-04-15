import { z } from 'zod'
import { extendComponentSchema } from '../../_base'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const TooltipSchema = extendComponentSchema({
  id: z.string().optional(),
  trigger: z.union([z.string(), FromRefSchema]),
  content: z.union([z.string(), FromRefSchema]),
  position: z.enum(['top', 'bottom', 'left', 'right']).optional().default('top'),
  testID: z.string().optional(),
})
