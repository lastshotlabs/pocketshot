import { z } from 'zod'

export const FormFieldSchema = z.object({
  id: z.string().optional(),
  label: z.string().optional(),
  required: z.boolean().optional().default(false),
  helperText: z.string().optional(),
  errorKey: z.string().optional(),
  testID: z.string().optional(),
})
