import { z } from 'zod'

export const ActionSheetSchema = z.object({
  id: z.string().optional(),
})
