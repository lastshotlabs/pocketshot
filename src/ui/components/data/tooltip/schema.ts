import { z } from 'zod'
import { extendComponentSchema, slotsSchema } from '../../_base/schema'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'

export const TooltipSchema = extendComponentSchema({
  id: z.string().optional(),
  trigger: z.union([z.string(), FromRefSchema]),
  content: z.union([z.string(), FromRefSchema]),
  position: z.enum(['top', 'bottom', 'left', 'right']).optional().default('top'),
  slots: slotsSchema(['root', 'content', 'arrow']).optional(),
  testID: z.string().optional(),
})
