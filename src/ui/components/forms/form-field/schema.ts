import { z } from 'zod'
import { extendComponentSchema } from '../../_base'

export const FormFieldSchema = extendComponentSchema({
  id: z.string().optional(),
  label: z.string().optional(),
  required: z.boolean().optional().default(false),
  helperText: z.string().optional(),
  errorKey: z.string().optional(),
  testID: z.string().optional(),
})
