import { z } from 'zod'
import { extendComponentSchema, slotsSchema } from '../../_base/schema'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'

export const FormFieldSchema = extendComponentSchema({
  id: z.string().optional(),
  label: z.union([z.string(), FromRefSchema]).optional(),
  required: z.boolean().optional().default(false),
  helperText: z.union([z.string(), FromRefSchema]).optional(),
  errorKey: z.string().optional(),
  testID: z.string().optional(),
  slots: slotsSchema([
    'root',
    'container',
    'label',
    'required',
    'helperText',
    'errorText',
  ]).optional(),
})
