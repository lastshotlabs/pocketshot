import { z } from 'zod'
import { extendComponentSchema } from '../../_base/schema'

export const ActionSheetSchema = extendComponentSchema({
  id: z.string().optional(),
})
