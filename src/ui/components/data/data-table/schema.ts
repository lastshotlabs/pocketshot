import { z } from 'zod'
import { extendComponentSchema } from '../../_base/schema'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const DataTableColumnSchema = z.object({
  key: z.string(),
  label: z.string(),
  sortable: z.boolean().optional().default(false),
  width: z.number().optional(),
  flex: z.number().optional().default(1),
  align: z.enum(['left', 'center', 'right']).optional().default('left'),
})

export const DataTableSchema = extendComponentSchema({
  id: z.string().optional(),
  data: z.union([z.string(), FromRefSchema]),
  columns: z.array(DataTableColumnSchema),
  onRowPress: ActionSchema.optional(),
  sortKey: z.union([z.string(), FromRefSchema]).optional(),
  sortDirection: z
    .union([z.enum(['asc', 'desc']), FromRefSchema])
    .optional()
    .default('asc'),
  emptyMessage: z.string().optional().default('No data'),
  loadingCount: z.number().optional().default(5),
  stickyHeader: z.boolean().optional().default(true),
  testID: z.string().optional(),
})
