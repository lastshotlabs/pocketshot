import { z } from 'zod'
import { extendComponentSchema } from '../../_base/schema'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

const LocationValueSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  address: z.string().optional(),
})

export const LocationInputSchema = extendComponentSchema({
  id: z.string(),
  label: z.string().optional(),
  placeholder: z.string().optional().default('Enter an address'),
  defaultValue: z.union([LocationValueSchema, FromRefSchema]).optional(),
  showPreview: z.boolean().optional().default(true),
  onChangeAction: ActionSchema.optional(),
  testID: z.string().optional(),
})
