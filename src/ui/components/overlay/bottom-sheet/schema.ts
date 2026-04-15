import { z } from 'zod'
import { extendComponentSchema } from '../../_base'

export const BottomSheetSchema = extendComponentSchema({
  id: z.string(),
  snapPoints: z.array(z.string()).optional().default(['50%']),
  title: z.string().optional(),
  showHandle: z.boolean().optional().default(true),
  closeOnBackdrop: z.boolean().optional().default(true),
  testID: z.string().optional(),
})
