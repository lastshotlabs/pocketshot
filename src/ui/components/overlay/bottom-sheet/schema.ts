import { z } from 'zod'
import { extendComponentSchema, slotsSchema } from '../../_base/schema'

export const BottomSheetSchema = extendComponentSchema({
  id: z.string(),
  snapPoints: z.array(z.string()).optional().default(['50%']),
  title: z.string().optional(),
  showHandle: z.boolean().optional().default(true),
  closeOnBackdrop: z.boolean().optional().default(true),
  slots: slotsSchema([
    'root',
    'backdrop',
    'panel',
    'handleContainer',
    'handle',
    'title',
    'content',
  ]).optional(),
})
