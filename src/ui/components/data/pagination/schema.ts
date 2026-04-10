import { z } from 'zod'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()
const FromRefSchema = z.object({ from: z.string() })

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
