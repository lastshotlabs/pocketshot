import { z } from 'zod'
import { extendComponentSchema, slotsSchema } from '../../_base/schema'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'

export const SaveIndicatorSchema = extendComponentSchema({
  id: z.string().optional(),
  status: z.union([z.enum(['idle', 'saving', 'saved', 'error']), FromRefSchema]).default('idle'),
  idleLabel: z.string().optional().default(''),
  savingLabel: z.string().optional().default('Savingâ€¦'),
  savedLabel: z.string().optional().default('Saved'),
  errorLabel: z.string().optional().default('Error saving'),
  slots: slotsSchema(['root', 'icon', 'label']).optional(),
  testID: z.string().optional(),
})
