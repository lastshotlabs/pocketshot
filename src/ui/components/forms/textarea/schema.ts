import { z } from 'zod'
import { extendComponentSchema, slotsSchema } from '../../_base/schema'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const TextareaSchema = extendComponentSchema({
  id: z.string(),
  label: z.string().optional(),
  placeholder: z.string().optional(),
  helperText: z.string().optional(),
  errorText: z.union([z.string(), FromRefSchema]).optional(),
  defaultValue: z.string().optional(),
  value: z.union([z.string(), FromRefSchema]).optional(),
  minRows: z.number().optional().default(3),
  maxRows: z.number().optional().default(8),
  maxLength: z.number().optional(),
  showCharCount: z.boolean().optional().default(false),
  onChangeAction: ActionSchema.optional(),
  slots: slotsSchema([
    'root',
    'container',
    'label',
    'inputWrapper',
    'input',
    'footer',
    'footerLeft',
    'helperText',
    'errorText',
    'charCount',
  ]).optional(),
})
