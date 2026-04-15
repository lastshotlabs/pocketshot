import { z } from 'zod'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const InlineEditSchema = z.object({
  id: z.string(),
  value: z.union([z.string(), FromRefSchema]).optional(),
  defaultValue: z.string().optional().default(''),
  placeholder: z.string().optional().default('Click to edit'),
  inputType: z.enum(['text', 'number', 'email']).optional().default('text'),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
  emptyText: z.string().optional().default('—'),
  onSaveAction: ActionSchema.optional(),
  testID: z.string().optional(),
})
