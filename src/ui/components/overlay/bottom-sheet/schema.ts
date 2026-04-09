import { z } from 'zod'

export const BottomSheetSchema = z.object({
  id: z.string(),
  snapPoints: z.array(z.string()).optional().default(['50%']),
  title: z.string().optional(),
  showHandle: z.boolean().optional().default(true),
  closeOnBackdrop: z.boolean().optional().default(true),
  testID: z.string().optional(),
})
