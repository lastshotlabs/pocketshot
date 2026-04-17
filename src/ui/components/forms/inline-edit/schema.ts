import { z } from 'zod'
import { extendComponentSchema, slotsSchema } from '../../_base/schema'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const InlineEditSchema = extendComponentSchema({
  id: z.string(),
  value: z.union([z.string(), FromRefSchema]).optional(),
  defaultValue: z.string().optional().default(''),
  placeholder: z.union([z.string(), FromRefSchema]).optional().default('Click to edit'),
  inputType: z.enum(['text', 'number', 'email']).optional().default('text'),
  prefix: z.union([z.string(), FromRefSchema]).optional(),
  suffix: z.union([z.string(), FromRefSchema]).optional(),
  emptyText: z.union([z.string(), FromRefSchema]).optional().default('-'),
  onSaveAction: ActionSchema.optional(),
  testID: z.string().optional(),
  slots: slotsSchema([
    'root',
    'displayContainer',
    'displayRow',
    'displayText',
    'emptyText',
    'editIcon',
    'affix',
    'editContainer',
    'editRow',
    'editInput',
    'editActions',
    'actionButton',
    'confirmText',
    'cancelText',
  ]).optional(),
})
