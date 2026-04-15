import { z } from 'zod'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const PaginationSchema = z.object({
  id: z.string(),
  mode: z.enum(['pages', 'load-more', 'infinite']),
  totalPages: z.number().optional(),
  currentPage: z.union([z.number(), FromRefSchema]).optional(),
  pageSize: z.number().optional(),
  onPageChange: ActionSchema.optional(),
  onLoadMore: ActionSchema.optional(),
  testID: z.string().optional(),
})
