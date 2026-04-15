import { z } from 'zod'
import { extendComponentSchema } from '../../_base'

export const PopoverSchema = extendComponentSchema({
  id: z.string(),
  triggerLabel: z.string(),
  triggerIcon: z.string().optional(),
  title: z.string().optional(),
  content: z.string(),
  position: z.enum(['top', 'bottom', 'left', 'right']).optional().default('bottom'),
  closeOnBackdrop: z.boolean().optional().default(true),
  testID: z.string().optional(),
})
