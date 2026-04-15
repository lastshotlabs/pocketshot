import { z } from 'zod'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import { extendComponentSchema } from '../../_base/schema'
import type { Action } from '../../../actions/types'

// Inline action schema for zod — the discriminated union is complex to replicate,
// so we accept z.unknown() and cast at runtime (opaque boundary).
const ActionSchema = z.custom<Action>()

const DataSpecSchema = z.union([z.string(), FromRefSchema])

export const DataListSchema = extendComponentSchema({
  id: z.string().optional(),
  data: DataSpecSchema.optional(),
  itemType: z.string(),
  keyExtractor: z.string().optional().default('id'),
  emptyMessage: z.string().optional().default('Nothing here yet'),
  loadingCount: z.number().int().positive().optional().default(3),
  onItemPress: ActionSchema.optional(),
  refreshable: z.boolean().optional().default(false),
  numColumns: z.number().int().positive().optional().default(1),
  estimatedItemSize: z.number().positive().optional().default(80),
  testID: z.string().optional(),
})
