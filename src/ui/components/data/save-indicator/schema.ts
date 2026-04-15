import { z } from 'zod'
import { extendComponentSchema } from '../../_base'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const SaveIndicatorSchema = extendComponentSchema({
  id: z.string().optional(),
  status: z
    .union([z.enum(['idle', 'saving', 'saved', 'error']), FromRefSchema])
    .default('idle'),
  idleLabel: z.string().optional().default(''),
  savingLabel: z.string().optional().default('Saving…'),
  savedLabel: z.string().optional().default('Saved'),
  errorLabel: z.string().optional().default('Error saving'),
  testID: z.string().optional(),
})


